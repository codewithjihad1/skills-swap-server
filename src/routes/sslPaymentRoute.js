const express = require('express');
const { SSLPaymentInit } = require('../controllers/sslPaymentController');
const router = express.Router();

// Create payment
router.post('/create', SSLPaymentInit);

module.exports = router;
