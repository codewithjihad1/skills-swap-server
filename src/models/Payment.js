const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        // User info
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
        },

        // Course info
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        courseName: {
            type: String,
            required: true,
        },

        // Order info
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "BDT",
        },

        // Payment method
        paymentMethod: {
            type: String,
            enum: ["bkash", "nagad", "card"],
            required: true,
        },

        // bKash specific fields
        paymentID: {
            type: String,
            sparse: true, // Allow null but enforce uniqueness when present
        },
        trxID: {
            type: String,
            sparse: true,
        },
        transactionStatus: {
            type: String,
            enum: [
                "Initiated",
                "Pending",
                "Completed",
                "Failed",
                "Cancelled",
                "Refunded",
            ],
            default: "Initiated",
        },
        customerMsisdn: {
            type: String,
        },

        // URLs
        bkashURL: String,
        callbackURL: String,

        // Status tracking
        status: {
            type: String,
            enum: [
                "pending",
                "processing",
                "completed",
                "failed",
                "cancelled",
                "refunded",
            ],
            default: "pending",
        },

        // Error handling
        errorMessage: String,

        // Refund info
        refundAmount: Number,
        refundReason: String,
        refundedAt: Date,

        // Timestamps
        initiatedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: Date,
        failedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Indexes
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ courseId: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ paymentID: 1 });
paymentSchema.index({ trxID: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
