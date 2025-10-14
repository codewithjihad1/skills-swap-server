// src/socket/socketHandler.js - COMPLETE UPDATED VERSION

const Message = require("../dbSchemas/messageSchema");
const Notification = require("../dbSchemas/notificationSchema");
const User = require("../dbSchemas/userShema");

// Store online users
const onlineUsers = new Map();

const socketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log(`✅ User connected: ${socket.id}`);

        // User joins with their ID
        socket.on("user:join", async (userId) => {
            try {
                socket.userId = userId;
                onlineUsers.set(userId, socket.id);

                // Update user online status
                await User.findByIdAndUpdate(userId, { isOnline: true });

                // ✅ NEW: Join notification room automatically
                socket.join(`notifications_${userId}`);

                // Notify all users about online status
                io.emit("user:online", { userId, socketId: socket.id });

                console.log(`👤 User ${userId} joined`);

                // Send unread counts
                const unreadMessages = await Message.countDocuments({
                    receiver: userId,
                    isRead: false,
                });

                const unreadNotifications = await Notification.countDocuments({
                    recipient: userId,
                    isRead: false,
                });

                socket.emit("unread:counts", {
                    messages: unreadMessages,
                    notifications: unreadNotifications,
                });

                console.log(`🔔 User ${userId} joined notification room`);
            } catch (error) {
                console.error("Error in user:join:", error);
            }
        });

        // User joins a conversation room
        socket.on("conversation:join", (conversationId) => {
            socket.join(conversationId);
            console.log(
                `💬 Socket ${socket.id} joined conversation ${conversationId}`
            );
        });

        // User leaves a conversation room
        socket.on("conversation:leave", (conversationId) => {
            socket.leave(conversationId);
            console.log(
                `👋 Socket ${socket.id} left conversation ${conversationId}`
            );
        });

        // ✅ NEW: Join specific notification room (extra security)
        socket.on("notification:join", (userId) => {
            socket.join(`notifications_${userId}`);
            console.log(`🔔 User ${userId} joined notification room specifically`);
        });

        // ✅ NEW: Leave notification room  
        socket.on("notification:leave", (userId) => {
            socket.leave(`notifications_${userId}`);
            console.log(`🔔 User ${userId} left notification room`);
        });

        // ✅ NEW: Mark notification as read via socket
        socket.on("notification:mark-read", async (data) => {
            try {
                const { notificationId, userId } = data;

                console.log(`📨 Marking notification ${notificationId} as read for user ${userId}`);

                const notification = await Notification.findByIdAndUpdate(
                    notificationId,
                    {
                        isRead: true,
                        readAt: new Date(),
                    },
                    { new: true }
                ).populate("sender", "name email avatar");

                if (notification) {
                    // Send confirmation to user
                    socket.emit("notification:read-confirm", {
                        notificationId,
                        success: true
                    });

                    // Update unread count for user
                    const unreadCount = await Notification.countDocuments({
                        recipient: userId,
                        isRead: false,
                    });

                    // Send to all sockets of this user
                    io.to(`notifications_${userId}`).emit("notification:unread-count", {
                        count: unreadCount
                    });

                    console.log(`✅ Notification ${notificationId} marked as read. Unread count: ${unreadCount}`);
                } else {
                    socket.emit("notification:error", {
                        error: "Notification not found"
                    });
                }
            } catch (error) {
                console.error("Error in notification:mark-read:", error);
                socket.emit("notification:error", {
                    error: "Failed to mark notification as read"
                });
            }
        });

        // ✅ NEW: Mark all notifications as read
        socket.on("notification:mark-all-read", async (data) => {
            try {
                const { userId } = data;

                console.log(`📨 Marking all notifications as read for user ${userId}`);

                const result = await Notification.updateMany(
                    { recipient: userId, isRead: false },
                    {
                        isRead: true,
                        readAt: new Date(),
                    }
                );

                // Send confirmation
                socket.emit("notification:all-read-confirm", {
                    success: true,
                    modifiedCount: result.modifiedCount
                });

                // Update unread count to 0
                io.to(`notifications_${userId}`).emit("notification:unread-count", {
                    count: 0
                });

                console.log(`✅ All notifications (${result.modifiedCount}) marked as read for user ${userId}`);
            } catch (error) {
                console.error("Error in notification:mark-all-read:", error);
                socket.emit("notification:error", {
                    error: "Failed to mark all notifications as read"
                });
            }
        });

        // ✅ NEW: Delete notification via socket
        socket.on("notification:delete", async (data) => {
            try {
                const { notificationId, userId } = data;

                console.log(`🗑️ Deleting notification ${notificationId} for user ${userId}`);

                const notification = await Notification.findByIdAndDelete(notificationId);

                if (notification) {
                    // Send confirmation to user
                    socket.emit("notification:delete-confirm", {
                        notificationId,
                        success: true
                    });

                    // Update unread count if notification was unread
                    if (!notification.isRead) {
                        const unreadCount = await Notification.countDocuments({
                            recipient: userId,
                            isRead: false,
                        });

                        io.to(`notifications_${userId}`).emit("notification:unread-count", {
                            count: unreadCount
                        });
                    }

                    console.log(`✅ Notification ${notificationId} deleted successfully`);
                } else {
                    socket.emit("notification:error", {
                        error: "Notification not found for deletion"
                    });
                }
            } catch (error) {
                console.error("Error in notification:delete:", error);
                socket.emit("notification:error", {
                    error: "Failed to delete notification"
                });
            }
        });

        // ✅ NEW: Request current unread count
        socket.on("notification:get-unread-count", async (userId) => {
            try {
                const unreadCount = await Notification.countDocuments({
                    recipient: userId,
                    isRead: false,
                });

                socket.emit("notification:unread-count", {
                    count: unreadCount
                });

                console.log(`📊 Sent unread count ${unreadCount} to user ${userId}`);
            } catch (error) {
                console.error("Error in notification:get-unread-count:", error);
            }
        });

        // Send message
        socket.on("message:send", async (data) => {
            try {
                const {
                    conversationId,
                    sender,
                    receiver,
                    content,
                    messageType,
                    skillContext,
                } = data;

                // Create message
                const message = new Message({
                    conversationId,
                    sender,
                    receiver,
                    content,
                    messageType: messageType || "text",
                    skillContext,
                    isDelivered: onlineUsers.has(receiver),
                    deliveredAt: onlineUsers.has(receiver) ? new Date() : null,
                });

                await message.save();
                await message.populate("sender receiver", "name email avatar");
                await message.populate("skillContext", "title category");

                // Send to conversation room
                io.to(conversationId).emit("message:received", message);

                // Send to specific receiver if online
                const receiverSocketId = onlineUsers.get(receiver);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("message:new", {
                        conversationId,
                        message,
                    });

                    // Update unread count
                    const unreadCount = await Message.countDocuments({
                        receiver,
                        isRead: false,
                    });
                    io.to(receiverSocketId).emit("unread:update", {
                        messages: unreadCount,
                    });
                }

                console.log(
                    `📨 Message sent in conversation ${conversationId}`
                );
            } catch (error) {
                console.error("Error in message:send:", error);
                socket.emit("message:error", {
                    error: "Failed to send message",
                });
            }
        });

        // User is typing
        socket.on("typing:start", (data) => {
            const { conversationId, userId } = data;
            socket
                .to(conversationId)
                .emit("typing:user", { userId, isTyping: true });
        });

        // User stopped typing
        socket.on("typing:stop", (data) => {
            const { conversationId, userId } = data;
            socket
                .to(conversationId)
                .emit("typing:user", { userId, isTyping: false });
        });

        // Mark message as read
        socket.on("message:read", async (data) => {
            try {
                const { messageId, conversationId } = data;

                await Message.findByIdAndUpdate(messageId, {
                    isRead: true,
                    readAt: new Date(),
                });

                // Notify sender
                io.to(conversationId).emit("message:read-receipt", {
                    messageId,
                });

                console.log(`✅ Message ${messageId} marked as read`);
            } catch (error) {
                console.error("Error in message:read:", error);
            }
        });

        // Mark conversation as read
        socket.on("conversation:read", async (data) => {
            try {
                const { conversationId, userId } = data;

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

                // Update unread count
                const unreadCount = await Message.countDocuments({
                    receiver: userId,
                    isRead: false,
                });

                socket.emit("unread:update", { messages: unreadCount });

                console.log(`✅ Conversation ${conversationId} marked as read`);
            } catch (error) {
                console.error("Error in conversation:read:", error);
            }
        });

        // Send notification (existing - keep this)
        socket.on("notification:send", async (data) => {
            try {
                const {
                    recipient,
                    sender,
                    type,
                    title,
                    message,
                    link,
                    data: notifData,
                    priority,
                } = data;

                const notification = new Notification({
                    recipient,
                    sender,
                    type,
                    title,
                    message,
                    link,
                    data: notifData,
                    priority,
                });

                await notification.save();
                await notification.populate("sender", "name email avatar");

                // Send to recipient if online
                const recipientSocketId = onlineUsers.get(recipient);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit(
                        "notification:new",
                        notification
                    );

                    // Update unread count
                    const unreadCount = await Notification.countDocuments({
                        recipient,
                        isRead: false,
                    });
                    io.to(recipientSocketId).emit("unread:update", {
                        notifications: unreadCount,
                    });
                }

                console.log(`🔔 Notification sent to ${recipient}`);
            } catch (error) {
                console.error("Error in notification:send:", error);
            }
        });

        // Mark notification as read (existing - keep this)
        socket.on("notification:read", async (data) => {
            try {
                const { notificationId, userId } = data;

                await Notification.findByIdAndUpdate(notificationId, {
                    isRead: true,
                    readAt: new Date(),
                });

                // Update unread count
                const unreadCount = await Notification.countDocuments({
                    recipient: userId,
                    isRead: false,
                });

                socket.emit("unread:update", { notifications: unreadCount });

                console.log(`✅ Notification ${notificationId} marked as read`);
            } catch (error) {
                console.error("Error in notification:read:", error);
            }
        });

        // Get online users
        socket.on("users:online", () => {
            socket.emit("users:online-list", Array.from(onlineUsers.keys()));
        });

        // Disconnect
        socket.on("disconnect", async () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);

                // ✅ NEW: Leave notification room
                socket.leave(`notifications_${socket.userId}`);

                // Update user online status
                await User.findByIdAndUpdate(socket.userId, {
                    isOnline: false,
                    lastSeen: new Date(),
                });

                // Notify all users about offline status
                io.emit("user:offline", { userId: socket.userId });

                console.log(`❌ User ${socket.userId} disconnected from notification room`);
            }
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });

    // ✅ NEW: Helper function to send real-time notifications from anywhere
    const sendRealTimeNotification = async (notificationData) => {
        try {
            console.log(`🔔 Sending real-time notification to ${notificationData.recipient}`);

            const notification = new Notification(notificationData);
            await notification.save();
            await notification.populate("sender", "name email avatar");

            // Send to specific user's notification room
            io.to(`notifications_${notificationData.recipient}`).emit(
                "notification:new",
                notification
            );

            // Update unread count
            const unreadCount = await Notification.countDocuments({
                recipient: notificationData.recipient,
                isRead: false,
            });

            io.to(`notifications_${notificationData.recipient}`).emit(
                "notification:unread-count",
                { count: unreadCount }
            );

            console.log(`✅ Real-time notification sent to ${notificationData.recipient}. Unread count: ${unreadCount}`);
            return notification;
        } catch (error) {
            console.error("❌ Error sending real-time notification:", error);
            throw error;
        }
    };

    return {
        sendRealTimeNotification
    };
};

module.exports = socketHandler;