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



// // User Schema এর পরে Skill Schema যোগ করো
// const skillSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   category: { type: String, required: true },
//   proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], default: 'Beginner' },
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // কোন user এর skill
//   createdAt: { type: Date, default: Date.now }
// });

// const Skill = mongoose.model("SkillCollection", skillSchema);

// // Skill Schema
// const skillSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   category: { type: String, required: true },
//   proficiency: { 
//     type: String, 
//     enum: ['Beginner', 'Intermediate', 'Expert'], 
//     default: 'Beginner' 
//   },
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   createdAt: { type: Date, default: Date.now }
// });

// // If you want collection name = "SkillCollection"
// const Skill = mongoose.model("Skill", skillSchema, "SkillCollection");

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

// একটি Model রাখো (একটি line)
const Skill = mongoose.model("Skill", skillSchema);







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

// ------------------- End of USERS CRUD APIs -------------------


// ------------------- Skills CRUD APIs -------------------

// CREATE Skill (POST) - API
// app.post("/skills", async (req, res) => {
//   try {
//     const skill = new Skill(req.body);
//     await skill.save();
//     res.status(201).json(skill);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

app.post("/skills", async (req, res) => {
  try {
    const skill = new Skill(req.body);
    await skill.save();
    res.status(201).json(skill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ All Skills (GET) - API
app.get("/skills", async (req, res) => {
  try {
    const skills = await Skill.find().populate('userId', 'name email'); // User information সহ
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ Skills by User ID (GET) - API
app.get("/skills/user/:userId", async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.params.userId });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ Single Skill by ID (GET) - API
app.get("/skills/:id", async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id).populate('userId');
    if (!skill) return res.status(404).json({ error: "Skill not found" });
    res.json(skill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE Skill (PUT) - API
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

// DELETE Skill (DELETE) - API
app.delete("/skills/:id", async (req, res) => {
  try {
    const deletedSkill = await Skill.findByIdAndDelete(req.params.id);
    if (!deletedSkill) return res.status(404).json({ error: "Skill not found" });
    res.json({ message: "Skill deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- End of Skills CRUD APIs -------------------

// Run Server - 
app.listen(port, () => {                              
  console.log(`🚀 Server is running on port ${port}`);
});