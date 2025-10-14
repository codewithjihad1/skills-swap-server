const express = require("express");
const router = express.Router();

const skillsController = require("../controllers/skillsController");

// define routes for skills
router.post("/", skillsController.createSkill);
router.get("/", skillsController.getAllSkills);
router.get("/:id", skillsController.getSkillById);
// router.get("/user/:email", skillsController.getSkillsByUserEmail);
router.get("/user/:id", skillsController.getSkillsByUserId);
router.put("/:id", skillsController.updateSkill);
router.delete("/:id", skillsController.deleteSkill);

module.exports = router;