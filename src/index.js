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

// Middleware - 
app.use(cors());                                     
app.use(express.json());                             

// Database Connection - MongoDB 
mongoose.connect(process.env.MONGODB_URI)            
  .then(() => {                                      
    console.log("✅ Database connected successfully")
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
  });

// User Schema
const userSchema = new mongoose.Schema({             
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// Skill Schema
const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  proficiency: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Expert'], 
    default: 'Beginner' 
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Skill = mongoose.model("Skill", skillSchema, "skillsCollection");

// ------------------- Routes -------------------

// Root route
app.get("/", (req, res) => {                          
  res.send("🚀 Server is running...");                
});

// ------------------- USERS CRUD APIs -------------------

// CREATE User
app.post("/users", async (req, res) => {              
  try {                                               
    const user = new User(req.body);                  
    await user.save();                                
    res.status(201).json(user);                       
  } catch (err) {                                     
    res.status(400).json({ error: err.message });     
  }
});

// READ All Users
app.get("/users", async (req, res) => {              
  try {
    const users = await User.find();                 
    res.json(users);                                 
  } catch (err) {
    res.status(500).json({ error: err.message });    
  }
});

// READ Single User by ID
app.get("/users/:id", async (req, res) => {           
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE User
app.put("/users/:id", async (req, res) => {           
  try {
    const updatedUser = await User.findByIdAndUpdate( 
      req.params.id,                                  
      req.body,                                       
      { new: true, runValidators: true }              
    );
    if (!updatedUser) return res.status(404).json({ error: "User not found" }); 
    res.json(updatedUser);                            
  } catch (err) {
    res.status(400).json({ error: err.message });     
  }
});

// DELETE User
app.delete("/users/:id", async (req, res) => {        
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" }); 
    res.json({ message: "User deleted successfully" }); 
  } catch (err) {
    res.status(500).json({ error: err.message });     
  }
});

// ------------------- SKILLS COLLECTION CRUD APIs -------------------

// ------------------- SKILLS COLLECTION CRUD APIs -------------------

// CREATE Skill - FIXED VERSION
app.post("/skillsCollection", async (req, res) => {
  try {
    console.log("📝 Creating new skill:", req.body);
    
    // Validate required fields
    if (!req.body.name || !req.body.category || !req.body.userId) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: name, category, userId" 
      });
    }
    
    const skill = new Skill({
      name: req.body.name,
      category: req.body.category,
      proficiency: req.body.proficiency || "Beginner",
      userId: req.body.userId
    });
    
    await skill.save();
    console.log("✅ Skill created successfully:", skill._id);
    
    res.status(201).json({ 
      success: true, 
      message: "Skill created successfully",
      data: skill 
    });
  } catch (err) {
    console.error("❌ Skill creation error:", err);
    res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// READ All Skills - FIXED VERSION
app.get("/skillsCollection", async (req, res) => {
  try {
    console.log("📖 Fetching all skills");
    const skills = await Skill.find().populate('userId', 'name email');
    
    res.json({ 
      success: true, 
      count: skills.length,
      data: skills 
    });
  } catch (err) {
    console.error("❌ Error fetching skills:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Run Server
app.listen(port, () => {                              
  console.log(`🚀 Server is running on port ${port}`);
});