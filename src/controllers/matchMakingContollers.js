import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const findAiMatches = async (req, res) => {
  try {
    const { category } = req.body;

    // Fetch matching users from MongoDB
    const users = await User.find({
      $or: [
        { skillOffered: { $regex: category, $options: "i" } },
        { skillWanted: { $regex: category, $options: "i" } },
      ],
    }).lean();

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found for this category" });
    }

    // Prepare AI model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a skill matchmaking AI assistant. 
Here is a list of users and their skills:
${JSON.stringify(users, null, 2)}

Analyze who could be the best skill swap partners.
Return only JSON in this format:
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

    // Clean up AI response
    const clean = text.replace(/```json|```/g, "").trim();

    let matches = [];
    try {
      matches = JSON.parse(clean);
    } catch (e) {
      console.warn("AI returned invalid JSON:", clean);
    }

    return res.status(200).json({
      message: "AI matchmaking successful",
      matches: matches || [],
    });
  } catch (error) {
    console.error("AI Matchmaking Error:", error);
    res.status(500).json({ message: "AI matchmaking failed", error: error.message });
  }
};
