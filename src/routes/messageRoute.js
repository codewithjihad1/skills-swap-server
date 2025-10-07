const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

// Get all conversations for a user
router.get("/conversations/:userId", messageController.getConversations);

// Get messages for a specific conversation
router.get("/:conversationId", messageController.getMessages);

// Send a message
router.post("/", messageController.sendMessage);

// Mark message as read
router.patch("/:messageId/read", messageController.markAsRead);

// Mark all messages in conversation as read
router.patch(
    "/conversation/:conversationId/user/:userId/read",
    messageController.markConversationAsRead
);

// Delete message
router.delete("/:messageId", messageController.deleteMessage);

module.exports = router;
