const express = require("express");
const router = express.Router();

const usersController = require("../controllers/usersController");

// define routes for users
router.post("/", usersController.createUser);
router.get("/", usersController.getAllUsers);
router.get("/:id", usersController.getUserById);
router.put("/:id", usersController.updateUser);
router.delete("/:id", usersController.deleteUser);
router.get("/email/:email", usersController.getUserByEmail);
router.get("/profile/:id", usersController.getUserProfile);

module.exports = router;
