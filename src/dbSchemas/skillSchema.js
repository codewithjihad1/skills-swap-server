const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
        },

        category: {
            type: String, // e.g., "Programming", "Music", "Cooking"
            required: true,
        },

        proficiency: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
            required: true,
        },

        tags: [
            {
                type: String, // e.g., ["React", "Guitar", "UI/UX"]
            },
        ],

        offeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        exchangeFor: [
            {
                type: String, // skills user is looking for in return
            },
        ],

        availability: {
            type: String, // e.g., "Weekends", "Evenings", "Flexible"
            default: "Flexible",
        },

        location: {
            type: String, // if physical meetup is needed
            default: "Remote",
        },

        mode: {
            type: String,
            enum: ["Online", "Offline", "Both"],
            default: "Online",
        },

        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },

        swapCount: {
            type: Number,
            default: 0, // how many times this skill was swapped
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Skill", skillSchema);
