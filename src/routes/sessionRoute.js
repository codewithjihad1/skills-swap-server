const express = require("express");
const router = express.Router();
const {
    scheduleSession,
    getUserSessions,
    getSessionDetails,
    rescheduleSession,
    cancelSession,
    completeSession,
    getGoogleAuthUrl,
    handleGoogleCallback,
} = require("../controllers/sessionController");

// Google OAuth routes
router.get("/google/auth", getGoogleAuthUrl);
router.get("/google/callback", handleGoogleCallback);

// Session management routes
router.post("/schedule", scheduleSession);
router.get("/user/:userId", getUserSessions);
router.get("/:sessionId", getSessionDetails);
router.patch("/:sessionId/reschedule", rescheduleSession);
router.patch("/:sessionId/cancel", cancelSession);
router.patch("/:sessionId/complete", completeSession);

module.exports = router;
