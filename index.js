// src/index.js

// External Packages -
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

// import routes
const userRoutes = require("./src/routes/usersRoute");
const skillsRoutes = require("./src/routes/skillsRoute");
const messageRoutes = require("./src/routes/messageRoute");
const notificationRoutes = require("./src/routes/notificationRoute");
const swapRequestRoutes = require("./src/routes/swapRequestRoute");
const sessionRoutes = require("./src/routes/sessionRoute");
const courseRoutes = require("./src/routes/courseRoute");

// import socket handler
const socketHandler = require("./src/socket/socketHandler");
const contactRoute = require("./src/routes/contactRoute");

// Load .env file - environment variables
dotenv.config();

// Express app init -
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Socket.IO initialization
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Initialize socket handler
socketHandler(io);

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
            messages: "/api/messages",
            notifications: "/api/notifications",
            swapRequests: "/api/swap-requests",
            sessions: "/api/sessions",
            courses: "/api/courses",
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
app.use("/api/users", userRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/swap-requests", swapRequestRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/contact", contactRoute);
app.use("/api/courses", courseRoutes);

// Run Server
server.listen(port, () => {
    console.log(`🚀 Skills Swap API Server is running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 API Base URL: http://localhost:${port}`);
    console.log(`🔌 Socket.IO is enabled`);
    console.log(`📖 API Documentation: http://localhost:${port}/`);
});
