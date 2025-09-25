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

const Skill = mongoose.model("Skill", skillSchema);

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

// ------------------- SKILLS CRUD APIs -------------------

// CREATE Skill
app.post("/skills", async (req, res) => {
  try {
    const skill = new Skill(req.body);
    await skill.save();
    res.status(201).json(skill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ All Skills
app.get("/skills", async (req, res) => {
  try {
    const skills = await Skill.find().populate('userId', 'name email');
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ Skills by User ID
app.get("/skills/user/:userId", async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.params.userId });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ Single Skill by ID
app.get("/skills/:id", async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id).populate('userId');
    if (!skill) return res.status(404).json({ error: "Skill not found" });
    res.json(skill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE Skill
app.put("/skills/:id", async (req, res) => {
  try {
    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedSkill) return res.status(404).json({ error: "Skill not found" });
    res.json(updatedSkill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE Skill
app.delete("/skills/:id", async (req, res) => {
  try {
    const deletedSkill = await Skill.findByIdAndDelete(req.params.id);
    if (!deletedSkill) return res.status(404).json({ error: "Skill not found" });
    res.json({ message: "Skill deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run Server
app.listen(port, () => {                              
  console.log(`🚀 Server is running on port ${port}`);
});