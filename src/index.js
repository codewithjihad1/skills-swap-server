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

// Example Schema & Model - ডাটাবেসের ডাটা স্ট্রাকচার ডিফাইন করা
const userSchema = new mongoose.Schema({             
  name: { type: String, required: true },            // required name field
  email: { type: String, required: true, unique: true }, // required and unique email field
  createdAt: { type: Date, default: Date.now }       // required createdAt field with default value
});

const User = mongoose.model("User", userSchema);      // Schema থেকে Model তৈরি ("User" নামে কালেকশন তৈরি হবে)

// ------------------- Routes -------------------

// Root route - 
app.get("/", (req, res) => {                          
  res.send("🚀 Server is running...");                
});

// ------------------- CRUD APIs -------------------

// CREATE User (POST) - API
app.post("/users", async (req, res) => {              
  try {                                               
    const user = new User(req.body);                  
    await user.save();                                
    res.status(201).json(user);                       
  } catch (err) {                                     
    res.status(400).json({ error: err.message });     
  }
});

// READ All Users (GET) - API
app.get("/users", async (req, res) => {              
  try {
    const users = await User.find();                 
    res.json(users);                                 
  } catch (err) {
    res.status(500).json({ error: err.message });    
  }
});

// READ Single User by ID (GET) - API
app.get("/users/:id", async (req, res) => {           
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE User (PUT) - API
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

// DELETE User (DELETE) - API
app.delete("/users/:id", async (req, res) => {        
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id); // By Id deleted the user
    if (!deletedUser) return res.status(404).json({ error: "User not found" }); 
    res.json({ message: "User deleted successfully" }); 
  } catch (err) {
    res.status(500).json({ error: err.message });     
  }
});

// Run Server - 
app.listen(port, () => {                              
  console.log(`🚀 Server is running on port ${port}`);
});