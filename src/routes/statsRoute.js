// src/routes/statsRoute.js

const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");

/**
 * @route   GET /api/stats/admin
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 * @returns {Object} Admin statistics including total students, courses, earnings, etc.
 */
router.get("/admin", statsController.getAdminStats);

/**
 * @route   GET /api/stats/instructor/:instructorId
 * @desc    Get instructor dashboard statistics
 * @access  Private (Instructor only)
 * @returns {Object} Instructor statistics for their courses and students
 */
router.get("/instructor/:instructorId", statsController.getInstructorStats);

/**
 * @route   GET /api/stats/student/:studentId
 * @desc    Get student dashboard statistics
 * @access  Private (Student only)
 * @returns {Object} Student statistics for their enrolled courses
 */
router.get("/student/:studentId", statsController.getStudentStats);

/**
 * @route   GET /api/stats/system
 * @desc    Get system-wide statistics for charts and analytics
 * @access  Private (Admin only)
 * @returns {Object} System statistics including trends and distributions
 */
router.get("/system", statsController.getSystemStats);

module.exports = router;
