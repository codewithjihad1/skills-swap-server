const User = require("../dbSchemas/userShema.js");
const Skill = require("../dbSchemas/skillSchema.js");

const userController = {
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
        console.log("🚀 ~ req:", req.params);
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
            const { name, bio, avatar } = req.body;
            const updateData = { name, bio, avatar, updatedAt: Date.now() };

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
