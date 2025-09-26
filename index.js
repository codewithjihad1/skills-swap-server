// External Packages -
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load .env file - environment variables
dotenv.config();

// Express app init -
const app = express();
const port = process.env.PORT || 5000;

// Enhanced Middleware -
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
// ------------------- SERVER STARTUP -------------------

// Graceful shutdown handling
process.on("SIGTERM", async () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    try {
        await mongoose.connection.close();
        console.log("Database connection closed.");
        process.exit(0);
    } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
    }
});

process.on("SIGINT", async () => {
    console.log("SIGINT received. Shutting down gracefully...");
    try {
        await mongoose.connection.close();
        console.log("Database connection closed.");
        process.exit(0);
    } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
    }
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Database Connection - MongoDB with better error handling
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error(
                "MONGODB_URI is not defined in environment variables"
            );
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Database connected successfully");
    } catch (error) {
        console.error("❌ Database connection error:", error.message);
        process.exit(1);
    }
};

connectDB();

// Enhanced User Schema
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email",
            ],
        },
        password: {
            type: String,
            minlength: [6, "Password must be at least 6 characters"],
        },
        avatar: {
            type: String,
            default: null,
        },
        skills: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Skill",
            },
        ],
        bio: {
            type: String,
            maxlength: [500, "Bio cannot exceed 500 characters"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

// Enhanced Skill Schema
const skillSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Skill title is required"],
            trim: true,
            maxlength: [100, "Skill title cannot exceed 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Skill description is required"],
            maxlength: [1000, "Description cannot exceed 1000 characters"],
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            // enum: [
            //     "Technology",
            //     "Design",
            //     "Business",
            //     "Marketing",
            //     "Writing",
            //     "Photography",
            //     "Music",
            //     "Other",
            // ],
        },
        proficiency: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
            default: "Beginner",
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

const Skill = mongoose.model("Skill", skillSchema);

// ------------------- Routes -------------------

// Root route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "🚀 Skills Swap API Server is running successfully!",
        version: "1.0.0",
        endpoints: {
            users: "/api/users",
            skills: "/api/skills",
        },
    });
});

// Health check route
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database:
            mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
});

// ------------------- USER CRUD APIs -------------------

// CREATE User
app.post("/api/users", async (req, res) => {
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
});

