const express = require("express");
const router = express.Router();
const {
    enrollInCourse,
    getMyEnrolledCourses,
    getCourseProgress,
    updateLessonProgress,
    unenrollFromCourse,
    rateCourse,
} = require("../controllers/enrollmentController");

/**
 * @route   POST /api/enrollments/enroll/:courseId
 * @desc    Enroll a user into a course
 * @access  Private
 */
router.post("/enroll/:courseId", enrollInCourse);

/**
 * @route   GET /api/enrollments/my-courses
 * @desc    Get all enrolled courses for current user
 * @access  Private
 * @query   userId, status (active/completed/dropped), sortBy, order
 */
router.get("/my-courses", getMyEnrolledCourses);

/**
 * @route   GET /api/enrollments/progress/:courseId
 * @desc    Get user progress for a specific course
 * @access  Private
 * @query   userId
 */
router.get("/progress/:courseId", getCourseProgress);

/**
 * @route   PUT /api/enrollments/progress/:courseId
 * @desc    Update lesson progress (mark completed/uncompleted)
 * @access  Private
 * @body    userId, week, lessonIndex, completed (boolean)
 */
router.put("/progress/:courseId", updateLessonProgress);

/**
 * @route   DELETE /api/enrollments/unenroll/:courseId
 * @desc    Unenroll from a course
 * @access  Private
 * @body    userId
 */
router.delete("/unenroll/:courseId", unenrollFromCourse);

/**
 * @route   POST /api/enrollments/rate/:courseId
 * @desc    Rate a course (bonus endpoint)
 * @access  Private
 * @body    userId, score (1-5), review (optional)
 */
router.post("/rate/:courseId", rateCourse);

module.exports = router;
