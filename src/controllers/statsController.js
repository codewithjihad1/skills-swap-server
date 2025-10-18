// src/controllers/statsController.js

const User = require("../dbSchemas/userShema");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

/**
 * Get admin dashboard statistics
 * @route GET /api/stats/admin
 * @access Private (Admin only)
 */
exports.getAdminStats = async (req, res) => {
    try {
        // Total Students (users with role 'user')
        const totalStudents = await User.countDocuments({ role: "user" });

        // Total Instructors
        const totalInstructors = await User.countDocuments({
            role: "instructor",
        });

        // Active Courses (published courses)
        const activeCourses = await Course.countDocuments({ published: true });

        // Total Courses (including drafts)
        const totalCourses = await Course.countDocuments();

        // Total Enrollments
        const totalEnrollments = await Enrollment.countDocuments();

        // Completion Rate (completed enrollments / total enrollments * 100)
        const completedEnrollments = await Enrollment.countDocuments({
            status: "completed",
        });
        const completionRate =
            totalEnrollments > 0
                ? Math.round((completedEnrollments / totalEnrollments) * 100)
                : 0;

        // Average Rating across all courses
        const coursesWithRatings = await Course.find({
            "rating.count": { $gt: 0 },
        });
        const averageRating =
            coursesWithRatings.length > 0
                ? (
                      coursesWithRatings.reduce(
                          (sum, course) => sum + course.rating.average,
                          0
                      ) / coursesWithRatings.length
                  ).toFixed(1)
                : 0;

        // Total Earnings (sum of all course prices * enrollments)
        const earnings = await Course.aggregate([
            {
                $match: { published: true },
            },
            {
                $project: {
                    totalEarnings: {
                        $multiply: ["$price", "$enrollmentCount"],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$totalEarnings" },
                },
            },
        ]);

        const totalEarnings =
            earnings.length > 0 ? earnings[0].totalEarnings : 0;

        // This Month Earnings (enrollments created this month)
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const thisMonthEnrollments = await Enrollment.find({
            enrolledAt: { $gte: firstDayOfMonth },
        }).populate("course");

        const thisMonthEarnings = thisMonthEnrollments.reduce(
            (sum, enrollment) => sum + (enrollment.course?.price || 0),
            0
        );

        // Active Students (students with at least one active enrollment)
        const activeStudents = await Enrollment.distinct("user", {
            status: "active",
        });

        // Recent Enrollments (last 7 days)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentEnrollments = await Enrollment.countDocuments({
            enrolledAt: { $gte: sevenDaysAgo },
        });

        res.status(200).json({
            success: true,
            stats: {
                totalStudents,
                totalInstructors,
                activeCourses,
                totalCourses,
                completionRate,
                averageRating: parseFloat(averageRating),
                totalEarnings: Math.round(totalEarnings),
                thisMonthEarnings: Math.round(thisMonthEarnings),
                totalEnrollments,
                activeStudents: activeStudents.length,
                recentEnrollments,
            },
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({
            error: "Failed to fetch admin statistics",
            details: error.message,
        });
    }
};

/**
 * Get instructor dashboard statistics
 * @route GET /api/stats/instructor/:instructorId
 * @access Private (Instructor only)
 */
exports.getInstructorStats = async (req, res) => {
    try {
        const { instructorId } = req.params;

        // Validate instructor exists
        const instructor = await User.findById(instructorId);
        if (!instructor) {
            return res.status(404).json({ error: "Instructor not found" });
        }

        if (instructor.role !== "instructor" && instructor.role !== "admin") {
            return res.status(403).json({
                error: "User is not an instructor",
            });
        }

        // Get instructor's courses
        const instructorCourses = await Course.find({
            instructor: instructorId,
        });

        const courseIds = instructorCourses.map((course) => course._id);

        // Total Students (unique enrollments across all instructor's courses)
        const enrollments = await Enrollment.find({
            course: { $in: courseIds },
        });

        const totalStudents = new Set(enrollments.map((e) => e.user.toString()))
            .size;

        // Active Courses (published courses)
        const activeCourses = instructorCourses.filter(
            (c) => c.published
        ).length;

        // Completion Rate
        const completedEnrollments = enrollments.filter(
            (e) => e.status === "completed"
        ).length;
        const completionRate =
            enrollments.length > 0
                ? Math.round((completedEnrollments / enrollments.length) * 100)
                : 0;

        // Average Rating across instructor's courses
        const coursesWithRatings = instructorCourses.filter(
            (c) => c.rating.count > 0
        );
        const averageRating =
            coursesWithRatings.length > 0
                ? (
                      coursesWithRatings.reduce(
                          (sum, course) => sum + course.rating.average,
                          0
                      ) / coursesWithRatings.length
                  ).toFixed(1)
                : 0;

        // Total Earnings
        const totalEarnings = instructorCourses.reduce(
            (sum, course) => sum + course.price * course.enrollmentCount,
            0
        );

        // This Month Earnings
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const thisMonthEnrollments = await Enrollment.find({
            course: { $in: courseIds },
            enrolledAt: { $gte: firstDayOfMonth },
        }).populate("course");

        const thisMonthEarnings = thisMonthEnrollments.reduce(
            (sum, enrollment) => sum + (enrollment.course?.price || 0),
            0
        );

        // Active Students (students currently enrolled)
        const activeEnrollments = enrollments.filter(
            (e) => e.status === "active"
        );
        const activeStudents = new Set(
            activeEnrollments.map((e) => e.user.toString())
        ).size;

        // Total Enrollments
        const totalEnrollments = enrollments.length;

        res.status(200).json({
            success: true,
            stats: {
                totalStudents,
                activeCourses,
                completionRate,
                averageRating: parseFloat(averageRating),
                totalEarnings: Math.round(totalEarnings),
                thisMonthEarnings: Math.round(thisMonthEarnings),
                activeStudents,
                totalEnrollments,
                totalCourses: instructorCourses.length,
            },
        });
    } catch (error) {
        console.error("Error fetching instructor stats:", error);
        res.status(500).json({
            error: "Failed to fetch instructor statistics",
            details: error.message,
        });
    }
};

/**
 * Get student dashboard statistics
 * @route GET /api/stats/student/:studentId
 * @access Private (Student only)
 */
exports.getStudentStats = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Validate student exists
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Get student's enrollments
        const enrollments = await Enrollment.find({ user: studentId }).populate(
            "course"
        );

        // Total Courses Enrolled
        const totalCoursesEnrolled = enrollments.length;

        // Active Courses
        const activeCourses = enrollments.filter(
            (e) => e.status === "active"
        ).length;

        // Completed Courses
        const completedCourses = enrollments.filter(
            (e) => e.status === "completed"
        ).length;

        // Overall Progress (average of all course progress)
        const overallProgress =
            enrollments.length > 0
                ? Math.round(
                      enrollments.reduce(
                          (sum, e) => sum + e.progress.progressPercentage,
                          0
                      ) / enrollments.length
                  )
                : 0;

        // Total Hours Learned (sum of completed course durations)
        const totalHoursLearned = enrollments.reduce((sum, enrollment) => {
            if (enrollment.status === "completed" && enrollment.course) {
                return sum + enrollment.course.duration;
            }
            return sum;
        }, 0);

        // Certificates Earned
        const certificatesEarned = completedCourses;

        // Total Amount Spent
        const totalAmountSpent = enrollments.reduce(
            (sum, enrollment) => sum + (enrollment.course?.price || 0),
            0
        );

        // Current Streak (days of continuous learning)
        // This is a simple implementation - can be enhanced
        const currentStreak = 0; // TODO: Implement streak logic

        res.status(200).json({
            success: true,
            stats: {
                totalCoursesEnrolled,
                activeCourses,
                completedCourses,
                overallProgress,
                totalHoursLearned: Math.round(totalHoursLearned),
                certificatesEarned,
                totalAmountSpent: Math.round(totalAmountSpent),
                currentStreak,
            },
        });
    } catch (error) {
        console.error("Error fetching student stats:", error);
        res.status(500).json({
            error: "Failed to fetch student statistics",
            details: error.message,
        });
    }
};

/**
 * Get system-wide statistics for charts and graphs
 * @route GET /api/stats/system
 * @access Private (Admin only)
 */
exports.getSystemStats = async (req, res) => {
    try {
        // Get monthly enrollments for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyEnrollments = await Enrollment.aggregate([
            {
                $match: {
                    enrolledAt: { $gte: sixMonthsAgo },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$enrolledAt" },
                        month: { $month: "$enrolledAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);

        // Top performing courses (by enrollment count)
        const topCourses = await Course.find()
            .sort({ enrollmentCount: -1 })
            .limit(5)
            .select("title enrollmentCount rating category");

        // Category distribution
        const categoryDistribution = await Course.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    totalEnrollments: { $sum: "$enrollmentCount" },
                },
            },
            {
                $sort: { count: -1 },
            },
        ]);

        // User growth (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: twelveMonthsAgo },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);

        res.status(200).json({
            success: true,
            stats: {
                monthlyEnrollments,
                topCourses,
                categoryDistribution,
                userGrowth,
            },
        });
    } catch (error) {
        console.error("Error fetching system stats:", error);
        res.status(500).json({
            error: "Failed to fetch system statistics",
            details: error.message,
        });
    }
};
