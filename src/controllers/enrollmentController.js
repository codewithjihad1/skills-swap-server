const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

/**
 * @route   POST /api/enrollments/enroll/:courseId
 * @desc    Enroll a user into a course
 * @access  Private
 */
const enrollInCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { userId } = req.body; // TODO: Get from req.user when auth is implemented

        if (!userId) {
            return res.status(400).json({
                error: "User ID is required",
            });
        }

        // Check if course exists and is published
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                error: "Course not found",
            });
        }

        if (!course.published) {
            return res.status(400).json({
                error: "Cannot enroll in an unpublished course",
            });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            user: userId,
            course: courseId,
        });

        if (existingEnrollment) {
            return res.status(400).json({
                error: "Already enrolled in this course",
                enrollment: existingEnrollment,
            });
        }

        // Create enrollment
        const enrollment = new Enrollment({
            user: userId,
            course: courseId,
            paymentStatus: course.price > 0 ? "pending" : "free",
            paymentAmount: course.price,
        });

        await enrollment.save();

        // Update course enrollment count
        course.enrollmentCount += 1;
        await course.save();

        // Populate user and course details
        await enrollment.populate([
            { path: "user", select: "name email avatar" },
            {
                path: "course",
                select: "title description thumbnail instructor duration",
            },
        ]);

        res.status(201).json({
            success: true,
            message: "Successfully enrolled in course",
            enrollment,
        });
    } catch (error) {
        console.error("Error enrolling in course:", error);

        // Handle duplicate enrollment error
        if (error.code === 11000) {
            return res.status(400).json({
                error: "Already enrolled in this course",
            });
        }

        res.status(500).json({
            error: "Failed to enroll in course",
            details: error.message,
        });
    }
};

/**
 * @route   GET /api/enrollments/my-courses
 * @desc    Get all enrolled courses for current user
 * @access  Private
 */
const getMyEnrolledCourses = async (req, res) => {
    try {
        const { userId } = req.query; // TODO: Get from req.user when auth is implemented
        const { status, sortBy = "enrolledAt", order = "desc" } = req.query;

        if (!userId) {
            return res.status(400).json({
                error: "User ID is required",
            });
        }

        // Build query
        const query = { user: userId };

        if (status) {
            query.status = status;
        }

        // Build sort
        const sortOrder = order === "asc" ? 1 : -1;
        const sort = { [sortBy]: sortOrder };

        // Get enrollments
        const enrollments = await Enrollment.find(query)
            .sort(sort)
            .populate({
                path: "course",
                select: "title description thumbnail instructor category level duration price rating enrollmentCount",
                populate: {
                    path: "instructor",
                    select: "name email avatar",
                },
            })
            .lean();

        // Calculate summary statistics
        const stats = {
            total: enrollments.length,
            active: enrollments.filter((e) => e.status === "active").length,
            completed: enrollments.filter((e) => e.status === "completed")
                .length,
            dropped: enrollments.filter((e) => e.status === "dropped").length,
            totalHoursEnrolled: enrollments.reduce((total, e) => {
                return total + (e.course?.duration || 0);
            }, 0),
            averageProgress:
                enrollments.length > 0
                    ? Math.round(
                          enrollments.reduce((total, e) => {
                              return (
                                  total + (e.progress?.progressPercentage || 0)
                              );
                          }, 0) / enrollments.length
                      )
                    : 0,
        };

        res.status(200).json({
            success: true,
            count: enrollments.length,
            stats,
            enrollments,
        });
    } catch (error) {
        console.error("Error fetching enrolled courses:", error);
        res.status(500).json({
            error: "Failed to fetch enrolled courses",
            details: error.message,
        });
    }
};

/**
 * @route   GET /api/enrollments/progress/:courseId
 * @desc    Get user progress for a specific course
 * @access  Private
 */
const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { userId } = req.query; // TODO: Get from req.user when auth is implemented

        if (!userId) {
            return res.status(400).json({
                error: "User ID is required",
            });
        }

        // Find enrollment
        const enrollment = await Enrollment.findOne({
            user: userId,
            course: courseId,
        })
            .populate({
                path: "course",
                select: "title description syllabus duration instructor",
                populate: {
                    path: "instructor",
                    select: "name email avatar",
                },
            })
            .lean();

        if (!enrollment) {
            return res.status(404).json({
                error: "Not enrolled in this course",
            });
        }

        // Build detailed progress information
        const courseProgress = {
            enrollmentId: enrollment._id,
            course: enrollment.course,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
            completedAt: enrollment.completedAt,
            progress: {
                progressPercentage: enrollment.progress.progressPercentage,
                totalLessonsCompleted:
                    enrollment.progress.totalLessonsCompleted,
                lastAccessedAt: enrollment.progress.lastAccessedAt,
                completedLessons: enrollment.progress.completedLessons,
            },
            certificateIssued: enrollment.certificateIssued,
            certificateIssuedAt: enrollment.certificateIssuedAt,
            rating: enrollment.rating,
        };

        // Add syllabus with completion status
        if (enrollment.course.syllabus) {
            courseProgress.syllabusProgress = enrollment.course.syllabus.map(
                (week) => {
                    const weekTopics = week.topics || [];
                    const completedTopics = weekTopics.map((topic, index) => {
                        const isCompleted =
                            enrollment.progress.completedLessons.some(
                                (lesson) =>
                                    lesson.week === week.week &&
                                    lesson.lessonIndex === index
                            );
                        return {
                            topic,
                            index,
                            completed: isCompleted,
                        };
                    });

                    const completedCount = completedTopics.filter(
                        (t) => t.completed
                    ).length;

                    return {
                        week: week.week,
                        title: week.title,
                        duration: week.duration,
                        topics: completedTopics,
                        totalTopics: weekTopics.length,
                        completedTopics: completedCount,
                        weekProgress:
                            weekTopics.length > 0
                                ? Math.round(
                                      (completedCount / weekTopics.length) * 100
                                  )
                                : 0,
                    };
                }
            );
        }

        res.status(200).json({
            success: true,
            progress: courseProgress,
        });
    } catch (error) {
        console.error("Error fetching course progress:", error);
        res.status(500).json({
            error: "Failed to fetch course progress",
            details: error.message,
        });
    }
};

