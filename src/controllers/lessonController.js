// src/controllers/lessonController.js
const Lesson = require("../dbSchemas/lessonSchema");
const Course = require("../models/Course");

const lessonController = {
    // ✅ POST /api/lessons - Add a new lesson to a course (instructor only)
    createLesson: async (req, res) => {
        try {
            const {
                title,
                description,
                content,
                videoUrl,
                duration,
                order,
                courseId,
                resources,
                prerequisites,
                learningObjectives,
                tags,
                isPublished,
            } = req.body;

            // ✅ Validation
            if (!title || !content || !courseId || !order) {
                return res.status(400).json({
                    success: false,
                    error: "Title, content, courseId, and order are required",
                });
            }

            // ✅ Check if course exists
            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    error: "Course not found",
                });
            }

            // ✅ Check if order already exists in this course
            const existingLesson = await Lesson.findOne({
                course: courseId,
                order: order,
            });

            if (existingLesson) {
                return res.status(400).json({
                    success: false,
                    error: `A lesson already exists at order position ${order} in this course`,
                });
            }

            // ✅ Create lesson
            const lesson = new Lesson({
                title,
                description,
                content,
                videoUrl,
                duration: duration || 0,
                order,
                course: courseId,
                instructor: course.instructor, // Use course's instructor
                isPublished: isPublished || false,
                resources: resources || [],
                prerequisites: prerequisites || [],
                learningObjectives: learningObjectives || [],
                tags: tags || [],
            });

            await lesson.save();
            await lesson.populate("instructor", "name email avatar");
            await lesson.populate("prerequisites", "title order");

            // ✅ Add lesson to course's lessons array
            await Course.findByIdAndUpdate(courseId, {
                $push: { lessons: lesson._id },
                $inc: { lessonCount: 1 }, // Optional: if you add lessonCount field
            });

            res.status(201).json({
                success: true,
                message: "Lesson created successfully",
                lesson,
            });
        } catch (error) {
            console.error("Error creating lesson:", error);

            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    error: "Duplicate lesson order in this course",
                });
            }

            if (error.name === "ValidationError") {
                return res.status(400).json({
                    success: false,
                    error: "Validation error",
                    details: Object.values(error.errors).map((e) => e.message),
                });
            }

            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    },

    // ✅ GET /api/lessons/course/:courseId - Get all lessons for a course
    getLessonsByCourse: async (req, res) => {
        try {
            const { courseId } = req.params;
            const { publishedOnly = "false", includeContent = "false" } =
                req.query;

            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    error: "Course ID is required",
                });
            }

            // ✅ Check if course exists
            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    error: "Course not found",
                });
            }

            // ✅ Build query
            const query = { course: courseId };
            if (publishedOnly === "true") {
                query.isPublished = true;
            }

            // ✅ Build selection fields
            let selection = "-__v";
            if (includeContent !== "true") {
                selection += " -content";
            }

            const lessons = await Lesson.find(query)
                .sort({ order: 1 }) // Sort by order ascending
                .populate("instructor", "name email avatar")
                .populate("prerequisites", "title order")
                .select(selection);

            const total = await Lesson.countDocuments(query);
            const publishedCount = await Lesson.countDocuments({
                course: courseId,
                isPublished: true,
            });

            res.status(200).json({
                success: true,
                course: {
                    _id: course._id,
                    title: course.title,
                    description: course.description,
                },
                lessons,
                counts: {
                    total,
                    published: publishedCount,
                    draft: total - publishedCount,
                },
            });
        } catch (error) {
            console.error("Error fetching lessons:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    },

    // ✅ GET /api/lessons/:id - Get a single lesson
    getLesson: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "Lesson ID is required",
                });
            }

            const lesson = await Lesson.findById(id)
                .populate("instructor", "name email avatar")
                .populate("course", "title description category level")
                .populate("prerequisites", "title order");

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    error: "Lesson not found",
                });
            }

            res.status(200).json({
                success: true,
                lesson,
            });
        } catch (error) {
            console.error("Error fetching lesson:", error);

            if (error.name === "CastError") {
                return res.status(400).json({
                    success: false,
                    error: "Invalid lesson ID format",
                });
            }

            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    },

    // ✅ PUT /api/lessons/:id - Update a lesson
    updateLesson: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "Lesson ID is required",
                });
            }

            // ✅ Find lesson
            const lesson = await Lesson.findById(id);
            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    error: "Lesson not found",
                });
            }

            // ✅ If order is being updated, check for conflicts
            if (updateData.order && updateData.order !== lesson.order) {
                const existingLesson = await Lesson.findOne({
                    course: lesson.course,
                    order: updateData.order,
                    _id: { $ne: id }, // Exclude current lesson
                });

                if (existingLesson) {
                    return res.status(400).json({
                        success: false,
                        error: `A lesson already exists at order position ${updateData.order} in this course`,
                    });
                }
            }

            // ✅ Update lesson
            const updatedLesson = await Lesson.findByIdAndUpdate(
                id,
                { $set: updateData },
                {
                    new: true,
                    runValidators: true,
                }
            )
                .populate("instructor", "name email avatar")
                .populate("prerequisites", "title order")
                .populate("course", "title description");

            res.status(200).json({
                success: true,
                message: "Lesson updated successfully",
                lesson: updatedLesson,
            });
        } catch (error) {
            console.error("Error updating lesson:", error);

            if (error.name === "CastError") {
                return res.status(400).json({
                    success: false,
                    error: "Invalid lesson ID format",
                });
            }

            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    error: "Duplicate lesson order in this course",
                });
            }

            if (error.name === "ValidationError") {
                return res.status(400).json({
                    success: false,
                    error: "Validation error",
                    details: Object.values(error.errors).map((e) => e.message),
                });
            }

            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    },

    // ✅ DELETE /api/lessons/:id - Delete a lesson
    deleteLesson: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "Lesson ID is required",
                });
            }

            // ✅ Find lesson
            const lesson = await Lesson.findById(id);
            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    error: "Lesson not found",
                });
            }

            // ✅ Delete lesson
            await Lesson.findByIdAndDelete(id);

            // ✅ Remove lesson from course's lessons array
            await Course.findByIdAndUpdate(lesson.course, {
                $pull: { lessons: id },
            });

            // ✅ Remove this lesson from other lessons' prerequisites
            await Lesson.updateMany(
                { prerequisites: id },
                { $pull: { prerequisites: id } }
            );

            res.status(200).json({
                success: true,
                message: "Lesson deleted successfully",
                deletedLesson: {
                    _id: lesson._id,
                    title: lesson.title,
                    course: lesson.course,
                },
            });
        } catch (error) {
            console.error("Error deleting lesson:", error);

            if (error.name === "CastError") {
                return res.status(400).json({
                    success: false,
                    error: "Invalid lesson ID format",
                });
            }

            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    },

    // ✅ BONUS: Publish/Unpublish lesson
    togglePublishLesson: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "Lesson ID is required",
                });
            }

            const lesson = await Lesson.findById(id);
            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    error: "Lesson not found",
                });
            }

            const updatedLesson = await Lesson.findByIdAndUpdate(
                id,
                { isPublished: !lesson.isPublished },
                { new: true }
            )
                .populate("instructor", "name email avatar")
                .populate("course", "title");

            res.status(200).json({
                success: true,
                message: `Lesson ${
                    updatedLesson.isPublished ? "published" : "unpublished"
                } successfully`,
                lesson: updatedLesson,
            });
        } catch (error) {
            console.error("Error toggling lesson publish status:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    },
};

module.exports = lessonController;
