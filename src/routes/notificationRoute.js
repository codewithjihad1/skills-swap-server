// src/routes/notificationRoute.js - UPDATED VERSION

const express = require("express");
const router = express.Router();
const { notificationController } = require("../controllers/notificationController");

// ✅ No authentication middleware - all routes are public

// Get all notifications for a user
router.get("/user/:userId", notificationController.getNotifications);

// Get notifications by type for a user
router.get("/user/:userId/type/:type", notificationController.getNotificationsByType);

// Get unread count for a user
router.get("/user/:userId/unread/count", notificationController.getUnreadCount);

// Get notification statistics for a user
router.get("/user/:userId/stats", notificationController.getNotificationStats);

// Create a notification
router.post("/", notificationController.createNotification);

// Create multiple notifications
router.post("/bulk", notificationController.createBulkNotifications);

// Mark notification as read
router.patch("/:notificationId/read", notificationController.markAsRead);

// Mark all notifications as read for a user
router.patch("/user/:userId/read-all", notificationController.markAllAsRead);

// Delete notification
router.delete("/:notificationId", notificationController.deleteNotification);

// Delete all notifications for a user
router.delete("/user/:userId/all", notificationController.deleteAllNotifications);

// ✅ NEW: Test real-time notification
router.post("/test-real-time", notificationController.testRealTimeNotification);

// ✅ NEW: Get socket connection status
router.get("/socket-status", notificationController.getSocketStatus);

module.exports = router;