const Skills = require("../dbSchemas/skillSchema");

// controller functions
const skillsController = {
    // Create a new skill
    createSkill: async (req, res) => {
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
    },

    // Get all skills
    getAllSkills: async (req, res) => {
        try {
            const skills = await Skills.find();
            res.status(200).json(skills);
        } catch (error) {
            res.status(500).json({ message: "Error fetching skills", error });
        }
    },

    // Get a skill by ID
    getSkillById: async (req, res) => {
        try {
            const skill = await Skills.findById(req.params.id);
            if (!skill) {
                return res.status(404).json({ message: "Skill not found" });
            }
            res.status(200).json(skill);
        } catch (error) {
            res.status(500).json({ message: "Error fetching skill", error });
        }
    },

    // get skills by user email
    getSkillsByUserEmail: async (req, res) => {
        try {
            const skills = await Skills.find({ userEmail: req.params.email });
            res.status(200).json(skills);
        } catch (error) {
            res.status(500).json({ message: "Error fetching skills", error });
        }
    },

    // Update a skill by ID
    updateSkill: async (req, res) => {
        try {
            const skill = await Skills.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );
            if (!skill) {
                return res.status(404).json({ message: "Skill not found" });
            }
            res.status(200).json(skill);
        } catch (error) {
            res.status(500).json({ message: "Error updating skill", error });
        }
    },

    // Delete a skill by ID
    deleteSkill: async (req, res) => {
        try {
            const skill = await Skills.findByIdAndDelete(req.params.id);
            if (!skill) {
                return res.status(404).json({ message: "Skill not found" });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: "Error deleting skill", error });
        }
    },
};

module.exports = skillsController;
