# Google Meet Integration Setup Guide

This guide shows you how to set up **real Google Meet links** using the Google Meet REST API v2.

## 🚀 What You Get

-   ✅ Real Google Meet links (e.g., `https://meet.google.com/abc-defg-hij`)
-   ✅ Meeting codes participants can use to join
-   ✅ Automatic calendar events with Meet links embedded
-   ✅ Ability to end meetings programmatically
-   ✅ Fallback to mock links if API is not configured

## 📋 Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Google Meet API** enabled
3. **OAuth 2.0 credentials** configured

## 🛠️ Setup Steps

### Step 1: Enable Google Meet API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Library**
4. Search for "**Google Meet API**"
5. Click **Enable**

Also enable:

-   **Google Calendar API** (for calendar integration)

### Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (or Internal if using Google Workspace)
3. Fill in the required fields:
    - App name: `Skills Swap`
    - User support email: Your email
    - Developer contact: Your email
4. Add scopes:
    - `https://www.googleapis.com/auth/meetings.space.created`
    - `https://www.googleapis.com/auth/meetings.space.readonly`
    - `https://www.googleapis.com/auth/calendar.events`
5. Add test users (your Google account email)
6. Click **Save and Continue**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
    - Name: `Skills Swap Backend`
    - Authorized redirect URIs:
        - `http://localhost:5000/api/sessions/google/callback`
        - `http://localhost:5000/api/sessions/google/callback/` (with trailing slash)
5. Click **Create**
6. **Copy** the Client ID and Client Secret

### Step 4: Add Credentials to .env

Add these to your `.env` file:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/sessions/google/callback

# This will be obtained in the next step
GOOGLE_REFRESH_TOKEN=
```

### Step 5: Get Refresh Token

1. **Start your server:**

    ```bash
    npm start
    ```

2. **Visit the authorization URL:**

    ```bash
    # In your browser, go to:
    http://localhost:5000/api/sessions/google/auth
    ```

3. **Copy the authUrl** from the JSON response and open it in your browser

4. **Sign in with your Google account** (must be a test user if in testing mode)

5. **Grant permissions** when asked

6. **Copy the refresh_token** from the response

7. **Add it to .env:**

    ```env
    GOOGLE_REFRESH_TOKEN=1//0abc123...your_refresh_token_here
    ```

8. **Restart your server:**
    ```bash
    # Stop the server (Ctrl+C) and restart
    npm start
    ```

## ✅ Testing

### Test Scheduling a Session

Make a POST request to schedule a session:

```bash
POST http://localhost:5000/api/sessions/schedule
Content-Type: application/json

{
  "swapRequestId": "your_swap_request_id",
  "scheduledDate": "2025-10-15T14:00:00.000Z",
  "duration": 60,
  "notes": "Test session",
  "timeZone": "America/New_York"
}
```

### Expected Response

```json
{
    "success": true,
    "message": "Session scheduled successfully",
    "session": {
        "_id": "session_id",
        "scheduledDate": "2025-10-15T14:00:00.000Z",
        "duration": 60,
        "meetingLink": "https://meet.google.com/abc-defg-hij",
        "meetingCode": "abc-defg-hij",
        "calendarLink": "https://calendar.google.com/calendar/event?eid=...",
        "status": "scheduled"
    }
}
```

### Console Output (Success)

```
🎥 Creating real Google Meet space...
✅ Google Meet space created: https://meet.google.com/abc-defg-hij
   Meeting Code: abc-defg-hij
   Meeting URI: https://meet.google.com/abc-defg-hij