/**
 * @route   PUT /api/enrollments/progress/:courseId
 * @desc    Update lesson progress (mark completed/uncompleted)
 * @access  Private
 */
const updateLessonProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { userId, week, lessonIndex, completed = true } = req.body;

        // TODO: Get userId from req.user when auth is implemented
        if (!userId) {
            return res.status(400).json({
                error: "User ID is required",
            });
        }

        if (week === undefined || lessonIndex === undefined) {
            return res.status(400).json({
                error: "Week and lessonIndex are required",
            });
        }

        // Find enrollment
        const enrollment = await Enrollment.findOne({
            user: userId,
            course: courseId,
        });

        if (!enrollment) {
            return res.status(404).json({
                error: "Not enrolled in this course",
            });
        }

        // Update progress
        if (completed) {
            enrollment.markLessonCompleted(week, lessonIndex);
        } else {
            enrollment.unmarkLessonCompleted(week, lessonIndex);
        }

        // Update last accessed time
        enrollment.progress.lastAccessedAt = new Date();

        await enrollment.save();

        // Populate for response
        await enrollment.populate([
            {
                path: "course",
                select: "title syllabus",
            },
        ]);

        res.status(200).json({
            success: true,
            message: `Lesson ${
                completed ? "completed" : "uncompleted"
            } successfully`,
            progress: {
                progressPercentage: enrollment.progress.progressPercentage,
                totalLessonsCompleted:
                    enrollment.progress.totalLessonsCompleted,
                completedLessons: enrollment.progress.completedLessons,
                status: enrollment.status,
            },
        });
    } catch (error) {
        console.error("Error updating lesson progress:", error);
        res.status(500).json({
            error: "Failed to update lesson progress",
            details: error.message,
        });
    }
};

/**
 * @route   DELETE /api/enrollments/unenroll/:courseId
 * @desc    Unenroll from a course
 * @access  Private
 */
const unenrollFromCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { userId } = req.body; // TODO: Get from req.user when auth is implemented

        if (!userId) {
            return res.status(400).json({
                error: "User ID is required",
            });
        }

        // Find enrollment
        const enrollment = await Enrollment.findOne({
            user: userId,
            course: courseId,
        });

        if (!enrollment) {
            return res.status(404).json({
                error: "Not enrolled in this course",
            });
        }

        // Check if course is completed
        if (enrollment.status === "completed") {
            return res.status(400).json({
                error: "Cannot unenroll from a completed course",
            });
        }

        // Update status instead of deleting (for record keeping)
        enrollment.status = "dropped";
        await enrollment.save();

        // Update course enrollment count
        const course = await Course.findById(courseId);
        if (course && course.enrollmentCount > 0) {
            course.enrollmentCount -= 1;
            await course.save();
        }

        res.status(200).json({
            success: true,
            message: "Successfully unenrolled from course",
        });
    } catch (error) {
        console.error("Error unenrolling from course:", error);
        res.status(500).json({
            error: "Failed to unenroll from course",
            details: error.message,
        });
    }
};

/**
 * @route   POST /api/enrollments/rate/:courseId
 * @desc    Rate a course (bonus endpoint)
 * @access  Private
 */
const rateCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { userId, score, review } = req.body;

        // TODO: Get userId from req.user when auth is implemented
        if (!userId) {
            return res.status(400).json({
                error: "User ID is required",
            });
        }

        if (!score || score < 1 || score > 5) {
            return res.status(400).json({
                error: "Rating score must be between 1 and 5",
            });
        }

        // Find enrollment
        const enrollment = await Enrollment.findOne({
            user: userId,
            course: courseId,
        });

        if (!enrollment) {
            return res.status(404).json({
                error: "Not enrolled in this course",
            });
        }

        // Check if already rated
        const isUpdating = !!enrollment.rating?.score;

        // Update rating
        enrollment.rating = {
            score,
            review: review || "",
            ratedAt: new Date(),
        };

        await enrollment.save();

        // Update course average rating
        const course = await Course.findById(courseId);
        if (course) {
            // Get all ratings for this course
            const enrollments = await Enrollment.find({
                course: courseId,
                "rating.score": { $exists: true },
            });

            const totalRatings = enrollments.length;
            const averageRating =
                enrollments.reduce((sum, e) => sum + e.rating.score, 0) /
                totalRatings;

            course.rating = {
                average: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                count: totalRatings,
            };

            await course.save();
        }

        res.status(200).json({
            success: true,
            message: isUpdating
                ? "Rating updated successfully"
                : "Course rated successfully",
            rating: enrollment.rating,
        });
    } catch (error) {
        console.error("Error rating course:", error);
        res.status(500).json({
            error: "Failed to rate course",
            details: error.message,
        });
    }
};

module.exports = {
    enrollInCourse,
    getMyEnrolledCourses,
    getCourseProgress,
    updateLessonProgress,
    unenrollFromCourse,
    rateCourse,
};
