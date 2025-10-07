const express = require("express");
const router = express.Router();
const swapRequestController = require("../controllers/swapRequestController");

// Create a new swap request
router.post("/", swapRequestController.createSwapRequest);

// Get all swap requests for a user
router.get("/user/:userId", swapRequestController.getSwapRequests);

// Get swap request statistics for a user
router.get("/user/:userId/stats", swapRequestController.getSwapRequestStats);

// Get a single swap request by ID
router.get("/:id", swapRequestController.getSwapRequestById);

// Respond to a swap request (accept/reject)
router.patch("/:id/respond", swapRequestController.respondToSwapRequest);

// Mark swap request as completed
router.patch("/:id/complete", swapRequestController.completeSwapRequest);

// Cancel a swap request
router.patch("/:id/cancel", swapRequestController.cancelSwapRequest);

module.exports = router;
