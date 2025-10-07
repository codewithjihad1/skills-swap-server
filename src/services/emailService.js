// services/emailService.js
const nodemailer = require("nodemailer");
require('dotenv').config(); 

console.log("🔧 Setting up email service...");
console.log("Email User:", process.env.EMAIL_USER);
console.log("Email Pass exists:", !!process.env.EMAIL_PASS); // ✅ চেক করুন

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ Email connection failed:", error.message);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

module.exports = transporter;