const mongoose = require("mongoose");
const { Schema } = mongoose;

const enrollmentSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        course: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },
        enrolledAt: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["active", "completed", "dropped"],
            default: "active",
        },
        progress: {
            completedLessons: [
                {
                    week: { type: Number, required: true },
                    lessonIndex: { type: Number, required: true },
                    completedAt: { type: Date, default: Date.now },
                },
            ],
            totalLessonsCompleted: {
                type: Number,
                default: 0,
            },
            progressPercentage: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
            },
            lastAccessedAt: {
                type: Date,
                default: Date.now,
            },
        },
        completedAt: {
            type: Date,
        },
        certificateIssued: {
            type: Boolean,
            default: false,
        },
        certificateIssuedAt: {
            type: Date,
        },
        rating: {
            score: {
                type: Number,
                min: 0,
                max: 5,
            },
            review: {
                type: String,
                maxlength: 1000,
            },
            ratedAt: {
                type: Date,
            },
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "refunded", "free"],
            default: "free",
        },
        paymentAmount: {
            type: Number,
            default: 0,
        },
        notes: {
            type: String,
            maxlength: 2000,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for unique user-course enrollment
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// Index for querying active enrollments
enrollmentSchema.index({ user: 1, status: 1 });

// Index for course enrollment count
enrollmentSchema.index({ course: 1, status: 1 });

// Pre-save middleware to update progress percentage
enrollmentSchema.pre("save", async function (next) {
    if (this.isModified("progress.completedLessons")) {
        // Update last accessed time
        this.progress.lastAccessedAt = new Date();

        // Update total lessons completed
        this.progress.totalLessonsCompleted =
            this.progress.completedLessons.length;

        // Calculate progress percentage
        // We'll need to fetch the course to get total lessons
        try {
            const Course = mongoose.model("Course");
            const course = await Course.findById(this.course);

            if (course && course.syllabus && course.syllabus.length > 0) {
                // Count total topics across all syllabus items
                const totalLessons = course.syllabus.reduce((total, week) => {
                    return total + (week.topics ? week.topics.length : 0);
                }, 0);

                if (totalLessons > 0) {
                    this.progress.progressPercentage = Math.round(
                        (this.progress.totalLessonsCompleted / totalLessons) *
                            100
                    );

                    // If 100% complete, mark as completed
                    if (
                        this.progress.progressPercentage >= 100 &&
                        this.status === "active"
                    ) {
                        this.status = "completed";
                        this.completedAt = new Date();
                    }
                }
            }
        } catch (error) {
            console.error("Error calculating progress:", error);
        }
    }

    next();
});

// Static method to get enrollment statistics for a course
enrollmentSchema.statics.getCourseStats = async function (courseId) {
    const stats = await this.aggregate([
        { $match: { course: mongoose.Types.ObjectId(courseId) } },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);

    return stats;
};

// Instance method to check if a lesson is completed
enrollmentSchema.methods.isLessonCompleted = function (week, lessonIndex) {
    return this.progress.completedLessons.some(
        (lesson) => lesson.week === week && lesson.lessonIndex === lessonIndex
    );
};

// Instance method to mark lesson as completed
enrollmentSchema.methods.markLessonCompleted = function (week, lessonIndex) {
    // Check if already completed
    if (!this.isLessonCompleted(week, lessonIndex)) {
        this.progress.completedLessons.push({
            week,
            lessonIndex,
            completedAt: new Date(),
        });
    }
};

// Instance method to unmark lesson as completed
enrollmentSchema.methods.unmarkLessonCompleted = function (week, lessonIndex) {
    this.progress.completedLessons = this.progress.completedLessons.filter(
        (lesson) =>
            !(lesson.week === week && lesson.lessonIndex === lessonIndex)
    );
};

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

module.exports = Enrollment;
