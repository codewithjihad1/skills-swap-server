// src/controllers/notificationController.js - COMPLETE UPDATED VERSION

const Notification = require("../dbSchemas/notificationSchema");

let socketHandler = null;

// Set socket handler from main file
const setSocketHandler = (handler) => {
    socketHandler = handler;
    console.log('✅ Socket handler set in notification controller');
};

const notificationController = {
    // Get all notifications for a user
    getNotifications: async (req, res) => {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20, isRead, type } = req.query;

            // ✅ Validate userId
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const query = { recipient: userId };
            
            if (isRead !== undefined) {
                query.isRead = isRead === "true";
            }
            
            if (type && type !== 'all') {
                query.type = type;
            }

            const notifications = await Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate("sender", "name email avatar");

            const total = await Notification.countDocuments(query);
            const unreadCount = await Notification.countDocuments({
                recipient: userId,
                isRead: false,
            });

            res.status(200).json({
                success: true,
                notifications,
                unreadCount,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error("Error fetching notifications:", error);
            res.status(500).json({ 
                success: false,
                error: "Internal server error" 
            });
        }
    },

    // Create a notification - REAL-TIME enabled
    createNotification: async (req, res) => {
        try {
            const {
                recipient,
                sender,
                type,
                title,
                message,
                link,
                data,
                priority,
            } = req.body;

            // ✅ Basic validation
            if (!recipient || !type || !title || !message) {
                return res.status(400).json({
                    success: false,
                    error: "Recipient, type, title, and message are required"
                });
            }

            const notification = new Notification({
                recipient,
                sender,
                type,
                title,
                message,
                link,
                data,
                priority,
            });

            await notification.save();
            await notification.populate("sender", "name email avatar");

            // ✅ REAL-TIME: Send via Socket.IO if available
            if (socketHandler && socketHandler.sendRealTimeNotification) {
                try {
                    await socketHandler.sendRealTimeNotification({
                        recipient,
                        sender,
                        type,
                        title,
                        message,
                        link,
                        data,
                        priority,
                    });
                    console.log(`🔔 Real-time notification sent to user ${recipient}`);
                } catch (socketError) {
                    console.error('❌ Real-time notification failed, but saved to DB:', socketError);
                    // Continue even if real-time fails - notification is saved in DB
                }
            } else {
                console.log('⚠️ Socket handler not available for real-time notification');
            }

            res.status(201).json({
                success: true,
                notification,
                realTimeSent: !!socketHandler?.sendRealTimeNotification
            });
        } catch (error) {
            console.error("Error creating notification:", error);
            if (error.name === "ValidationError") {
                return res.status(400).json({
                    success: false,
                    error: "Validation error",
                    details: Object.values(error.errors).map((e) => e.message),
                });
            }
            res.status(500).json({ 
                success: false,
                error: "Internal server error" 
            });
        }
    },

    // Mark notification as read
    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;

            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                {
                    isRead: true,
                    readAt: new Date(),
                },
                { new: true }
            ).populate("sender", "name email avatar");

            if (!notification) {
                return res.status(404).json({ 
                    success: false,
                    error: "Notification not found" 
                });
            }

            res.status(200).json({
                success: true,
                notification
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
            res.status(500).json({ 
                success: false,
                error: "Internal server error" 
            });
        }
    },

    // Mark all notifications as read for a user
    markAllAsRead: async (req, res) => {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await Notification.updateMany(
                { recipient: userId, isRead: false },
                {
                    isRead: true,
                    readAt: new Date(),
                }
            );

            res.status(200).json({
                success: true,
                message: `${result.modifiedCount} notifications marked as read`,
                modifiedCount: result.modifiedCount
            });
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            res.status(500).json({ 
                success: false,
                error: "Internal server error" 
            });
        }
    },

    // Delete notification
    deleteNotification: async (req, res) => {
        try {
            const { notificationId } = req.params;

            const notification = await Notification.findByIdAndDelete(notificationId);

            if (!notification) {
                return res.status(404).json({ 
                    success: false,
                    error: "Notification not found" 
                });
            }

            res.status(200).json({
                success: true,
                message: "Notification deleted successfully",
                deletedNotification: notification
            });
        } catch (error) {
            console.error("Error deleting notification:", error);
            res.status(500).json({ 
                success: false,
                error: "Internal server error" 
            });
        }
    },

    // Delete all notifications for a user
    deleteAllNotifications: async (req, res) => {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await Notification.deleteMany({ recipient: userId });

            res.status(200).json({
                success: true,
                message: `${result.deletedCount} notifications deleted successfully`,
                deletedCount: result.deletedCount
            });
        } catch (error) {
            console.error("Error deleting all notifications:", error);
            res.status(500).json({ 
                success: false,
                error: "Internal server error" 
            });
        }
    },

    // Get unread count for a user
    getUnreadCount: async (req, res) => {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const count = await Notification.countDocuments({
                recipient: userId,
                isRead: false,
            });

            res.status(200).json({ 
                success: true,
                unreadCount: count 
            });
        } catch (error) {
            console.error("Error getting unread count:", error);
            res.status(500).json({ 
                success: false,
                error: "Internal server error" 
            });
        }
    },

    // ✅ Get notification statistics for a user
    getNotificationStats: async (req, res) => {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const stats = await Notification.aggregate([
                { $match: { recipient: userId } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        unread: {
                            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
                        }
                    }
                }
            ]);

            const totalStats = {
                total: await Notification.countDocuments({ recipient: userId }),
                unread: await Notification.countDocuments({ 
                    recipient: userId, 
                    isRead: false 
                }),
                byType: stats
            };

            res.status(200).json({
                success: true,
                stats: totalStats
            });
        } catch (error) {
            console.error("Error getting notification stats:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error"
            });
        }
    },

    // ✅ Create multiple notifications (Bulk) - REAL-TIME enabled
    createBulkNotifications: async (req, res) => {
        try {
            const { notifications } = req.body;

            if (!notifications || !Array.isArray(notifications)) {
                return res.status(400).json({
                    success: false,
                    error: "Notifications array is required"
                });
            }

            const createdNotifications = await Notification.insertMany(notifications);

            await Notification.populate(createdNotifications, {
                path: 'sender',
                select: 'name email avatar'
            });

            // ✅ REAL-TIME: Send each notification via Socket.IO
            if (socketHandler && socketHandler.sendRealTimeNotification) {
                for (const notificationData of notifications) {
                    try {
                        await socketHandler.sendRealTimeNotification(notificationData);
                        console.log(`🔔 Bulk real-time notification sent to user ${notificationData.recipient}`);
                    } catch (socketError) {
                        console.error('❌ Real-time notification failed for bulk:', socketError);
                        // Continue even if real-time fails
                    }
                }
            }

            res.status(201).json({
                success: true,
                count: createdNotifications.length,
                notifications: createdNotifications,
                realTimeSent: !!socketHandler?.sendRealTimeNotification
            });
        } catch (error) {
            console.error("Error creating bulk notifications:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error"
            });
        }
    },

    // ✅ Get notifications by type for a user
    getNotificationsByType: async (req, res) => {
        try {
            const { userId, type } = req.params;
            const { page = 1, limit = 20 } = req.query;

            if (!userId || !type) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and type are required"
                });
            }

            const validTypes = ["message", "skill_request", "skill_accepted", "skill_rejected", "swap_completed", "review_received", "system"];
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid notification type"
                });
            }

            const notifications = await Notification.find({
                recipient: userId,
                type: type
            })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate("sender", "name email avatar");

            const total = await Notification.countDocuments({
                recipient: userId,
                type: type
            });

            res.status(200).json({
                success: true,
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error("Error fetching notifications by type:", error);
            res.status(500).json({ 
                success: false,
                error: "Internal server error" 
            });
        }
    },

    // ✅ NEW: Test real-time notification endpoint
    testRealTimeNotification: async (req, res) => {
        try {
            const { recipient, title, message } = req.body;

            if (!recipient || !title || !message) {
                return res.status(400).json({
                    success: false,
                    error: "Recipient, title, and message are required"
                });
            }

            const testNotification = {
                recipient,
                type: "system",
                title,
                message,
                priority: "medium"
            };

            let realTimeResult = null;

            // Try to send real-time
            if (socketHandler && socketHandler.sendRealTimeNotification) {
                try {
                    realTimeResult = await socketHandler.sendRealTimeNotification(testNotification);
                    console.log(`🔔 Test real-time notification sent to user ${recipient}`);
                } catch (socketError) {
                    console.error('❌ Test real-time notification failed:', socketError);
                }
            }

            // Also save to database
            const notification = new Notification(testNotification);
            await notification.save();

            res.status(200).json({
                success: true,
                message: "Test notification sent",
                notification,
                realTimeSent: !!realTimeResult,
                socketHandlerAvailable: !!socketHandler?.sendRealTimeNotification
            });
        } catch (error) {
            console.error("Error in test real-time notification:", error);
            res.status(500).json({ 
                success: false,
                error: "Internal server error" 
            });
        }
    },

    // ✅ NEW: Get socket connection status
    getSocketStatus: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                socketHandlerAvailable: !!socketHandler?.sendRealTimeNotification,
                status: socketHandler ? "Connected" : "Not Connected"
            });
        } catch (error) {
            console.error("Error getting socket status:", error);
            res.status(500).json({ 
                success: false,
                error: "Internal server error" 
            });
        }
    }
};

module.exports = { notificationController, setSocketHandler };