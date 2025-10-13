import mongoose from "mongoose";

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
export default User;