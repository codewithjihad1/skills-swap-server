const SwapRequest = require("../dbSchemas/swapRequestSchema");
const Notification = require("../dbSchemas/notificationSchema");
const Skill = require("../dbSchemas/skillSchema");
const mongoose = require("mongoose");

// Create a new swap request
exports.createSwapRequest = async (req, res) => {
    try {
        const { skillOffered, skillProvider, skillRequested, message } =
            req.body;
        const requester = req.body.requester;

        // Validate required fields
        if (!skillOffered || !skillProvider || !skillRequested || !requester) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: requester, skillOffered, skillProvider, skillRequested",
            });
        }

        // Check if requester is not the same as skill provider
        if (requester === skillProvider) {
            return res.status(400).json({
                success: false,
                error: "You cannot send a swap request to yourself",
            });
        }

        // Check if swap request already exists
        const existingRequest = await SwapRequest.findOne({
            requester,
            skillRequested,
            status: "pending",
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                error: "You already have a pending request for this skill",
            });
        }

        // Create swap request
        const swapRequest = await SwapRequest.create({
            requester,
            skillOffered,
            skillProvider,
            skillRequested,
            message,
        });

        // Populate the swap request with skill and user details
        await swapRequest.populate([
            { path: "requester", select: "name email avatar" },
            { path: "skillOffered", select: "title category" },
            { path: "skillProvider", select: "name email avatar" },
            { path: "skillRequested", select: "title category" },
        ]);

        // Create notification for skill provider
        await Notification.create({
            recipient: skillProvider,
            sender: requester,
            type: "skill_request",
            title: "New Skill Swap Request",
            message: `${swapRequest.requester.name} wants to swap skills with you`,
            link: `/dashboard/swap-requests`,
            priority: "high",
            data: {
                swapRequestId: swapRequest._id,
                skillRequested: swapRequest.skillRequested.title,
                skillOffered: swapRequest.skillOffered.title,
            },
        });

        res.status(201).json({
            success: true,
            data: swapRequest,
            message: "Swap request sent successfully",
        });
    } catch (error) {
        console.error("Error creating swap request:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create swap request",
            details: error.message,
        });
    }
};

// Get all swap requests for a user (received and sent)
exports.getSwapRequests = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { type, status } = req.query; // type: 'received' or 'sent', status: 'pending', 'accepted', etc.

        let query = {};

        if (type === "received") {
            query.skillProvider = userId;
        } else if (type === "sent") {
            query.requester = userId;
        } else {
            // Get both received and sent
            query.$or = [{ skillProvider: userId }, { requester: userId }];
        }

        if (status) {
            query.status = status;
        }

        const swapRequests = await SwapRequest.find(query)
            .populate("requester", "name email avatar")
            .populate("skillOffered", "title category description")
            .populate("skillProvider", "name email avatar")
            .populate("skillRequested", "title category description")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: swapRequests.length,
            data: swapRequests,
        });
    } catch (error) {
        console.error("Error fetching swap requests:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch swap requests",
            details: error.message,
        });
    }
};

// Get a single swap request by ID
exports.getSwapRequestById = async (req, res) => {
    try {
        const swapRequest = await SwapRequest.findById(req.params.id)
            .populate("requester", "name email avatar")
            .populate("skillOffered", "title category description")
            .populate("skillProvider", "name email avatar")
            .populate("skillRequested", "title category description");

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                error: "Swap request not found",
            });
        }

        res.status(200).json({
            success: true,
            data: swapRequest,
        });
    } catch (error) {
        console.error("Error fetching swap request:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch swap request",
            details: error.message,
        });
    }
};

