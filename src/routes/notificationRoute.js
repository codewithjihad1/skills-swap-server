const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Get all notifications for a user
router.get("/:userId", notificationController.getNotifications);

// Get unread count
router.get("/:userId/unread/count", notificationController.getUnreadCount);

// Create a notification
router.post("/", notificationController.createNotification);

// Mark notification as read
router.patch("/:notificationId/read", notificationController.markAsRead);

// Mark all notifications as read
router.patch("/:userId/read-all", notificationController.markAllAsRead);

// Delete notification
router.delete("/:notificationId", notificationController.deleteNotification);

// Delete all notifications for a user
router.delete("/:userId/all", notificationController.deleteAllNotifications);

module.exports = router;
