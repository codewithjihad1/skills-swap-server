const { google } = require("googleapis");

/**
 * Google Calendar Service
 * Handles all Google Calendar API operations
 */
class GoogleCalendarService {
    constructor() {
        this.oauth2Client = null;
        this.calendar = null;
    }

    /**
     * Initialize OAuth2 client with credentials
     */
    initializeClient() {
        if (
            !process.env.GOOGLE_CLIENT_ID ||
            !process.env.GOOGLE_CLIENT_SECRET
        ) {
            throw new Error("Google Calendar credentials not configured");
        }

        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI ||
                "http://localhost:5000/api/sessions/google/callback"
        );

        // Set credentials if refresh token is available
        if (process.env.GOOGLE_REFRESH_TOKEN) {
            this.oauth2Client.setCredentials({
                refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
            });
        }

        this.calendar = google.calendar({
            version: "v3",
            auth: this.oauth2Client,
        });
    }

    /**
     * Generate OAuth URL for authorization
     */
    getAuthUrl() {
        const scopes = [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
            prompt: "consent",
        });
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokenFromCode(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        return tokens;
    }

    /**
     * Create a calendar event with Google Meet link
     * @param {Object} eventDetails - Event details
     * @returns {Promise<Object>} Created event data
     */
    async createEvent(eventDetails) {
        const {
            summary,
            description,
            startDateTime,
            endDateTime,
            attendees,
            timeZone = "UTC",
        } = eventDetails;

        try {
            const event = {
                summary,
                description,
                start: {
                    dateTime: startDateTime,
                    timeZone,
                },
                end: {
                    dateTime: endDateTime,
                    timeZone,
                },
                attendees: attendees.map((email) => ({ email })),
                conferenceData: {
                    createRequest: {
                        requestId: `meet-${Date.now()}`,
                        conferenceSolutionKey: {
                            type: "hangoutsMeet",
                        },
                    },
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: "email", minutes: 24 * 60 }, // 1 day before
                        { method: "popup", minutes: 30 }, // 30 minutes before
                    ],
                },
            };

            const response = await this.calendar.events.insert({
                calendarId: "primary",
                resource: event,
                conferenceDataVersion: 1,
                sendUpdates: "all",
            });

            return {
                eventId: response.data.id,
                htmlLink: response.data.htmlLink,
                meetLink:
                    response.data.conferenceData?.entryPoints?.[0]?.uri || null,
                status: response.data.status,
            };
        } catch (error) {
            console.error("Error creating calendar event:", error);
            throw new Error(
                `Failed to create calendar event: ${error.message}`
            );
        }
    }

    /**
     * Update an existing calendar event
     * @param {string} eventId - Google Calendar event ID
     * @param {Object} updates - Updated event details
     * @returns {Promise<Object>} Updated event data
     */
    async updateEvent(eventId, updates) {
        try {
            const response = await this.calendar.events.patch({
                calendarId: "primary",
                eventId,
                resource: updates,
                sendUpdates: "all",
            });

            return {
                eventId: response.data.id,
                htmlLink: response.data.htmlLink,
                status: response.data.status,
            };
        } catch (error) {
            console.error("Error updating calendar event:", error);
            throw new Error(
                `Failed to update calendar event: ${error.message}`
            );
        }
    }

    /**
     * Cancel/Delete a calendar event
     * @param {string} eventId - Google Calendar event ID
     * @returns {Promise<void>}
     */
    async deleteEvent(eventId) {
        try {
            await this.calendar.events.delete({
                calendarId: "primary",
                eventId,
                sendUpdates: "all",
            });
        } catch (error) {
            console.error("Error deleting calendar event:", error);
            throw new Error(
                `Failed to delete calendar event: ${error.message}`
            );
        }
    }

    /**
     * Get event details
     * @param {string} eventId - Google Calendar event ID
     * @returns {Promise<Object>} Event details
     */
    async getEvent(eventId) {
        try {
            const response = await this.calendar.events.get({
                calendarId: "primary",
                eventId,
            });

            return response.data;
        } catch (error) {
            console.error("Error fetching calendar event:", error);
            throw new Error(`Failed to fetch calendar event: ${error.message}`);
        }
    }
}

// Create singleton instance
const googleCalendarService = new GoogleCalendarService();

module.exports = googleCalendarService;