// Respond to a swap request (accept or reject)
exports.respondToSwapRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, responseMessage } = req.body; // status: 'accepted' or 'rejected'

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                error: "Invalid status. Must be 'accepted' or 'rejected'",
            });
        }

        const swapRequest = await SwapRequest.findById(id)
            .populate("requester", "name email avatar")
            .populate("skillRequested", "title");

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                error: "Swap request not found",
            });
        }

        if (swapRequest.status !== "pending") {
            return res.status(400).json({
                success: false,
                error: "This swap request has already been responded to",
            });
        }

        swapRequest.status = status;
        swapRequest.responseMessage = responseMessage;
        swapRequest.respondedAt = new Date();
        await swapRequest.save();

        // Create notification for requester
        const notificationTitle =
            status === "accepted"
                ? "Swap Request Accepted! 🎉"
                : "Swap Request Declined";
        const notificationMessage =
            status === "accepted"
                ? `Your swap request for "${swapRequest.skillRequested.title}" has been accepted!`
                : `Your swap request for "${swapRequest.skillRequested.title}" was declined`;

        await Notification.create({
            recipient: swapRequest.requester._id,
            sender: swapRequest.skillProvider,
            type: status === "accepted" ? "skill_accepted" : "skill_rejected",
            title: notificationTitle,
            message: notificationMessage,
            link: `/dashboard/swap-requests`,
            priority: status === "accepted" ? "high" : "medium",
            data: {
                swapRequestId: swapRequest._id,
                status,
            },
        });

        // If accepted, increment swap count for the skill
        if (status === "accepted") {
            await Skill.findByIdAndUpdate(swapRequest.skillRequested, {
                $inc: { swapCount: 1 },
            });
        }

        res.status(200).json({
            success: true,
            data: swapRequest,
            message: `Swap request ${status} successfully`,
        });
    } catch (error) {
        console.error("Error responding to swap request:", error);
        res.status(500).json({
            success: false,
            error: "Failed to respond to swap request",
            details: error.message,
        });
    }
};

// Mark swap request as completed
exports.completeSwapRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const swapRequest = await SwapRequest.findById(id)
            .populate("requester", "name email avatar")
            .populate("skillProvider", "name email avatar")
            .populate("skillRequested", "title");

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                error: "Swap request not found",
            });
        }

        if (swapRequest.status !== "accepted") {
            return res.status(400).json({
                success: false,
                error: "Only accepted swap requests can be marked as completed",
            });
        }

        swapRequest.status = "completed";
        swapRequest.completedAt = new Date();
        await swapRequest.save();

        // Create notification for both users
        const notificationData = {
            type: "swap_completed",
            title: "Skill Swap Completed! 🎉",
            message: `Your skill swap for "${swapRequest.skillRequested.title}" has been marked as completed`,
            link: `/dashboard/swap-requests`,
            priority: "medium",
            data: {
                swapRequestId: swapRequest._id,
            },
        };

        await Notification.create([
            {
                ...notificationData,
                recipient: swapRequest.requester._id,
                sender: swapRequest.skillProvider._id,
            },
            {
                ...notificationData,
                recipient: swapRequest.skillProvider._id,
                sender: swapRequest.requester._id,
            },
        ]);

        res.status(200).json({
            success: true,
            data: swapRequest,
            message: "Swap request marked as completed",
        });
    } catch (error) {
        console.error("Error completing swap request:", error);
        res.status(500).json({
            success: false,
            error: "Failed to complete swap request",
            details: error.message,
        });
    }
};

// Cancel a swap request
exports.cancelSwapRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const swapRequest = await SwapRequest.findById(id);

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                error: "Swap request not found",
            });
        }

        if (swapRequest.status === "completed") {
            return res.status(400).json({
                success: false,
                error: "Completed swap requests cannot be cancelled",
            });
        }

        swapRequest.status = "cancelled";
        await swapRequest.save();

        res.status(200).json({
            success: true,
            data: swapRequest,
            message: "Swap request cancelled successfully",
        });
    } catch (error) {
        console.error("Error cancelling swap request:", error);
        res.status(500).json({
            success: false,
            error: "Failed to cancel swap request",
            details: error.message,
        });
    }
};

// Get swap request statistics for a user
exports.getSwapRequestStats = async (req, res) => {
    try {
        const userId = req.params.userId;

        const stats = await SwapRequest.aggregate([
            {
                $match: {
                    $or: [
                        { requester: new mongoose.Types.ObjectId(userId) },
                        { skillProvider: new mongoose.Types.ObjectId(userId) },
                    ],
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        const formattedStats = {
            total: 0,
            pending: 0,
            accepted: 0,
            rejected: 0,
            completed: 0,
            cancelled: 0,
        };

        stats.forEach((stat) => {
            formattedStats[stat._id] = stat.count;
            formattedStats.total += stat.count;
        });

        res.status(200).json({
            success: true,
            data: formattedStats,
        });
    } catch (error) {
        console.error("Error fetching swap request stats:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch swap request statistics",
            details: error.message,
        });
    }
};
