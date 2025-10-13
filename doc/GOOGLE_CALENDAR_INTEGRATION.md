# Google Calendar Session Scheduling Feature

## Overview
This document describes the complete implementation of Google Calendar integration for scheduling skill exchange sessions with automatic Google Meet link generation.

## Implementation Date
October 11, 2025

## Architecture

### Backend Components

#### 1. **Session Model** (`src/models/Session.js`)
MongoDB schema for storing session information:
- Swap request reference
- Participants (requester & provider)
- Scheduled date/time and duration
- Meeting link and Google Calendar event details
- Session status (scheduled, completed, cancelled, rescheduled)
- Notes and cancellation reason

#### 2. **Google Calendar Service** (`src/services/googleCalendarService.js`)
Singleton service handling all Google Calendar API operations:
- OAuth2 authentication
- Event creation with Google Meet links
- Event updates (reschedule)
- Event deletion (cancellation)
- Event retrieval

Key Methods:
- `initializeClient()` - Initialize OAuth2 client
- `getAuthUrl()` - Generate OAuth URL for authorization
- `createEvent()` - Create calendar event with Meet link
- `updateEvent()` - Update existing event
- `deleteEvent()` - Cancel event
- `getEvent()` - Fetch event details

#### 3. **Session Controller** (`src/controllers/sessionController.js`)
Express route handlers:
- `scheduleSession` - Create new session with calendar event
- `getUserSessions` - Get all sessions for a user
- `getSessionDetails` - Get specific session details
- `rescheduleSession` - Update session date/time
- `cancelSession` - Cancel session and delete calendar event
- `completeSession` - Mark session as completed
- `getGoogleAuthUrl` - Get OAuth authorization URL
- `handleGoogleCallback` - Handle OAuth callback

#### 4. **Session Routes** (`src/routes/sessionRoute.js`)
API endpoints:
```
POST   /api/sessions/schedule              - Schedule new session
GET    /api/sessions/user/:userId          - Get user sessions
GET    /api/sessions/:sessionId            - Get session details
PATCH  /api/sessions/:sessionId/reschedule - Reschedule session
PATCH  /api/sessions/:sessionId/cancel     - Cancel session
PATCH  /api/sessions/:sessionId/complete   - Complete session
GET    /api/sessions/google/auth           - Get OAuth URL
GET    /api/sessions/google/callback       - OAuth callback
```

### Frontend Components

#### 1. **Session API** (`src/lib/api/sessions.ts`)
React Query hooks and API functions:
- `useScheduleSession()` - Schedule new session
- `useUserSessions()` - Fetch user sessions
- `useSessionDetails()` - Fetch session details
- `useRescheduleSession()` - Reschedule session
- `useCancelSession()` - Cancel session
- `useCompleteSession()` - Complete session
- `useGoogleAuthUrl()` - Get Google auth URL

#### 2. **Schedule Session Dialog** (`src/components/sessions/ScheduleSessionDialog.tsx`)
Interactive dialog for scheduling sessions:
- Date picker (minimum: today)
- Time selector (30-minute intervals)
- Duration selector (30 min to 2 hours)
- Notes/agenda input
- Real-time validation
- Loading states

#### 3. **Incoming Request Card** (Updated)
Added "Schedule Session" button for accepted requests that opens the dialog.

## Setup Instructions

### 1. Install Required Packages

#### Backend
```bash
cd skills-swap-server
npm install googleapis
```

#### Frontend
```bash
cd skills-swap-client
npm install date-fns
# or if using pnpm
pnpm add date-fns
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URI: `http://localhost:5000/api/sessions/google/callback`
   - Save and copy Client ID and Client Secret

### 3. Get Refresh Token

Run the authorization flow:
```bash
# Start your server
cd skills-swap-server
npm start

# In browser, visit:
http://localhost:5000/api/sessions/google/auth

# This will redirect to Google's consent screen
# After approving, you'll be redirected to callback URL
# Copy the refresh_token from the response
```

### 4. Environment Variables

Add to `.env` file in `skills-swap-server`:
```env
# Google Calendar API
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/sessions/google/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
```

### 5. Production Configuration

For production, update:
```env
GOOGLE_REDIRECT_URI=https://your-domain.com/api/sessions/google/callback
```

And add the production redirect URI to Google Cloud Console.

## Usage Flow

### Scheduling a Session

1. User accepts a swap request
2. "Schedule Session" button appears
3. User clicks button → Dialog opens
4. User selects:
   - Date (today or future)
   - Time (30-minute intervals)
   - Duration (30 min - 2 hours)
   - Optional notes
5. User clicks "Schedule Session"
6. System:
   - Creates Google Calendar event
   - Generates Google Meet link
   - Sends email invitations to both participants
   - Saves session to database
   - Updates swap request status
7. Success notification shown
8. Dialog closes

### API Request Example

