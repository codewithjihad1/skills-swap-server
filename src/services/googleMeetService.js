const { google } = require("googleapis");
const { meet_v2 } = require("googleapis/build/src/apis/meet");

class GoogleMeetService {
    constructor() {
        this.oauth2Client = null;
        this.meetClient = null;
    }

    /**
     * Initialize OAuth2 client for Google Meet API
     */
    initializeClient() {
        if (
            !process.env.GOOGLE_CLIENT_ID ||
            !process.env.GOOGLE_CLIENT_SECRET
        ) {
            throw new Error(
                "Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
            );
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

        // Initialize Google Meet client
        this.meetClient = google.meet({
            version: "v2",
            auth: this.oauth2Client,
        });
    }

    /**
     * Check if valid credentials are configured
     */
    hasValidCredentials() {
        return (
            process.env.GOOGLE_REFRESH_TOKEN &&
            process.env.GOOGLE_REFRESH_TOKEN !== "mock" &&
            process.env.GOOGLE_REFRESH_TOKEN !== "your_refresh_token_here"
        );
    }

    /**
     * Create a Google Meet space (meeting room)
     * @param {Object} options - Meeting options
     * @returns {Promise<Object>} - Meeting details with meet link
     */
    async createMeetingSpace(options = {}) {
        try {
            if (!this.meetClient) {
                this.initializeClient();
            }

            const { title, description, startTime, endTime } = options;

            console.log("🎥 Creating Google Meet space...");

            // Create a new meeting space
            const response = await this.meetClient.spaces.create({
                requestBody: {
                    config: {
                        accessType: "OPEN", // Anyone with the link can join
                        entryPointAccess: "ALL", // All entry points allowed
                    },
                },
            });

            const meetingSpace = response.data;
            const meetingCode = meetingSpace.meetingCode;
            const meetingUri = meetingSpace.meetingUri;

            console.log("✅ Google Meet space created successfully");
            console.log("   Meeting Code:", meetingCode);
            console.log("   Meeting URI:", meetingUri);

            return {
                spaceId: meetingSpace.name, // Resource name like "spaces/abc-def-ghi"
                meetingCode: meetingCode, // e.g., "abc-defg-hij"
                meetingUri: meetingUri, // Full meet.google.com URL
                meetLink: meetingUri, // Alias for compatibility
                config: meetingSpace.config,
            };
        } catch (error) {
            console.error(
                "❌ Error creating Google Meet space:",
                error.message
            );

            if (error.code === 401 || error.message.includes("unauthorized")) {
                throw new Error(
                    "Google Meet API authentication failed. Please check your refresh token."
                );
            }

            throw new Error(`Failed to create Google Meet: ${error.message}`);
        }
    }

    /**
     * End a Google Meet space
     * @param {string} spaceId - The space resource name (e.g., "spaces/abc-def-ghi")
     */
    async endMeetingSpace(spaceId) {
        try {
            if (!this.meetClient) {
                this.initializeClient();
            }

            console.log("🛑 Ending Google Meet space:", spaceId);

            await this.meetClient.spaces.endActiveConference({
                name: spaceId,
            });

            console.log("✅ Google Meet space ended successfully");
        } catch (error) {
            console.error("❌ Error ending Google Meet space:", error.message);
            throw new Error(`Failed to end Google Meet: ${error.message}`);
        }
    }

    /**
     * Get meeting space details
     * @param {string} spaceId - The space resource name
     */
    async getMeetingSpace(spaceId) {
        try {
            if (!this.meetClient) {
                this.initializeClient();
            }

            const response = await this.meetClient.spaces.get({
                name: spaceId,
            });

            return response.data;
        } catch (error) {
            console.error("❌ Error getting Google Meet space:", error.message);
            throw new Error(`Failed to get Google Meet: ${error.message}`);
        }
    }

    /**
     * Generate OAuth URL for authorization
     */
    getAuthUrl() {
        if (!this.oauth2Client) {
            this.initializeClient();
        }

        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: [
                "https://www.googleapis.com/auth/meetings.space.created",
                "https://www.googleapis.com/auth/meetings.space.readonly",
                "https://www.googleapis.com/auth/calendar.events",
            ],
            prompt: "consent", // Force consent screen to get refresh token
        });

        return authUrl;
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokenFromCode(code) {
        if (!this.oauth2Client) {
            this.initializeClient();
        }

        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);

        console.log("✅ Google OAuth tokens obtained");
        console.log("   Access Token:", tokens.access_token ? "✓" : "✗");
        console.log("   Refresh Token:", tokens.refresh_token ? "✓" : "✗");

        return tokens;
    }

    /**
     * Generate a fallback mock meeting link (for testing without API)
     */
    async generateMeetLink() {
        return this.createMeetingSpace();
    }
}

// Export singleton instance
module.exports = new GoogleMeetService();
