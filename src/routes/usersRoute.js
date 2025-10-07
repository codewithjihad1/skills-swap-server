const express = require("express");
const router = express.Router();

const usersController = require("../controllers/userController");

// define routes for users
router.post("/", usersController.createUser);
router.get("/:id", usersController.getUserById);
router.put("/:id", usersController.updateUser);
router.delete("/:id", usersController.deleteUser);
router.get("/profile/:id", usersController.getUserProfile);

module.exports = router;
