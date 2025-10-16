// src/dbSchemas/lessonSchema.js
const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Lesson title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"]
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, "Description cannot exceed 1000 characters"]
        },
        content: {
            type: String,
            required: [true, "Lesson content is required"]
        },
        videoUrl: {
            type: String,
            trim: true
        },
        duration: {
            type: Number, // in minutes
            default: 0
        },
        order: {
            type: Number,
            required: [true, "Lesson order is required"],
            min: 1
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "Course reference is required"]
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Instructor reference is required"]
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        resources: [
            {
                title: String,
                url: String,
                type: {
                    type: String,
                    enum: ["pdf", "document", "image", "code", "other"]
                }
            }
        ],
        prerequisites: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson"
        }],
        learningObjectives: [String],
        tags: [String]
    },
    {
        timestamps: true
    }
);

// Compound index for course and order to ensure unique order per course
lessonSchema.index({ course: 1, order: 1 }, { unique: true });

// Index for efficient queries
lessonSchema.index({ course: 1, isPublished: 1 });
lessonSchema.index({ instructor: 1 });

module.exports = mongoose.model("Lesson", lessonSchema);