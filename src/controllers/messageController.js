const Message = require("../dbSchemas/messageSchema");
const User = require("../dbSchemas/userShema");
const mongoose = require("mongoose");

const messageController = {
    // Get all conversations for a user
    getConversations: async (req, res) => {
        try {
            const userId = req.params.userId;

            // Validate userId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "Invalid user ID" });
            }

            // Get all unique conversations with populated user data
            const conversations = await Message.aggregate([
                {
                    $match: {
                        $or: [
                            { sender: new mongoose.Types.ObjectId(userId) },
                            { receiver: new mongoose.Types.ObjectId(userId) },
                        ],
                        isDeleted: false,
                    },
                },
                {
                    $sort: { createdAt: -1 },
                },
                {
                    $group: {
                        _id: "$conversationId",
                        lastMessage: { $first: "$$ROOT" },
                        unreadCount: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            {
                                                $eq: [
                                                    "$receiver",
                                                    new mongoose.Types.ObjectId(
                                                        userId
                                                    ),
                                                ],
                                            },
                                            { $eq: ["$isRead", false] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                // Lookup sender details
                {
                    $lookup: {
                        from: "users",
                        localField: "lastMessage.sender",
                        foreignField: "_id",
                        as: "senderDetails",
                    },
                },
                // Lookup receiver details
                {
                    $lookup: {
                        from: "users",
                        localField: "lastMessage.receiver",
                        foreignField: "_id",
                        as: "receiverDetails",
                    },
                },
                // Add sender and receiver to lastMessage
                {
                    $addFields: {
                        "lastMessage.sender": {
                            $cond: {
                                if: { $gt: [{ $size: "$senderDetails" }, 0] },
                                then: {
                                    _id: {
                                        $arrayElemAt: ["$senderDetails._id", 0],
                                    },
                                    name: {
                                        $arrayElemAt: [
                                            "$senderDetails.name",
                                            0,
                                        ],
                                    },
                                    email: {
                                        $arrayElemAt: [
                                            "$senderDetails.email",
                                            0,
                                        ],
                                    },
                                    avatar: {
                                        $arrayElemAt: [
                                            "$senderDetails.avatar",
                                            0,
                                        ],
                                    },
                                },
                                else: null,
                            },
                        },
                        "lastMessage.receiver": {
                            $cond: {
                                if: { $gt: [{ $size: "$receiverDetails" }, 0] },
                                then: {
                                    _id: {
                                        $arrayElemAt: [
                                            "$receiverDetails._id",
                                            0,
                                        ],
                                    },
                                    name: {
                                        $arrayElemAt: [
                                            "$receiverDetails.name",
                                            0,
                                        ],
                                    },
                                    email: {
                                        $arrayElemAt: [
                                            "$receiverDetails.email",
                                            0,
                                        ],
                                    },
                                    avatar: {
                                        $arrayElemAt: [
                                            "$receiverDetails.avatar",
                                            0,
                                        ],
                                    },
                                },
                                else: null,
                            },
                        },
                    },
                },
                // Remove temporary fields
                {
                    $project: {
                        senderDetails: 0,
                        receiverDetails: 0,
                    },
                },
                {
                    $sort: { "lastMessage.createdAt": -1 },
                },
            ]);

            res.status(200).json(conversations);
        } catch (error) {
            console.error("Error fetching conversations:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Get messages for a conversation
    getMessages: async (req, res) => {
        try {
            const { conversationId } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const messages = await Message.find({
                conversationId,
                isDeleted: false,
            })
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate("sender receiver", "name email avatar")
                .populate("skillContext", "title category");

            const total = await Message.countDocuments({
                conversationId,
                isDeleted: false,
            });

            res.status(200).json({
                messages: messages.reverse(),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error("Error fetching messages:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Send a message (also handled via Socket.IO)
    sendMessage: async (req, res) => {
        try {
            const {
                conversationId,
                sender,
                receiver,
                content,
                messageType,
                skillContext,
            } = req.body;

            // Validate required fields
            if (!conversationId || !sender || !receiver || !content) {
                return res.status(400).json({
                    error: "Missing required fields",
                    details: {
                        conversationId: !conversationId ? "required" : "ok",
                        sender: !sender ? "required" : "ok",
                        receiver: !receiver ? "required" : "ok",
                        content: !content ? "required" : "ok",
                    },
                });
            }

            // Validate ObjectIds
            if (!mongoose.Types.ObjectId.isValid(sender)) {
                return res.status(400).json({ error: "Invalid sender ID" });
            }
            if (!mongoose.Types.ObjectId.isValid(receiver)) {
                return res.status(400).json({ error: "Invalid receiver ID" });
            }

            // Validate users exist
            const [senderUser, receiverUser] = await Promise.all([
                User.findById(sender),
                User.findById(receiver),
            ]);

            if (!senderUser) {
                return res.status(404).json({ error: "Sender user not found" });
            }
            if (!receiverUser) {
                return res
                    .status(404)
                    .json({ error: "Receiver user not found" });
            }

            const message = new Message({
                conversationId,
                sender,
                receiver,
                content,
                messageType: messageType || "text",
                skillContext,
            });

            await message.save();
            await message.populate("sender receiver", "name email avatar");

            res.status(201).json(message);
        } catch (error) {
            console.error("Error sending message:", error);
            if (error.name === "ValidationError") {
                return res.status(400).json({
                    error: "Validation error",
                    details: Object.values(error.errors).map((e) => e.message),
                });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Mark message as read
    markAsRead: async (req, res) => {
        try {
            const { messageId } = req.params;

            const message = await Message.findByIdAndUpdate(
                messageId,
                {
                    isRead: true,
                    readAt: new Date(),
                },
                { new: true }
            );

            if (!message) {
                return res.status(404).json({ error: "Message not found" });
            }

            res.status(200).json(message);
        } catch (error) {
            console.error("Error marking message as read:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Mark all messages in conversation as read
    markConversationAsRead: async (req, res) => {
        try {
            const { conversationId, userId } = req.params;

            await Message.updateMany(
                {
                    conversationId,
                    receiver: userId,
                    isRead: false,
                },
                {
                    isRead: true,
                    readAt: new Date(),
                }
            );

            res.status(200).json({ message: "Conversation marked as read" });
        } catch (error) {
            console.error("Error marking conversation as read:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Delete message
    deleteMessage: async (req, res) => {
        try {
            const { messageId } = req.params;

            const message = await Message.findByIdAndUpdate(
                messageId,
                { isDeleted: true },
                { new: true }
            );

            if (!message) {
                return res.status(404).json({ error: "Message not found" });
            }

            res.status(200).json({ message: "Message deleted successfully" });
        } catch (error) {
            console.error("Error deleting message:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },
};

module.exports = messageController;
