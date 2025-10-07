// routes/contactRoute.js
const express = require("express");
const { sendMessage } = require("../controllers/contactController");
const router = express.Router();

router.post("/contact", sendMessage);

module.exports = router;