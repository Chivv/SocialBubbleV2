# Google OAuth Setup Checklist

## Required Redirect URIs in Google Cloud Console

Make sure BOTH of these URIs are added to your OAuth client's authorized redirect URIs:

1. **For Local Development**: `http://localhost:3000/api/auth/google/callback`
2. **For Production**: `https://platform.bubbleads.nl/api/auth/google/callback`

## Steps to Add Redirect URIs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Click on your OAuth 2.0 Client ID (should be named something like "Web client 1" or "SocialBubble Drive Integration")
4. In the "Authorized redirect URIs" section, make sure you have:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://platform.bubbleads.nl/api/auth/google/callback`
5. Click "SAVE" at the bottom

## Current Configuration:

Your OAuth Client ID: `668952493696-8dmt1275k3cumegamccj1otde8hf0vfd.apps.googleusercontent.com`

## Environment Variables:

For local development (.env.local):
```
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

For production:
```
GOOGLE_REDIRECT_URI=https://platform.bubbleads.nl/api/auth/google/callback
```

## Important Notes:

- The redirect URI must match EXACTLY (including protocol, domain, port, and path)
- No trailing slashes
- Case sensitive
- After adding/updating redirect URIs in Google Cloud Console, it may take a few minutes to propagate