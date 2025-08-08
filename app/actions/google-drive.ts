'use server';

import { currentUser } from '@clerk/nextjs/server';
import { google } from 'googleapis';

export async function checkGoogleDriveAuth() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check if refresh token exists
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      return { 
        success: true, 
        isAuthorized: false,
        message: 'No refresh token configured'
      };
    }

    // Try to initialize OAuth client and verify it works
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      // Try to get access token to verify refresh token is valid
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Try to get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();

      return { 
        success: true, 
        isAuthorized: true,
        email: data.email,
        name: data.name,
        message: 'Google Drive is properly configured'
      };
    } catch (error) {
      console.error('OAuth verification error:', error);
      return { 
        success: true, 
        isAuthorized: false,
        message: 'Invalid or expired refresh token'
      };
    }
  } catch (error) {
    console.error('Error checking Google Drive auth:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check authorization'
    };
  }
}

export async function revokeGoogleDriveAuth() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // In a real implementation, you might want to:
    // 1. Revoke the token with Google
    // 2. Clear it from your database
    // For now, we'll just return a message
    
    return { 
      success: true, 
      message: 'To revoke access, remove GOOGLE_REFRESH_TOKEN from your environment variables and restart the server'
    };
  } catch (error) {
    console.error('Error revoking Google Drive auth:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to revoke authorization'
    };
  }
}