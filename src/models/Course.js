const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Course title is required"],
            trim: true,
            maxlength: [200, "Course title cannot exceed 200 characters"],
        },
        description: {
            type: String,
            required: [true, "Course description is required"],
            trim: true,
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Instructor is required"],
        },
        category: {
            type: String,
            required: [true, "Course category is required"],
            trim: true,
        },
        level: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "beginner",
        },
        duration: {
            type: Number, // Duration in hours
            required: [true, "Course duration is required"],
            min: [0, "Duration must be positive"],
        },
        thumbnail: {
            type: String, // Image URL
            default: "",
        },
        price: {
            type: Number,
            default: 0,
            min: [0, "Price must be positive"],
        },
        currency: {
            type: String,
            default: "USD",
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        syllabus: [
            {
                title: {
                    type: String,
                    required: true,
                },
                description: String,
                duration: Number, // Duration in minutes
                order: Number,
            },
        ],
        prerequisites: [
            {
                type: String,
                trim: true,
            },
        ],
        learningOutcomes: [
            {
                type: String,
                trim: true,
            },
        ],
        published: {
            type: Boolean,
            default: false,
        },
        publishedAt: {
            type: Date,
        },
        enrollmentCount: {
            type: Number,
            default: 0,
        },
        rating: {
            average: {
                type: Number,
                default: 0,
                min: 0,
                max: 5,
            },
            count: {
                type: Number,
                default: 0,
            },
        },
        language: {
            type: String,
            default: "English",
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
courseSchema.index({ instructor: 1, published: 1 });
courseSchema.index({ category: 1, published: 1 });
courseSchema.index({ published: 1, createdAt: -1 });
courseSchema.index({ title: "text", description: "text" }); // Text search

// Update lastUpdated on save
courseSchema.pre("save", function (next) {
    if (this.isModified() && !this.isNew) {
        this.lastUpdated = Date.now();
    }
    next();
});

// Set publishedAt when course is published
courseSchema.pre("save", function (next) {
    if (this.isModified("published") && this.published && !this.publishedAt) {
        this.publishedAt = Date.now();
    }
    next();
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
