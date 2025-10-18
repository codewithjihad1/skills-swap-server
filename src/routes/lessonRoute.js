// src/routes/lessonRoute.js
const express = require("express");
const router = express.Router();
const lessonController = require("../controllers/lessonController");

// ✅ POST /api/lessons - Add a new lesson to a course (instructor only)
router.post("/", lessonController.createLesson);

// ✅ GET /api/lessons/course/:courseId - Get all lessons for a course
router.get("/course/:courseId", lessonController.getLessonsByCourse);

// ✅ GET /api/lessons/:id - Get a single lesson
router.get("/:id", lessonController.getLesson);

// ✅ PUT /api/lessons/:id - Update a lesson
router.put("/:id", lessonController.updateLesson);

// ✅ DELETE /api/lessons/:id - Delete a lesson
router.delete("/:id", lessonController.deleteLesson);

// ✅ BONUS: PATCH /api/lessons/:id/publish - Toggle publish status
router.patch("/:id/publish", lessonController.togglePublishLesson);

module.exports = router;