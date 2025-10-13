const Session = require("../models/Session");
const SwapRequest = require("../dbSchemas/swapRequestSchema");
const googleCalendarService = require("../services/googleCalendarService");
const googleMeetService = require("../services/googleMeetService");

/**
 * @route   POST /api/sessions/schedule
 * @desc    Schedule a session and create Google Calendar event
 * @access  Private
 */
const scheduleSession = async (req, res) => {
    try {
        const {
            swapRequestId,
            scheduledDate,
            duration = 60,
            notes,
            timeZone = "UTC",
        } = req.body;

        // Validate required fields
        if (!swapRequestId || !scheduledDate) {
            return res.status(400).json({
                error: "Swap request ID and scheduled date are required",
            });
        }

        // Fetch swap request details
        const swapRequest = await SwapRequest.findById(swapRequestId)
            .populate("requester", "name email avatar")
            .populate("skillProvider", "name email avatar")
            .populate("skillRequested", "title category")
            .populate("skillOffered", "title category");

        if (!swapRequest) {
            return res.status(404).json({ error: "Swap request not found" });
        }

        // Check if swap request is accepted
        if (swapRequest.status !== "accepted") {
            return res.status(400).json({
                error: "Can only schedule sessions for accepted swap requests",
            });
        }

        // Initialize Google Calendar service
        googleCalendarService.initializeClient();

        // Prepare event details
        const startDateTime = new Date(scheduledDate);
        const endDateTime = new Date(
            startDateTime.getTime() + duration * 60000
        );

        const eventDetails = {
            summary: `Skill Exchange: ${swapRequest.skillRequested.title}`,
            description: `Skill Exchange Session Requester: ${
                swapRequest.requester.name
            } Provider: ${swapRequest.skillProvider.name}Skill to Learn: ${
                swapRequest.skillRequested.title
            } (${swapRequest.skillRequested.category}) ${
                swapRequest.skillOffered
                    ? `Skill to Teach: ${swapRequest.skillOffered.title} (${swapRequest.skillOffered.category})`
                    : ""
            }${
                notes ? `Notes: ${notes}` : ""
            } This session was scheduled through Skills Swap platform.
            `.trim(),
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            attendees: [
                swapRequest.requester.email,
                swapRequest.skillProvider.email,
            ],
            timeZone,
        };

        // Create Google Meet link and Calendar event
        let meetingDetails;
        let calendarEvent;

        // Check if valid Google credentials are configured
        const hasValidCredentials = googleMeetService.hasValidCredentials();
        // If not, return an error response
        if (!hasValidCredentials) {
            return res.status(500).json({
                error: "Google OAuth not configured. Cannot create Meet link.",
            });
        }

        try {
            console.log("🎥 Creating real Google Meet space...");

            // Initialize services
            googleMeetService.initializeClient();
            googleCalendarService.initializeClient();

            // Create Google Meet space first
            meetingDetails = await googleMeetService.createMeetingSpace({
                title: eventDetails.summary,
                description: eventDetails.description,
                startTime: startDateTime,
                endTime: endDateTime,
            });

            console.log(
                "✅ Google Meet space created:",
                meetingDetails.meetingUri
            );

            // Add the Meet link to calendar event
            eventDetails.conferenceData = {
                entryPoints: [
                    {
                        entryPointType: "video",
                        uri: meetingDetails.meetingUri,
                        label: meetingDetails.meetingCode,
                    },
                ],
                conferenceSolution: {
                    key: {
                        type: "hangoutsMeet",
                    },
                    name: "Google Meet",
                    iconUri:
                        "https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-512dp/logo_meet_2020q4_color_2x_web_512dp.png",
                },
            };

            // Create calendar event with Meet link
            calendarEvent = await googleCalendarService.createEvent(
                eventDetails
            );

            console.log("✅ Calendar event created with Meet link");
        } catch (error) {
            console.error(
                "❌ Error creating Google Meet/Calendar:",
                error.message
            );
            console.log("⚠️  Falling back to mock mode...");

            // Fallback if Google services fail
            meetingDetails = await googleMeetService.generateMeetLink();

            calendarEvent = {
                eventId: `fallback-error-${Date.now()}`,
                htmlLink: `https://calendar.google.com/calendar/event?eid=fallback`,
                meetLink: meetingDetails.meetLink,
                status: "confirmed",
            };
        }

        // Create session in database
        const session = new Session({
            swapRequest: swapRequestId,
            participants: [
                {
                    userId: swapRequest.requester._id,
                    email: swapRequest.requester.email,
                    name: swapRequest.requester.name,
                    role: "requester",
                },
                {
                    userId: swapRequest.skillProvider._id,
                    email: swapRequest.skillProvider.email,
                    name: swapRequest.skillProvider.name,
                    role: "provider",
                },
            ],
            scheduledDate: startDateTime,
            duration,
            meetingLink: meetingDetails.meetLink,
            googleMeet: {
                spaceId: meetingDetails.spaceId,
                meetingCode: meetingDetails.meetingCode,
                isMock: meetingDetails.isMock || false,
            },
            googleCalendar: {
                eventId: calendarEvent.eventId,
                htmlLink: calendarEvent.htmlLink,
                createdBy: req.user?.id,
            },
            skill: {
                skillId: swapRequest.skillRequested._id,
                title: swapRequest.skillRequested.title,
                category: swapRequest.skillRequested.category,
            },
            notes,
            status: "scheduled",
        });

        await session.save();

        // Update swap request status to scheduled
        // This marks the request as having an active scheduled session
        swapRequest.status = "scheduled";
        await swapRequest.save();

        res.status(201).json({
            success: true,
            message: "Session scheduled successfully",
            session: {
                _id: session._id,
                scheduledDate: session.scheduledDate,
                duration: session.duration,
                meetingLink: session.meetingLink,
                meetingCode: meetingDetails.meetingCode,
                calendarLink: session.googleCalendar.htmlLink,
                status: session.status,
            },
        });
    } catch (error) {
        console.error("Error scheduling session:", error);
        res.status(500).json({
            error: "Failed to schedule session",
            details: error.message,
        });
    }
};