✅ Calendar event created with Meet link
```

### Console Output (Fallback Mode)

```
⚠️  Running in FALLBACK MODE - No valid Google refresh token
💡 Session will be created with mock Meet link
📖 To enable real Google Meet, see: QUICK_SETUP_GOOGLE_CALENDAR.md
```

## 🔧 API Endpoints

### Schedule Session

```
POST /api/sessions/schedule
```

### Get Authorization URL

```
GET /api/sessions/google/auth
```

### OAuth Callback

```
GET /api/sessions/google/callback?code=...
```

### Get User Sessions

```
GET /api/sessions/user/:userId
```

### Cancel Session (ends Meet space)

```
PATCH /api/sessions/:sessionId/cancel
```

## 🎯 Features

### Real Google Meet

-   ✅ Creates actual Google Meet spaces
-   ✅ Generates unique meeting codes
-   ✅ Returns full meet.google.com URLs
-   ✅ Embeds in calendar events
-   ✅ Can end meetings programmatically

### Fallback Mode

-   ✅ Works without Google credentials
-   ✅ Generates mock links for testing
-   ✅ Marks sessions as mock in database
-   ✅ Graceful degradation

## 📊 Database Schema

Sessions now include Google Meet details:

```javascript
{
  meetingLink: "https://meet.google.com/abc-defg-hij",
  googleMeet: {
    spaceId: "spaces/abc-def-ghi",
    meetingCode: "abc-defg-hij",
    isMock: false
  },
  googleCalendar: {
    eventId: "calendar_event_id",
    htmlLink: "https://calendar.google.com/calendar/event?eid=..."
  }
}
```

## 🚨 Troubleshooting

### Error: "Access Not Configured"

-   **Solution:** Make sure Google Meet API is enabled in Google Cloud Console

### Error: "unauthorized_client"

-   **Solution:** Check OAuth consent screen is configured with correct scopes
-   **Solution:** Add your email as a test user

### Error: "invalid_grant"

-   **Solution:** Your refresh token may have expired
-   **Solution:** Go through the authorization flow again

### No Real Meet Links Created

-   **Check:** Is `GOOGLE_REFRESH_TOKEN` set in `.env`?
-   **Check:** Is the token valid (not "mock" or "your_refresh_token_here")?
-   **Check:** Did you restart the server after adding the token?

### "Failed to create Google Meet space"

-   **Check:** Is billing enabled on your Google Cloud project?
-   **Check:** Are you using a Google Workspace account? (Personal Gmail may have limitations)
-   **Check:** Have you reached API quota limits?

## 🔐 Security Notes

1. **Never commit** your `.env` file to Git
2. **Keep your refresh token secure** - it grants full access to create meetings
3. **Use environment variables** for all sensitive data
4. **Rotate credentials** regularly
5. **Monitor API usage** in Google Cloud Console

## 📚 API Documentation

-   [Google Meet API Reference](https://developers.google.com/meet/api/reference/rest)
-   [Google Calendar API](https://developers.google.com/calendar/api)
-   [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

## 🎉 Success Checklist

-   [ ] Google Meet API enabled
-   [ ] OAuth consent screen configured
-   [ ] OAuth credentials created
-   [ ] Credentials added to `.env`
-   [ ] Authorization completed
-   [ ] Refresh token obtained
-   [ ] Server restarted
-   [ ] Test session created successfully
-   [ ] Real Google Meet link received

## 💡 Tips

1. **Test in Fallback Mode First:** The app works without Google credentials
2. **Use Test Users:** Add test users in OAuth consent screen during development
3. **Check Logs:** Console shows detailed info about Meet creation
4. **Meeting Codes:** Users can join using the meeting code without the full URL
5. **Calendar Integration:** Meet links appear in calendar invites automatically

## 🆘 Need Help?

Check the console logs - they show detailed information about:

-   ✅ Successful Meet creation
-   ⚠️ Fallback mode activation
-   ❌ Errors with hints for fixes

Example log output:

```
🎥 Creating Google Meet space...
✅ Google Meet space created successfully
   Meeting Code: abc-defg-hij
   Meeting URI: https://meet.google.com/abc-defg-hij
```

---

**Now you're ready to create real Google Meet links!** 🚀
