// External Packages -
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// import routes
// const userRoutes = require("./src/routes/usersRoute");
const skillsRoutes = require("./src/routes/skillsRoute");
const contactRoute = require("./src/routes/contactRoute"); 

// Load .env file - environment variables
dotenv.config();

// Express app init -
const app = express();
const port = process.env.PORT || 5000;

// Enhanced Middleware -
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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

// Root route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "🚀 Skills Swap API Server is running successfully!",
        version: "1.0.0",
        endpoints: {
            users: "/api/users",
            skills: "/api/skills",
            contact: "/api/contact",
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



// Mount all routes
// app.use("/api/users", userRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api", contactRoute); // ✅ যোগ করো

// Run Server
app.listen(port, () => {
    console.log(`🚀 Skills Swap API Server is running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 API Base URL: http://localhost:${port}`);
    console.log(`📖 API Documentation: http://localhost:${port}/`);
});
