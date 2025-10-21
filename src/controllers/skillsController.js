const Skill = require("../dbSchemas/skillSchema");

// controller functions
const skillsController = {
    // post a new skill
    createSkill: async (req, res) => {
        try {
            const newSkill = new Skill(req.body);
            const savedSkill = await newSkill.save();
            res.status(201).json(savedSkill);
        } catch (error) {
            res.status(500).json({ message: "Error creating skill", error });
        }
    },

    // Get all skills
    getAllSkills: async (req, res) => {
        try {
            const { search, category, proficiency } = req.query;

            // Build query object
            let query = {};

            // Add search filter (searches in title, description, and tags)
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                    { tags: { $in: [new RegExp(search, "i")] } },
                ];
            }

            // Add category filter
            if (category && category !== "All") {
                query.category = category;
            }

            // Add proficiency filter
            if (proficiency && proficiency !== "All") {
                query.proficiency = proficiency;
            }

            // Fetch skills with filters and populate user data
            const skills = await Skill.find(query)
                .populate("offeredBy", "name email avatar")
                .sort({ createdAt: -1 });

            res.status(200).json(skills);
        } catch (error) {
            res.status(500).json({ message: "Error fetching skills", error });
        }
    },

    // Get a skill by ID
    getSkillById: async (req, res) => {
        try {
            const skill = await Skill.findById(req.params.id);
            if (!skill) {
                return res.status(404).json({ message: "Skill not found" });
            }
            res.status(200).json(skill);
        } catch (error) {
            res.status(500).json({ message: "Error fetching skill", error });
        }
    },

    // get skills by user email
    // getSkillsByUserEmail: async (req, res) => {
    //     try {
    //         const skills = await Skill.find({ userEmail: req.params.email });
    //         res.status(200).json(skills);
    //     } catch (error) {
    //         res.status(500).json({ message: "Error fetching skills", error });
    //     }
    // },

    // get skills by user ID
    getSkillsByUserId: async (req, res) => {
        try {
            const skills = await Skill.find({ offeredBy: req.params.id });
            res.status(200).json(skills);
        } catch (error) {
            res.status(500).json({ message: "Error fetching skills", error });
        }
    },

    // Update a skill by ID
    updateSkill: async (req, res) => {
        try {
            const skill = await Skill.findByIdAndUpdate(
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
            const skill = await Skill.findByIdAndDelete(req.params.id);
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