/**
 * @route   GET /api/sessions/user/:userId
 * @desc    Get all sessions for a user
 * @access  Private
 */
const getUserSessions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.query;

        const query = {
            "participants.userId": userId,
        };

        if (status) {
            query.status = status;
        }

        const sessions = await Session.find(query)
            .populate("swapRequest")
            .populate("participants.userId", "name email avatar")
            .sort({ scheduledDate: -1 });

        res.status(200).json({
            success: true,
            count: sessions.length,
            sessions,
        });
    } catch (error) {
        console.error("Error fetching user sessions:", error);
        res.status(500).json({
            error: "Failed to fetch sessions",
            details: error.message,
        });
    }
};

/**
 * @route   GET /api/sessions/:sessionId
 * @desc    Get session details
 * @access  Private
 */
const getSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findById(sessionId)
            .populate("swapRequest")
            .populate("participants.userId", "name email avatar")
            .populate("skill.skillId");

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        res.status(200).json({
            success: true,
            session,
        });
    } catch (error) {
        console.error("Error fetching session details:", error);
        res.status(500).json({
            error: "Failed to fetch session details",
            details: error.message,
        });
    }
};

/**
 * @route   PATCH /api/sessions/:sessionId/reschedule
 * @desc    Reschedule a session
 * @access  Private
 */
const rescheduleSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { scheduledDate, duration, notes } = req.body;

        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // Initialize Google Calendar service
        googleCalendarService.initializeClient();

        // Update Google Calendar event
        const startDateTime = new Date(scheduledDate);
        const endDateTime = new Date(
            startDateTime.getTime() + (duration || session.duration) * 60000
        );

        await googleCalendarService.updateEvent(
            session.googleCalendar.eventId,
            {
                start: {
                    dateTime: startDateTime.toISOString(),
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                },
            }
        );

        // Update session in database
        session.scheduledDate = startDateTime;
        if (duration) session.duration = duration;
        if (notes) session.notes = notes;
        session.status = "rescheduled";

        await session.save();

        res.status(200).json({
            success: true,
            message: "Session rescheduled successfully",
            session,
        });
    } catch (error) {
        console.error("Error rescheduling session:", error);
        res.status(500).json({
            error: "Failed to reschedule session",
            details: error.message,
        });
    }
};

