const axios = require("axios");

// bKash configuration
const bkashConfig = {
    base_url:
        process.env.BKASH_BASE_URL ||
        "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
    username: process.env.BKASH_USERNAME,
    password: process.env.BKASH_PASSWORD,
    app_key: process.env.BKASH_APP_KEY,
    app_secret: process.env.BKASH_APP_SECRET,
};

// Global token storage (in production, use Redis or database)
let bkashToken = null;
let tokenExpiry = null;

/**
 * Get bKash auth token
 */
const getToken = async () => {
    try {
        // Check if token exists and is still valid
        if (bkashToken && tokenExpiry && new Date() < tokenExpiry) {
            return bkashToken;
        }

        const response = await axios.post(
            `${bkashConfig.base_url}/tokenized/checkout/token/grant`,
            {
                app_key: bkashConfig.app_key,
                app_secret: bkashConfig.app_secret,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    username: bkashConfig.username,
                    password: bkashConfig.password,
                },
            }
        );

        bkashToken = response.data.id_token;
        // Token typically expires in 1 hour
        tokenExpiry = new Date(Date.now() + 55 * 60 * 1000); // 55 minutes

        return bkashToken;
    } catch (error) {
        console.error(
            "bKash Token Error:",
            error.response?.data || error.message
        );
        throw new Error("Failed to get bKash token");
    }
};

/**
 * Create bKash payment
 */
const createPayment = async (req, res) => {
    try {
        const { amount, courseId, courseName, orderId } = req.body;

        // Validate required fields
        if (!amount || !courseId || !orderId) {
            return res.status(400).json({
                success: false,
                message: "Amount, courseId, and orderId are required",
            });
        }

        // Get auth token
        const token = await getToken();

        // Create payment request
        const paymentRequest = {
            mode: "0011", // 0011 for checkout
            payerReference: orderId,
            callbackURL: `${process.env.SERVER_URL}/api/bkash/callback`,
            amount: parseFloat(amount).toFixed(2),
            currency: "BDT",
            intent: "sale",
            merchantInvoiceNumber: orderId,
        };

        const response = await axios.post(
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

        if (response.data && response.data.paymentID) {
            return res.status(200).json({
                success: true,
                data: {
                    paymentID: response.data.paymentID,
                    bkashURL: response.data.bkashURL,
                    callbackURL: response.data.callbackURL,
                    successCallbackURL: response.data.successCallbackURL,
                    failureCallbackURL: response.data.failureCallbackURL,
                    cancelledCallbackURL: response.data.cancelledCallbackURL,
                },
            });
        } else {
            throw new Error("Invalid response from bKash");
        }
    } catch (error) {
        console.error(
            "bKash Create Payment Error:",
            error.response?.data || error.message
        );
        return res.status(500).json({
            success: false,
            message: "Failed to create payment",
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Execute bKash payment
 */
const executePayment = async (req, res) => {
    try {
        const { paymentID } = req.body;

        if (!paymentID) {
            return res.status(400).json({
                success: false,
                message: "Payment ID is required",
            });
        }

        // Get auth token
        const token = await getToken();

        const response = await axios.post(
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

        if (response.data && response.data.transactionStatus === "Completed") {
            return res.status(200).json({
                success: true,
                message: "Payment completed successfully",
                data: {
                    paymentID: response.data.paymentID,
                    trxID: response.data.trxID,
                    transactionStatus: response.data.transactionStatus,
                    amount: response.data.amount,
                    customerMsisdn: response.data.customerMsisdn,
                    merchantInvoiceNumber: response.data.merchantInvoiceNumber,
                },
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Payment execution failed",
                data: response.data,
            });
        }
    } catch (error) {
        console.error(
            "bKash Execute Payment Error:",
            error.response?.data || error.message
        );
        return res.status(500).json({
            success: false,
            message: "Failed to execute payment",
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Query bKash payment status
 */
const queryPayment = async (req, res) => {
    try {
        const { paymentID } = req.params;

        if (!paymentID) {
            return res.status(400).json({
                success: false,
                message: "Payment ID is required",
            });
        }

        // Get auth token
        const token = await getToken();

        const response = await axios.post(
            `${bkashConfig.base_url}/tokenized/checkout/payment/status`,
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

        return res.status(200).json({
            success: true,
            data: response.data,
        });
    } catch (error) {
        console.error(
            "bKash Query Payment Error:",
            error.response?.data || error.message
        );
        return res.status(500).json({
            success: false,
            message: "Failed to query payment",
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Refund bKash payment
 */
const refundPayment = async (req, res) => {
    try {
        const { paymentID, amount, trxID, sku, reason } = req.body;

        if (!paymentID || !amount || !trxID || !sku) {
            return res.status(400).json({
                success: false,
                message: "Payment ID, amount, trxID, and sku are required",
            });
        }

        // Get auth token
        const token = await getToken();

        const response = await axios.post(
            `${bkashConfig.base_url}/tokenized/checkout/payment/refund`,
            {
                paymentID,
                amount: parseFloat(amount).toFixed(2),
                trxID,
                sku,
                reason: reason || "Customer requested refund",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    authorization: token,
                    "x-app-key": bkashConfig.app_key,
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: "Refund processed successfully",
            data: response.data,
        });
    } catch (error) {
        console.error(
            "bKash Refund Error:",
            error.response?.data || error.message
        );
        return res.status(500).json({
            success: false,
            message: "Failed to process refund",
            error: error.response?.data || error.message,
        });
    }
};

/**
 * bKash callback handler
 */
const handleCallback = async (req, res) => {
    try {
        const { paymentID, status } = req.query;

        console.log("bKash Callback:", { paymentID, status });

        // Redirect based on status
        const clientURL = process.env.CLIENT_URL || "http://localhost:3000";

        if (status === "success") {
            return res.redirect(
                `${clientURL}/payment/success?paymentID=${paymentID}`
            );
        } else if (status === "failure") {
            return res.redirect(
                `${clientURL}/payment/failure?paymentID=${paymentID}`
            );
        } else if (status === "cancel") {
            return res.redirect(
                `${clientURL}/payment/cancel?paymentID=${paymentID}`
            );
        } else {
            return res.redirect(`${clientURL}/payment/error`);
        }
    } catch (error) {
        console.error("bKash Callback Error:", error);
        const clientURL = process.env.CLIENT_URL || "http://localhost:3000";
        return res.redirect(`${clientURL}/payment/error`);
    }
};

module.exports = {
    createPayment,
    executePayment,
    queryPayment,
    refundPayment,
    handleCallback,
    getToken,
};