```javascript
POST /api/sessions/schedule
{
    "swapRequestId": "68e748c2054bcac48339e8e3",
    "scheduledDate": "2025-10-15T10:00:00.000Z",
    "duration": 60,
    "notes": "Let's cover the basics first",
    "timeZone": "America/New_York"
}
```

### API Response Example

```json
{
    "success": true,
    "message": "Session scheduled successfully",
    "session": {
        "_id": "68e8xyz...",
        "scheduledDate": "2025-10-15T10:00:00.000Z",
        "duration": 60,
        "meetingLink": "https://meet.google.com/xyz-abcd-efg",
        "calendarLink": "https://calendar.google.com/event?eid=...",
        "status": "scheduled"
    }
}
```

## Features

### ✅ Implemented

1. **Automated Calendar Events**
   - Creates Google Calendar events
   - Generates Google Meet links
   - Sends email invitations
   - Sets reminders (1 day & 30 minutes before)

2. **Session Management**
   - Schedule new sessions
   - View session details
   - Reschedule sessions
   - Cancel sessions
   - Mark as completed

3. **User Experience**
   - Interactive date/time picker
   - Duration selector
   - Optional notes
   - Loading states
   - Toast notifications
   - Form validation

4. **Data Persistence**
   - Sessions stored in MongoDB
   - Google Calendar event IDs tracked
   - Participant information preserved
   - Status tracking

### 🔮 Future Enhancements

1. **Calendar Integration**
   - Sync with user's personal calendar
   - Check availability before scheduling
   - Show conflicts

2. **Reminders**
   - Custom reminder times
   - SMS reminders
   - In-app notifications

3. **Recurring Sessions**
   - Schedule multiple sessions at once
   - Weekly/monthly patterns

4. **Video Platform Options**
   - Zoom integration
   - Microsoft Teams
   - Custom video links

5. **Session Feedback**
   - Rating system
   - Review/feedback after completion
   - Skill progress tracking

## Error Handling

### Common Errors

1. **Missing Google Credentials**
```
Error: Google Calendar credentials not configured
Solution: Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env
```

2. **Invalid Refresh Token**
```
Error: Invalid refresh token
Solution: Re-run authorization flow to get new refresh token
```

3. **Swap Request Not Accepted**
```
Error: Can only schedule sessions for accepted swap requests
Solution: Accept the swap request first
```

4. **Invalid Date**
```
Error: Date must be in the future
Solution: Select today or a future date
```

## Security Considerations

1. **OAuth 2.0** - Secure authorization flow
2. **Refresh Tokens** - Stored securely in environment variables
3. **API Authentication** - Requires user authentication (implement middleware)
4. **Input Validation** - All inputs validated on backend
5. **Rate Limiting** - Should be implemented for production

## Testing Checklist

### Backend
- [ ] Google Calendar service initializes correctly
- [ ] OAuth flow works (auth URL generation)
- [ ] Calendar events are created successfully
- [ ] Meet links are generated
- [ ] Session data is saved to database
- [ ] Email invitations are sent
- [ ] Reschedule updates Google Calendar
- [ ] Cancel deletes Google Calendar event
- [ ] Error handling works correctly

### Frontend
- [ ] Dialog opens when "Schedule Session" clicked
- [ ] Date picker works (disables past dates)
- [ ] Time selector populates correctly
- [ ] Duration selector works
- [ ] Notes input saves correctly
- [ ] Form validation prevents invalid submissions
- [ ] Loading states show correctly
- [ ] Success toast appears
- [ ] Dialog closes after successful schedule
- [ ] Error toast shows on failure

### Integration
- [ ] End-to-end flow works
- [ ] Both participants receive calendar invites
- [ ] Google Meet link works
- [ ] Session appears in both calendars
- [ ] Swap request status updates
- [ ] Session data is queryable

## Troubleshooting

### Calendar events not created
1. Check Google Calendar API is enabled
2. Verify OAuth credentials are correct
3. Ensure refresh token is valid
4. Check API quotas in Google Cloud Console

### Meet links not generating
1. Ensure `conferenceDataVersion: 1` is set in API call
2. Verify Google Workspace account (Meet may not work with free Gmail)
3. Check API permissions include calendar.events scope

### Email invitations not sent
1. Verify `sendUpdates: 'all'` is set
2. Check participant emails are valid
3. Verify Google Calendar API has permission to send emails

## Dependencies

### Backend
```json
{
  "googleapis": "^144.0.0",
  "mongoose": "^8.x.x",
  "express": "^4.x.x"
}
```

### Frontend
```json
{
  "date-fns": "^4.x.x",
  "@tanstack/react-query": "^5.x.x",
  "sonner": "^1.x.x"
}
```

## Resources

- [Google Calendar API Docs](https://developers.google.com/calendar/api/v3/reference)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Meet API](https://developers.google.com/meet)

## Support

For issues or questions:
1. Check error logs in console
2. Verify environment variables
3. Test OAuth flow separately
4. Check Google Cloud Console quotas
5. Review API documentation

---

**Note**: Keep your Google credentials secure and never commit them to version control!
