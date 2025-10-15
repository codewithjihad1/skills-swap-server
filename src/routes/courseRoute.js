const express = require("express");
const router = express.Router();
const {
    createCourse,
    getAllCourses,
    getCoursesByInstructor,
    getCourseById,
    updateCourse,
    deleteCourse,
    togglePublishCourse,
} = require("../controllers/courseController");

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private (Instructor only)
 */
router.post("/", createCourse);

/**
 * @route   GET /api/courses
 * @desc    Get all published courses with filtering and pagination
 * @access  Public
 * @query   page, limit, category, level, search, sortBy, order
 */
router.get("/", getAllCourses);

/**
 * @route   GET /api/courses/instructor/:id
 * @desc    Get all courses by a specific instructor
 * @access  Public
 * @query   includeUnpublished (boolean)
 */
router.get("/instructor/:id", getCoursesByInstructor);

/**
 * @route   GET /api/courses/:id
 * @desc    Get single course by ID
 * @access  Public
 */
router.get("/:id", getCourseById);

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course
 * @access  Private (Instructor only - must be course owner)
 */
router.put("/:id", updateCourse);

/**
 * @route   PATCH /api/courses/:id/publish
 * @desc    Publish or unpublish a course
 * @access  Private (Admin/Instructor only)
 */
router.patch("/:id/publish", togglePublishCourse);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course
 * @access  Private (Instructor/Admin only - must be course owner or admin)
 */
router.delete("/:id", deleteCourse);

module.exports = router;
