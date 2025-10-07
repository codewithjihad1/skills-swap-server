const Notification = require("../dbSchemas/notificationSchema");

const notificationController = {
    // Get all notifications for a user
    getNotifications: async (req, res) => {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20, isRead } = req.query;

            const query = { recipient: userId };
            if (isRead !== undefined) {
                query.isRead = isRead === "true";
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
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Create a notification
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

            res.status(201).json(notification);
        } catch (error) {
            console.error("Error creating notification:", error);
            if (error.name === "ValidationError") {
                return res.status(400).json({
                    error: "Validation error",
                    details: Object.values(error.errors).map((e) => e.message),
                });
            }
            res.status(500).json({ error: "Internal server error" });
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
            );

            if (!notification) {
                return res
                    .status(404)
                    .json({ error: "Notification not found" });
            }

            res.status(200).json(notification);
        } catch (error) {
            console.error("Error marking notification as read:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Mark all notifications as read
    markAllAsRead: async (req, res) => {
        try {
            const { userId } = req.params;

            await Notification.updateMany(
                { recipient: userId, isRead: false },
                {
                    isRead: true,
                    readAt: new Date(),
                }
            );

            res.status(200).json({
                message: "All notifications marked as read",
            });
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Delete notification
    deleteNotification: async (req, res) => {
        try {
            const { notificationId } = req.params;

            await Notification.findByIdAndDelete(notificationId);

            res.status(200).json({
                message: "Notification deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting notification:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Delete all notifications for a user
    deleteAllNotifications: async (req, res) => {
        try {
            const { userId } = req.params;

            await Notification.deleteMany({ recipient: userId });

            res.status(200).json({
                message: "All notifications deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting all notifications:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Get unread count
    getUnreadCount: async (req, res) => {
        try {
            const { userId } = req.params;

            const count = await Notification.countDocuments({
                recipient: userId,
                isRead: false,
            });

            res.status(200).json({ unreadCount: count });
        } catch (error) {
            console.error("Error getting unread count:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },
};

module.exports = notificationController;
