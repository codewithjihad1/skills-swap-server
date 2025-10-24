const User = require("../dbSchemas/userShema.js");
const Skill = require("../dbSchemas/skillSchema.js");

const userController = {
    // Get all users with pagination and filters (Admin only)
    getAllUsers: async (req, res) => {
        try {
            const { page = 1, limit = 100, role, status, search } = req.query;

            // Build filter query
            const filter = {};

            // Role filter - map frontend roles to backend roles
            if (role && role !== "all") {
                if (role === "user") {
                    filter.role = "student";
                } else {
                    filter.role = role;
                }
            }

            // Status filter - map to isActive
            if (status && status !== "all") {
                if (status === "active") {
                    filter.isActive = true;
                } else if (status === "suspended" || status === "banned") {
                    filter.isActive = false;
                } else if (status === "pending") {
                    // You can add a pending field if needed
                    filter.isActive = true;
                }
            }

            // Search filter (name or email)
            if (search && search.trim() !== "") {
                filter.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ];
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const users = await User.find(filter)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await User.countDocuments(filter);

            // Map backend role names to frontend expected names
            const mappedUsers = users.map((user) => {
                const userObj = user.toObject();
                // Map student -> user for frontend
                if (userObj.role === "student") {
                    userObj.role = "user";
                }
                // Add status based on isActive
                userObj.status = userObj.isActive ? "active" : "suspended";
                return userObj;
            });

            res.status(200).json({
                users: mappedUsers,
                total,
                pages: Math.ceil(total / parseInt(limit)),
                currentPage: parseInt(page),
            });
        } catch (err) {
            console.error("Error fetching all users:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Get user statistics (Admin only)
    getUserStats: async (req, res) => {
        try {
            const totalUsers = await User.countDocuments();
            const activeUsers = await User.countDocuments({ isActive: true });
            const instructors = await User.countDocuments({
                role: "instructor",
            });
            const students = await User.countDocuments({ role: "student" });
            const suspendedUsers = await User.countDocuments({
                isActive: false,
            });

            res.status(200).json({
                stats: {
                    totalUsers,
                    activeUsers,
                    instructors,
                    students,
                    suspendedUsers,
                    pendingApprovals: 0, // Add this field if you have a pending approval system
                },
            });
        } catch (err) {
            console.error("Error fetching user stats:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Update user role (Admin only)
    updateUserRole: async (req, res) => {
        try {
            const { role } = req.body;
            const userId = req.params.id;

            // Validate role
            const validRoles = ["user", "instructor", "admin"];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    error: "Invalid role. Must be user, instructor, or admin",
                });
            }

            // Map frontend role to backend role
            const backendRole = role === "user" ? "student" : role;

            const user = await User.findByIdAndUpdate(
                userId,
                { role: backendRole, updatedAt: Date.now() },
                { new: true, runValidators: true }
            ).select("-password");

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Map back to frontend role for response
            const userResponse = user.toObject();
            if (userResponse.role === "student") {
                userResponse.role = "user";
            }
            userResponse.status = userResponse.isActive
                ? "active"
                : "suspended";

            res.status(200).json({
                message: "User role updated successfully",
                user: userResponse,
            });
        } catch (err) {
            console.error("Error updating user role:", err);
            if (err.name === "CastError") {
                return res
                    .status(400)
                    .json({ error: "Invalid user ID format" });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // Update user status (Admin only)
    updateUserStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const userId = req.params.id;

            // Validate status
            const validStatuses = ["active", "suspended", "banned"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: "Invalid status. Must be active, suspended, or banned",
                });
            }

            // Map status to isActive field
            const isActive = status === "active";

            const user = await User.findByIdAndUpdate(
                userId,
                { isActive, updatedAt: Date.now() },
                { new: true, runValidators: true }
            ).select("-password");

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Map to frontend format
            const userResponse = user.toObject();
            if (userResponse.role === "student") {
                userResponse.role = "user";
            }
            userResponse.status = isActive ? "active" : status;

            res.status(200).json({
                message: "User status updated successfully",
                user: userResponse,
            });
        } catch (err) {
            console.error("Error updating user status:", err);
            if (err.name === "CastError") {
                return res
                    .status(400)
                    .json({ error: "Invalid user ID format" });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    getUserProfile: (req, res) => {
        const userId = req.params.id;

        User.findById(userId)
            .select("-password")
            .populate("skills", "title category proficiency")
            .then((user) => {
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                res.status(200).json(user);
            })
            .catch((err) => {
                console.error("Error fetching user profile:", err);
                res.status(500).json({ error: "Internal server error" });
            });
    },

    // get user by email
    getUserByEmail: async (req, res) => {
        try {
            const user = await User.findOne({ email: req.params.email })
                .select("-password")
                .populate(
                    "skills",
                    "title category proficiency description tags"
                );
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            res.status(200).json(user);
        } catch (err) {
            console.error("Error fetching user by email:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // create user
    createUser: async (req, res) => {
        try {
            const { name, email, password, bio, avatar } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({
                    error: "User with this email already exists",
                });
            }

            const user = new User({ name, email, password, bio, avatar });
            await user.save();

            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.password;

            res.status(201).json({
                message: "User created successfully",
                user: userResponse,
            });
        } catch (err) {
            console.error("Error creating user:", err);
            if (err.name === "ValidationError") {
                return res.status(400).json({
                    error: "Validation error",
                    details: Object.values(err.errors).map((e) => e.message),
                });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get user by id
    getUserById: async (req, res) => {
        try {
            const user = await User.findById(req.params.id)
                .select("-password")
                .populate(
                    "skills",
                    "title category proficiency description tags"
                );
            console.log("🚀 ~ user:", user);

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            res.status(200).json(user);
        } catch (err) {
            console.error("Error fetching user:", err);
            if (err.name === "CastError") {
                return res
                    .status(400)
                    .json({ error: "Invalid user ID format" });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // update user by id
    updateUser: async (req, res) => {
        try {
            const { name, bio, image } = req.body;
            const updateData = { name, bio, image, updatedAt: Date.now() };

            const user = await User.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    new: true,
                    runValidators: true,
                }
            ).select("-password");

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            res.status(200).json({
                message: "User updated successfully",
                user,
            });
        } catch (err) {
            console.error("Error updating user:", err);
            if (err.name === "ValidationError") {
                return res.status(400).json({
                    error: "Validation error",
                    details: Object.values(err.errors).map((e) => e.message),
                });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // delete user
    deleteUser: async (req, res) => {
        try {
            const { permanent } = req.query;

            // If permanent deletion is requested (admin only)
            if (permanent === "true") {
                const user = await User.findByIdAndDelete(req.params.id);

                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }

                return res.status(200).json({
                    message: "User permanently deleted successfully",
                });
            }

            // Otherwise, just deactivate the user
            const user = await User.findByIdAndUpdate(
                req.params.id,
                { isActive: false, updatedAt: Date.now() },
                { new: true }
            ).select("-password");

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            res.status(200).json({
                message: "User deactivated successfully",
            });
        } catch (err) {
            console.error("Error deleting user:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    },
};

module.exports = userController;
