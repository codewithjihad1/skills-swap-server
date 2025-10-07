const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: String,
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        messageType: {
            type: String,
            enum: ["text", "image", "file", "system"],
            default: "text",
        },
        attachments: [
            {
                url: String,
                fileName: String,
                fileSize: Number,
                mimeType: String,
            },
        ],
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
        isDelivered: {
            type: Boolean,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        skillContext: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skill",
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient conversation queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model("Message", messageSchema);