/**
 * @route   PATCH /api/sessions/:sessionId/cancel
 * @desc    Cancel a session
 * @access  Private
 */
const cancelSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { reason } = req.body;

        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // Initialize services
        googleCalendarService.initializeClient();
        googleMeetService.initializeClient();

        // Delete Google Calendar event
        try {
            await googleCalendarService.deleteEvent(
                session.googleCalendar.eventId
            );
        } catch (error) {
            console.warn("⚠️  Failed to delete calendar event:", error.message);
        }

        // End Google Meet space if it's a real meeting (not mock)
        if (session.googleMeet?.spaceId && !session.googleMeet?.isMock) {
            try {
                await googleMeetService.endMeetingSpace(
                    session.googleMeet.spaceId
                );
            } catch (error) {
                console.warn(
                    "⚠️  Failed to end Google Meet space:",
                    error.message
                );
            }
        }

        // Update session in database
        session.status = "cancelled";
        session.cancellationReason = reason;

        await session.save();

        res.status(200).json({
            success: true,
            message: "Session cancelled successfully",
            session,
        });
    } catch (error) {
        console.error("Error cancelling session:", error);
        res.status(500).json({
            error: "Failed to cancel session",
            details: error.message,
        });
    }
};

/**
 * @route   PATCH /api/sessions/:sessionId/complete
 * @desc    Mark session as completed
 * @access  Private
 */
const completeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        session.status = "completed";
        await session.save();

        // Update swap request status
        await SwapRequest.findByIdAndUpdate(session.swapRequest, {
            status: "completed",
        });

        res.status(200).json({
            success: true,
            message: "Session marked as completed",
            session,
        });
    } catch (error) {
        console.error("Error completing session:", error);
        res.status(500).json({
            error: "Failed to complete session",
            details: error.message,
        });
    }
};

/**
 * @route   GET /api/sessions/google/auth
 * @desc    Get Google OAuth URL
 * @access  Public
 */
const getGoogleAuthUrl = async (req, res) => {
    try {
        googleMeetService.initializeClient();
        const authUrl = googleMeetService.getAuthUrl();

        res.status(200).json({
            success: true,
            authUrl,
            message:
                "Visit this URL to authorize Google Calendar and Meet access",
        });
    } catch (error) {
        console.error("Error getting auth URL:", error);
        res.status(500).json({
            error: "Failed to get authorization URL",
            details: error.message,
        });
    }
};

/**
 * @route   GET /api/sessions/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
const handleGoogleCallback = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res
                .status(400)
                .json({ error: "Authorization code is required" });
        }

        googleMeetService.initializeClient();
        const tokens = await googleMeetService.getTokenFromCode(code);

        res.status(200).json({
            success: true,
            message:
                "Authorization successful! Add this refresh token to your .env file as GOOGLE_REFRESH_TOKEN",
            tokens: {
                refresh_token: tokens.refresh_token,
            },
            instructions: [
                "1. Copy the refresh_token value above",
                "2. Add to .env: GOOGLE_REFRESH_TOKEN=your_refresh_token_here",
                "3. Restart your server",
                "4. Now you can create real Google Meet links!",
            ],
        });
    } catch (error) {
        console.error("Error handling callback:", error);
        res.status(500).json({
            error: "Failed to complete authorization",
            details: error.message,
        });
    }
};

module.exports = {
    scheduleSession,
    getUserSessions,
    getSessionDetails,
    rescheduleSession,
    cancelSession,
    completeSession,
    getGoogleAuthUrl,
    handleGoogleCallback,
};
