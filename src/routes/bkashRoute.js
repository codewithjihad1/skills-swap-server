const express = require("express");
const router = express.Router();
const bkashController = require("../controllers/bkashController");

// Create payment
router.post("/create", bkashController.createPayment);

// Execute payment
router.post("/execute", bkashController.executePayment);

// Query payment status
router.get("/query/:paymentID", bkashController.queryPayment);

// Refund payment
router.post("/refund", bkashController.refundPayment);

// Callback handler
router.get("/callback", bkashController.handleCallback);

module.exports = router;
