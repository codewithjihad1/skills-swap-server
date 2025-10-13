const mongoose = require("mongoose");

const swapRequestSchema = new mongoose.Schema(
    {
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        skillOffered: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skill",
            required: true,
        },
        skillProvider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        skillRequested: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skill",
            required: true,
        },
        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "rejected",
                "scheduled",
                "completed",
                "cancelled",
            ],
            default: "pending",
        },
        message: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        responseMessage: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        respondedAt: {
            type: Date,
        },
        completedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Indexes for faster queries
swapRequestSchema.index({ requester: 1, status: 1 });
swapRequestSchema.index({ skillProvider: 1, status: 1 });
swapRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("SwapRequest", swapRequestSchema);
