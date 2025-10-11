const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        swapRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SwapRequest",
            required: true,
        },
        participants: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                email: {
                    type: String,
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
                role: {
                    type: String,
                    enum: ["requester", "provider"],
                    required: true,
                },
            },
        ],
        scheduledDate: {
            type: Date,
            required: true,
        },
        duration: {
            type: Number, // Duration in minutes
            default: 60,
        },
        status: {
            type: String,
            enum: ["scheduled", "completed", "cancelled", "rescheduled"],
            default: "scheduled",
        },
        meetingLink: {
            type: String,
            required: true,
        },
        googleCalendar: {
            eventId: {
                type: String,
                required: true,
            },
            htmlLink: {
                type: String,
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        },
        skill: {
            skillId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Skill",
            },
            title: String,
            category: String,
        },
        notes: {
            type: String,
        },
        reminder: {
            sent: {
                type: Boolean,
                default: false,
            },
            sentAt: Date,
        },
        cancellationReason: String,
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
sessionSchema.index({ "participants.userId": 1 });
sessionSchema.index({ scheduledDate: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ swapRequest: 1 });

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
