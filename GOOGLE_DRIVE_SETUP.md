# Google Drive OAuth2 Setup Guide

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" → "Credentials"

## Step 2: Create OAuth 2.0 Client ID

1. Click "Create Credentials" → "OAuth client ID"
2. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in required fields (app name, user support email, etc.)
   - Add your domain to authorized domains: `platform.bubbleads.nl`
   - Add required scopes:
     - `https://www.googleapis.com/auth/drive`
     - `https://www.googleapis.com/auth/drive.file`
   - Add test users if in testing mode

3. For the OAuth client:
   - Application type: "Web application"
   - Name: "SocialBubble Drive Integration"
   - Authorized redirect URIs:
     - `https://platform.bubbleads.nl/api/auth/google/callback`
     - `http://localhost:3000/api/auth/google/callback` (for local development)

## Step 3: Verify Client ID Matches

Your OAuth client ID should look like:
```
YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

Make sure this EXACTLY matches what's shown in Google Cloud Console.

## Step 4: Enable Google Drive API

1. Go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it and press "Enable"

## Step 5: Environment Variables

Your `.env.local` should have:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=https://platform.bubbleads.nl/api/auth/google/callback
```

## Step 6: Set Redirect URI for Different Environments

For local development:
```
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

For production:
```
GOOGLE_REDIRECT_URI=https://platform.bubbleads.nl/api/auth/google/callback
```

## OAuth Consent Screen Configuration

If your app is in testing mode:
1. Add test users who can access the app
2. Each test user needs to be added individually
3. Maximum 100 test users allowed

For production:
1. Submit for verification if accessing sensitive scopes
2. Provide privacy policy and terms of service URLs
3. Complete verification process

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**
   - Ensure the redirect URI in your code EXACTLY matches one in Google Console
   - Check for trailing slashes, http vs https, port numbers

2. **"access_blocked" error**
   - App might be in testing mode - add user as test user
   - OAuth consent screen might need more configuration

3. **"invalid_client" error**
   - Client ID or secret might be incorrect
   - Check for extra spaces or characters

### Debug Steps:

1. Check browser console for specific error messages
2. Verify all environment variables are loaded correctly
3. Ensure Google Drive API is enabled in Google Console
4. Check that OAuth consent screen is properly configured

## Security Notes

- Never commit credentials to version control
- Use environment variables for all sensitive data
- Rotate credentials regularly
- Monitor OAuth app usage in Google Console

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)