// READ All Users
app.get("/api/users", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find({ isActive: true })
            .select("-password")
            .populate("skills", "title category proficiency")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments({ isActive: true });

        res.status(200).json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// READ Single User by ID
app.get("/api/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password")
            .populate("skills", "title category proficiency description tags");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

// UPDATE User
app.put("/api/users/:id", async (req, res) => {
    try {
        const { name, bio, avatar } = req.body;
        const updateData = { name, bio, avatar, updatedAt: Date.now() };

        const user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).select("-password");

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
});

// DELETE User (Soft delete)
app.delete("/api/users/:id", async (req, res) => {
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
});

// ------------------- SKILLS CRUD APIs -------------------

// post skills
app.post("/api/skills", async (req, res) => {
    try {
        // Check if request body exists and has required fields
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                error: "Request body is required",
                message: "Please provide skill data in the request body",
            });
        }

        const { title, description, category, proficiency, tags, userId } =
            req.body;

        // Validate required fields
        if (!title || !description || !category || !userId) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["title", "description", "category", "userId"],
                received: Object.keys(req.body),
            });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const skill = new Skill({
            title,
            description,
            category,
            proficiency: proficiency || "Beginner",
            tags: tags || [],
            userId,
        });

        await skill.save();

        // Add skill to user's skills array
        await User.findByIdAndUpdate(userId, {
            $push: { skills: skill._id },
        });

        const populatedSkill = await Skill.findById(skill._id).populate(
            "userId",
            "name email avatar"
        );

        res.status(201).json({
            message: "Skill created successfully",
            skill: populatedSkill,
        });
    } catch (err) {
        console.error("Error creating skill:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({
                error: "Validation error",
                details: Object.values(err.errors).map((e) => e.message),
            });
        }
        if (err.name === "CastError") {
            return res.status(400).json({
                error: "Invalid user ID format",
            });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

// READ All Skills with filtering and pagination
app.get("/api/skills", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = { isActive: true };

        if (req.query.category) {
            filter.category = req.query.category;
        }

        if (req.query.proficiency) {
            filter.proficiency = req.query.proficiency;
        }

        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: "i" } },
                { description: { $regex: req.query.search, $options: "i" } },
                { tags: { $in: [new RegExp(req.query.search, "i")] } },
            ];
        }

        const skills = await Skill.find(filter)
            .populate("userId", "name email avatar bio")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Skill.countDocuments(filter);

        res.status(200).json({
            skills,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            filters: {
                category: req.query.category || null,
                proficiency: req.query.proficiency || null,
                search: req.query.search || null,
            },
        });
    } catch (err) {
        console.error("Error fetching skills:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// READ Single Skill by ID
app.get("/api/skills/:id", async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id).populate(
            "userId",
            "name email avatar bio"
        );

        if (!skill) {
            return res.status(404).json({ error: "Skill not found" });
        }

        res.status(200).json(skill);
    } catch (err) {
        console.error("Error fetching skill:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid skill ID format" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

// UPDATE Skill
app.put("/api/skills/:id", async (req, res) => {
    try {
        const { title, description, category, proficiency, tags } = req.body;
        const updateData = {
            title,
            description,
            category,
            proficiency,
            tags,
            updatedAt: Date.now(),
        };

        const skill = await Skill.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).populate("userId", "name email avatar");

        if (!skill) {
            return res.status(404).json({ error: "Skill not found" });
        }

        res.status(200).json({
            message: "Skill updated successfully",
            skill,
        });
    } catch (err) {
        console.error("Error updating skill:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({
                error: "Validation error",
                details: Object.values(err.errors).map((e) => e.message),
            });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE Skill (Soft delete)
app.delete("/api/skills/:id", async (req, res) => {
    try {
        const skill = await Skill.findByIdAndUpdate(
            req.params.id,
            { isActive: false, updatedAt: Date.now() },
            { new: true }
        );

        if (!skill) {
            return res.status(404).json({ error: "Skill not found" });
        }

        // Remove skill from user's skills array
        await User.findByIdAndUpdate(skill.userId, {
            $pull: { skills: skill._id },
        });

        res.status(200).json({
            message: "Skill deleted successfully",
        });
    } catch (err) {
        console.error("Error deleting skill:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET Skills by User ID
app.get("/api/users/:userId/skills", async (req, res) => {
    try {
        const skills = await Skill.find({
            userId: req.params.userId,
            isActive: true,
        }).sort({ createdAt: -1 });

        res.status(200).json({
            skills,
            count: skills.length,
        });
    } catch (err) {
        console.error("Error fetching user skills:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ------------------- ADDITIONAL UTILITY ROUTES -------------------

// Get categories
app.get("/api/categories", (req, res) => {
    const categories = [
        "Technology",
        "Design",
        "Business",
        "Marketing",
        "Writing",
        "Photography",
        "Music",
        "Other",
    ];
    res.status(200).json({ categories });
});

// Get proficiency levels
app.get("/api/proficiency-levels", (req, res) => {
    const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];
    res.status(200).json({ levels });
});

// ------------------- ERROR HANDLING -------------------

// 404 handler for undefined routes (must be after all other routes)
app.use((req, res, next) => {
    res.status(404).json({
        error: "Route not found",
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error("Global error:", error);
    res.status(500).json({
        error: "Something went wrong!",
        message:
            process.env.NODE_ENV === "development"
                ? error.message
                : "Internal server error",
    });
});

// ------------------- SERVER STARTUP -------------------

// Graceful shutdown handling
process.on("SIGTERM", async () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    try {
        await mongoose.connection.close();
        console.log("Database connection closed.");
        process.exit(0);
    } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
    }
});

process.on("SIGINT", async () => {
    console.log("SIGINT received. Shutting down gracefully...");
    try {
        await mongoose.connection.close();
        console.log("Database connection closed.");
        process.exit(0);
    } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
    }
});

// Run Server
app.listen(port, () => {
    console.log(`🚀 Skills Swap API Server is running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 API Base URL: http://localhost:${port}`);
    console.log(`📖 API Documentation: http://localhost:${port}/`);
});
