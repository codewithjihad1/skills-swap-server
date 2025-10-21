const Payment = require("../models/Payment");
const bkashController = require("./bkashController");

/**
 * Initialize payment - creates payment record and initiates bKash payment
 */
const initiatePayment = async (req, res) => {
    try {
        const {
            userId,
            userEmail,
            courseId,
            courseName,
            amount,
            paymentMethod,
        } = req.body;

        // Validate required fields
        if (
            !userId ||
            !userEmail ||
            !courseId ||
            !courseName ||
            !amount ||
            !paymentMethod
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Generate unique order ID
        const orderId = `ORD-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)
            .toUpperCase()}`;

        // Create payment record
        const payment = new Payment({
            userId,
            userEmail,
            courseId,
            courseName,
            orderId,
            amount,
            paymentMethod,
            status: "pending",
            transactionStatus: "Initiated",
        });

        await payment.save();

        // If bKash, create bKash payment
        if (paymentMethod === "bkash") {
            try {
                // Create bKash payment request
                const bkashPayload = {
                    amount,
                    courseId,
                    courseName,
                    orderId,
                };

                // Call bKash create payment (internally)
                const token = await bkashController.getToken();
                const axios = require("axios");

                const bkashConfig = {
                    base_url:
                        process.env.BKASH_BASE_URL ||
                        "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
                    app_key: process.env.BKASH_APP_KEY,
                };

                const paymentRequest = {
                    mode: "0011",
                    payerReference: orderId,
                    callbackURL: `${process.env.SERVER_URL}/api/bkash/callback`,
                    amount: parseFloat(amount).toFixed(2),
                    currency: "BDT",
                    intent: "sale",
                    merchantInvoiceNumber: orderId,
                };

                const bkashResponse = await axios.post(
                    `${bkashConfig.base_url}/tokenized/checkout/create`,
                    paymentRequest,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            authorization: token,
                            "x-app-key": bkashConfig.app_key,
                        },
                    }
                );

                if (bkashResponse.data && bkashResponse.data.paymentID) {
                    // Update payment record with bKash details
                    payment.paymentID = bkashResponse.data.paymentID;
                    payment.bkashURL = bkashResponse.data.bkashURL;
                    payment.callbackURL = bkashResponse.data.callbackURL;
                    payment.status = "processing";
                    await payment.save();

                    return res.status(200).json({
                        success: true,
                        message: "Payment initiated successfully",
                        data: {
                            orderId: payment.orderId,
                            paymentID: bkashResponse.data.paymentID,
                            bkashURL: bkashResponse.data.bkashURL,
                            amount: payment.amount,
                        },
                    });
                } else {
                    throw new Error("Invalid response from bKash");
                }
            } catch (bkashError) {
                // Update payment status to failed
                payment.status = "failed";
                payment.transactionStatus = "Failed";
                payment.errorMessage = bkashError.message;
                payment.failedAt = new Date();
                await payment.save();

                return res.status(500).json({
                    success: false,
                    message: "Failed to initiate bKash payment",
                    error: bkashError.response?.data || bkashError.message,
                });
            }
        }

        // For other payment methods (future implementation)
        return res.status(200).json({
            success: true,
            message: "Payment record created",
            data: {
                orderId: payment.orderId,
                amount: payment.amount,
                paymentMethod: payment.paymentMethod,
            },
        });
    } catch (error) {
        console.error("Initiate Payment Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to initiate payment",
            error: error.message,
        });
    }
};

/**
 * Complete payment - executes bKash payment and updates record
 */
const completePayment = async (req, res) => {
    try {
        const { paymentID, orderId } = req.body;

        if (!paymentID || !orderId) {
            return res.status(400).json({
                success: false,
                message: "Payment ID and Order ID are required",
            });
        }

        // Find payment record
        const payment = await Payment.findOne({ orderId });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found",
            });
        }

        // Execute bKash payment
        const token = await bkashController.getToken();
        const axios = require("axios");

        const bkashConfig = {
            base_url:
                process.env.BKASH_BASE_URL ||
                "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
            app_key: process.env.BKASH_APP_KEY,
        };

        const executeResponse = await axios.post(
            `${bkashConfig.base_url}/tokenized/checkout/execute`,
            { paymentID },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    authorization: token,
                    "x-app-key": bkashConfig.app_key,
                },
            }
        );

        if (
            executeResponse.data &&
            executeResponse.data.transactionStatus === "Completed"
        ) {
            // Update payment record
            payment.paymentID = executeResponse.data.paymentID;
            payment.trxID = executeResponse.data.trxID;
            payment.transactionStatus = "Completed";
            payment.status = "completed";
            payment.customerMsisdn = executeResponse.data.customerMsisdn;
            payment.completedAt = new Date();
            await payment.save();

            return res.status(200).json({
                success: true,
                message: "Payment completed successfully",
                data: {
                    orderId: payment.orderId,
                    paymentID: payment.paymentID,
                    trxID: payment.trxID,
                    amount: payment.amount,
                    status: payment.status,
                },
            });
        } else {
            // Payment failed
            payment.status = "failed";
            payment.transactionStatus = "Failed";
            payment.errorMessage = "Payment execution failed";
            payment.failedAt = new Date();
            await payment.save();

            return res.status(400).json({
                success: false,
                message: "Payment execution failed",
                data: executeResponse.data,
            });
        }
    } catch (error) {
        console.error("Complete Payment Error:", error);

        // Update payment status if possible
        if (req.body.orderId) {
            const payment = await Payment.findOne({
                orderId: req.body.orderId,
            });
            if (payment) {
                payment.status = "failed";
                payment.transactionStatus = "Failed";
                payment.errorMessage = error.message;
                payment.failedAt = new Date();
                await payment.save();
            }
        }

        return res.status(500).json({
            success: false,
            message: "Failed to complete payment",
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Get payment status
 */
const getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        const payment = await Payment.findOne({ orderId })
            .populate("userId", "name email")
            .populate("courseId", "title thumbnail");

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        console.error("Get Payment Status Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get payment status",
            error: error.message,
        });
    }
};

/**
 * Get user's payment history
 */
const getUserPayments = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, limit = 10, page = 1 } = req.query;

        const query = { userId };
        if (status) {
            query.status = status;
        }

        const payments = await Payment.find(query)
            .populate("courseId", "title thumbnail")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Payment.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: {
                payments,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error("Get User Payments Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get user payments",
            error: error.message,
        });
    }
};

module.exports = {
    initiatePayment,
    completePayment,
    getPaymentStatus,
    getUserPayments,
};
