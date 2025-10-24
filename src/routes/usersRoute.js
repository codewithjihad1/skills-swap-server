const express = require("express");
const router = express.Router();

const usersController = require("../controllers/userController");

// Admin user management routes
router.get("/", usersController.getAllUsers); // Get all users with filters
router.get("/stats", usersController.getUserStats); // Get user statistics
router.patch("/:id/role", usersController.updateUserRole); // Update user role
router.patch("/:id/status", usersController.updateUserStatus); // Update user status

// Standard user routes
router.post("/", usersController.createUser);
router.get("/:id", usersController.getUserById);
router.get("/email/:email", usersController.getUserByEmail);
router.put("/:id", usersController.updateUser);
router.delete("/:id", usersController.deleteUser);
router.get("/profile/:id", usersController.getUserProfile);

module.exports = router;
