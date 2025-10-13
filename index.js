// ==========================
// External Packages
// ==========================
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ==========================
// Import Existing Routes
// ==========================
const userRoutes = require("./src/routes/usersRoute");
const skillsRoutes = require("./src/routes/skillsRoute");
const messageRoutes = require("./src/routes/messageRoute");
const notificationRoutes = require("./src/routes/notificationRoute");
const swapRequestRoutes = require("./src/routes/swapRequestRoute");
const contactRoute = require("./src/routes/contactRoute");
const socketHandler = require("./src/socket/socketHandler");

// ==========================
// Load Environment Variables
// ==========================
dotenv.config();

// ==========================
// Express App Initialization
// ==========================
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// ==========================
// Socket.IO Initialization
// ==========================
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket event handlers
socketHandler(io);

// ==========================
// Middleware
// ==========================
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ==========================
// Database Connection
// ==========================
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI not defined in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1);
  }
};

connectDB();

// ==========================
// User Schema & Model
// ==========================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: String,
  skillOffered: { type: String, required: true },
  skillWanted: { type: String, required: true },
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    required: true,
  },
  rating: Number,
  location: String,
  isOnline: Boolean,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

// ==========================
// AI Matchmaking Controller
// ==========================
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const findAiMatches = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    // Find matching users
    const users = await User.find({
      $or: [
        { skillOffered: { $regex: category, $options: "i" } },
        { skillWanted: { $regex: category, $options: "i" } },
      ],
    }).lean();

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found for this category" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a smart AI matchmaking assistant. 
Given these users and their skill data:
${JSON.stringify(users, null, 2)}

Find up to 3 pairs of the best skill swap partners.
Respond with JSON only in this format:
[
  {
    "user1Name": "",
    "user2Name": "",
    "matchReason": "",
    "compatibilityScore": 0
  }
]
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();

    let matches = [];
    try {
      matches = JSON.parse(clean);
    } catch (e) {
      console.warn("AI returned invalid JSON:", clean);
    }

    res.status(200).json({
      message: "AI matchmaking successful",
      matches: matches || [],
    });
  } catch (error) {
    console.error("AI Matchmaking Error:", error);
    res
      .status(500)
      .json({ message: "AI matchmaking failed", error: error.message });
  }
};

// ==========================
// Root Route
// ==========================
app.get("/", (req, res) => {
  res.status(200).json({
    message: "🚀 Skill Swap API Server is running successfully!",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      skills: "/api/skills",
      messages: "/api/messages",
      notifications: "/api/notifications",
      swapRequests: "/api/swap-requests",
      contact: "/api/contact",
      matchmaking: "/api/matchmaking",
    },
  });
});

// ==========================
// Health Check Route
// ==========================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ==========================
// Mount All Routes
// ==========================
app.use("/api/users", userRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/swap-requests", swapRequestRoutes);
app.use("/api/contact", contactRoute);

// 🧠 AI Matchmaking Route
app.post("/api/matchmaking", findAiMatches);

// ==========================
// Start Server
// ==========================
server.listen(port, () => {
  console.log(`🚀 Skill Swap API Server running on port ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 API Base URL: http://localhost:${port}`);
  console.log(`🔌 Socket.IO enabled`);
});
