const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Initiate payment
router.post("/initiate", paymentController.initiatePayment);

// Complete payment
router.post("/complete", paymentController.completePayment);

// Get payment status by order ID
router.get("/status/:orderId", paymentController.getPaymentStatus);

// Get user's payment history
router.get("/user/:userId", paymentController.getUserPayments);

module.exports = router;
