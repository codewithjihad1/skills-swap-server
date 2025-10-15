const Course = require("../models/Course");

/**
 * @route   POST /api/courses
 * @desc    Create a new course (instructor only)
 * @access  Private (Instructor)
 */
const createCourse = async (req, res) => {
    try {
        const {
            title,
            description,
            instructor,
            category,
            level,
            duration,
            thumbnail,
            price,
            currency,
            tags,
            syllabus,
            prerequisites,
            learningOutcomes,
            language,
        } = req.body;

        // Validate required fields
        if (!title || !description || !instructor || !category || !duration) {
            return res.status(400).json({
                error: "Title, description, instructor, category, and duration are required",
            });
        }

        // Create new course
        const course = new Course({
            title,
            description,
            instructor,
            category,
            level: level || "beginner",
            duration,
            thumbnail: thumbnail || "",
            price: price || 0,
            currency: currency || "USD",
            tags: tags || [],
            syllabus: syllabus || [],
            prerequisites: prerequisites || [],
            learningOutcomes: learningOutcomes || [],
            language: language || "English",
            published: false, // New courses are unpublished by default
        });

        await course.save();

        // Populate instructor details
        await course.populate("instructor", "name email avatar");

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course,
        });
    } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({
            error: "Failed to create course",
            details: error.message,
        });
    }
};

/**
 * @route   GET /api/courses
 * @desc    Get all published courses
 * @access  Public
 */
const getAllCourses = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            level,
            search,
            sortBy = "createdAt",
            order = "desc",
        } = req.query;

        // Build query
        const query = { published: true };

        if (category) {
            query.category = category;
        }

        if (level) {
            query.level = level;
        }

        if (search) {
            query.$text = { $search: search };
        }

        // Build sort
        const sortOrder = order === "asc" ? 1 : -1;
        const sort = { [sortBy]: sortOrder };

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const courses = await Course.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate("instructor", "name email avatar")
            .lean();

        // Get total count
        const totalCourses = await Course.countDocuments(query);

        res.status(200).json({
            success: true,
            count: courses.length,
            totalCourses,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCourses / parseInt(limit)),
            courses,
        });
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({
            error: "Failed to fetch courses",
            details: error.message,
        });
    }
};

/**
 * @route   GET /api/courses/instructor/:id
 * @desc    Get courses by instructor
 * @access  Public
 */
const getCoursesByInstructor = async (req, res) => {
    try {
        const { id } = req.params;
        const { includeUnpublished = false } = req.query;

        // Build query
        const query = { instructor: id };

        // Only show published courses unless explicitly requested
        if (includeUnpublished !== "true") {
            query.published = true;
        }

        const courses = await Course.find(query)
            .sort({ createdAt: -1 })
            .populate("instructor", "name email avatar")
            .lean();

        res.status(200).json({
            success: true,
            count: courses.length,
            courses,
        });
    } catch (error) {
        console.error("Error fetching instructor courses:", error);
        res.status(500).json({
            error: "Failed to fetch instructor courses",
            details: error.message,
        });
    }
};

/**
 * @route   GET /api/courses/:id
 * @desc    Get single course details
 * @access  Public
 */
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id)
            .populate("instructor", "name email avatar bio")
            .lean();

        if (!course) {
            return res.status(404).json({
                error: "Course not found",
            });
        }

        // Only allow viewing unpublished courses by instructor or admin
        if (!course.published) {
            // Add authorization check here if needed
            // For now, returning error if unpublished
            return res.status(403).json({
                error: "This course is not published yet",
            });
        }

        res.status(200).json({
            success: true,
            course,
        });
    } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({
            error: "Failed to fetch course",
            details: error.message,
        });
    }
};

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course (instructor only)
 * @access  Private (Instructor)
 */
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Find course
        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                error: "Course not found",
            });
        }

        // TODO: Add authorization check
        // if (course.instructor.toString() !== req.user.id) {
        //     return res.status(403).json({
        //         error: "Not authorized to update this course"
        //     });
        // }

        // Prevent direct manipulation of certain fields
        delete updateData.enrollmentCount;
        delete updateData.rating;
        delete updateData.createdAt;

        // Update course
        Object.assign(course, updateData);
        await course.save();

        // Populate instructor details
        await course.populate("instructor", "name email avatar");

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course,
        });
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({
            error: "Failed to update course",
            details: error.message,
        });
    }
};

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course (instructor or admin)
 * @access  Private (Instructor/Admin)
 */
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                error: "Course not found",
            });
        }

        // TODO: Add authorization check
        // if (course.instructor.toString() !== req.user.id && !req.user.isAdmin) {
        //     return res.status(403).json({
        //         error: "Not authorized to delete this course"
        //     });
        // }

        // Prevent deletion if course has enrollments
        if (course.enrollmentCount > 0) {
            return res.status(400).json({
                error: "Cannot delete course with active enrollments",
                enrollmentCount: course.enrollmentCount,
            });
        }

        await Course.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({
            error: "Failed to delete course",
            details: error.message,
        });
    }
};

/**
 * @route   PATCH /api/courses/:id/publish
 * @desc    Publish or unpublish course (admin/instructor)
 * @access  Private (Admin/Instructor)
 */
const togglePublishCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { published } = req.body;

        if (typeof published !== "boolean") {
            return res.status(400).json({
                error: "Published status must be a boolean value",
            });
        }

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                error: "Course not found",
            });
        }

        // TODO: Add authorization check
        // if (course.instructor.toString() !== req.user.id && !req.user.isAdmin) {
        //     return res.status(403).json({
        //         error: "Not authorized to publish/unpublish this course"
        //     });
        // }

        // Validate course has required content before publishing
        if (published) {
            if (!course.syllabus || course.syllabus.length === 0) {
                return res.status(400).json({
                    error: "Cannot publish course without syllabus",
                });
            }

            if (
                !course.learningOutcomes ||
                course.learningOutcomes.length === 0
            ) {
                return res.status(400).json({
                    error: "Cannot publish course without learning outcomes",
                });
            }
        }

        course.published = published;
        if (published && !course.publishedAt) {
            course.publishedAt = new Date();
        }

        await course.save();

        await course.populate("instructor", "name email avatar");

        res.status(200).json({
            success: true,
            message: `Course ${
                published ? "published" : "unpublished"
            } successfully`,
            course,
        });
    } catch (error) {
        console.error("Error toggling course publish status:", error);
        res.status(500).json({
            error: "Failed to update course publish status",
            details: error.message,
        });
    }
};

module.exports = {
    createCourse,
    getAllCourses,
    getCoursesByInstructor,
    getCourseById,
    updateCourse,
    deleteCourse,
    togglePublishCourse,
};
