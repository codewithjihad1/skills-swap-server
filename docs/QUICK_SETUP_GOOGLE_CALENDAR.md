# Quick Setup Guide - Google Calendar Integration

## Step 1: Install Dependencies

### Backend
```bash
cd skills-swap-server
npm install googleapis
```

### Frontend
```bash
cd skills-swap-client
pnpm add date-fns
```

## Step 2: Google Cloud Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**
3. **Enable Google Calendar API**:
   - APIs & Services > Library
   - Search "Google Calendar API"
   - Click Enable

4. **Create OAuth Credentials**:
   - APIs & Services > Credentials
   - Create Credentials > OAuth client ID
   - Application type: Web application
   - Name: Skills Swap Server
   - Authorized redirect URIs:
     - `http://localhost:5000/api/sessions/google/callback`
   - Click Create
   - **Copy Client ID and Client Secret**

## Step 3: Get Refresh Token

1. **Add to `.env`** (temporarily):
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/sessions/google/callback
```

2. **Start server**:
```bash
cd skills-swap-server
npm start
```

3. **Visit in browser**:
```
http://localhost:5000/api/sessions/google/auth
```

4. **Authorize app**:
   - Sign in with Google account
   - Grant permissions
   - You'll be redirected to callback URL
   - **Copy the `refresh_token` from response**

## Step 4: Configure Environment

Add to `skills-swap-server/.env`:
```env
# Google Calendar API Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/sessions/google/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
```

## Step 5: Restart Server

```bash
cd skills-swap-server
npm start
```

## Step 6: Test

1. Start both frontend and backend
2. Login to application
3. Go to Requests page
4. Accept a swap request
5. Click "Schedule Session" button
6. Fill in details:
   - Select date
   - Choose time
   - Select duration
   - Add notes (optional)
7. Click "Schedule Session"
8. Check:
   - ✅ Success notification
   - ✅ Email invitation received
   - ✅ Event in Google Calendar
   - ✅ Google Meet link works

## Troubleshooting

### "Google Calendar credentials not configured"
- Check `.env` file has all 4 variables
- Restart server after adding variables

### "Invalid refresh token"
- Re-run Step 3 to get new refresh token
- Refresh tokens can expire if not used

### Calendar events created but no Meet link
- Ensure using Google Workspace account (Meet may not work with free Gmail)
- Check `conferenceDataVersion: 1` in API call

### Email invitations not sent
- Verify participant emails in swap request
- Check Google Calendar API permissions

## Production Deployment

1. **Add production redirect URI** in Google Cloud Console:
```
https://your-domain.com/api/sessions/google/callback
```

2. **Update `.env`** with production URI:
```env
GOOGLE_REDIRECT_URI=https://your-domain.com/api/sessions/google/callback
```

3. **Re-authorize** to get production refresh token

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env` file to Git
- Keep refresh token secret
- Rotate credentials periodically
- Use environment variables in production
- Implement rate limiting

## Need Help?

Check `GOOGLE_CALENDAR_INTEGRATION.md` for detailed documentation.

---

That's it! 🎉 You can now schedule sessions with automatic Google Meet links!
