import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 client
function initializeOAuth2Client(): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set credentials if we have a refresh token
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
  }

  return oauth2Client;
}

// Get authorization URL for initial setup
export function getAuthorizationUrl(): string {
  const oauth2Client = initializeOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force consent to ensure we get a refresh token
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string): Promise<{
  access_token?: string | null;
  refresh_token?: string | null;
}> {
  const oauth2Client = initializeOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Initialize Drive client with OAuth2
function initializeDriveClient() {
  const oauth2Client = initializeOAuth2Client();
  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Rest of the functions remain the same as in google-drive.ts
// Just replace initializeDriveClient implementation

export async function findFolder(parentId: string, folderName: string): Promise<string | null> {
  const drive = initializeDriveClient();
  
  try {
    const response = await drive.files.list({
      q: `'${parentId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id || null;
    }
    return null;
  } catch (error) {
    console.error('Error finding folder:', error);
    return null;
  }
}

export async function createFolder(parentId: string, folderName: string): Promise<string | null> {
  const drive = initializeDriveClient();
  
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return response.data.id || null;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

export function getFolderLink(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export async function ensureRAWFolder(clientDriveFolderId: string): Promise<string> {
  let rawFolderId = await findFolder(clientDriveFolderId, 'RAW');
  
  if (!rawFolderId) {
    rawFolderId = await createFolder(clientDriveFolderId, 'RAW');
    if (!rawFolderId) {
      throw new Error('Failed to create RAW folder');
    }
    console.log(`Created RAW folder with ID: ${rawFolderId}`);
  }
  
  return rawFolderId;
}

export async function createCreatorFolder(
  rawFolderId: string, 
  creatorFullName: string, 
  castingName: string
): Promise<{ folderId: string; folderUrl: string }> {
  const folderName = `${creatorFullName} - ${castingName}`;
  
  let folderId = await findFolder(rawFolderId, folderName);
  
  if (!folderId) {
    folderId = await createFolder(rawFolderId, folderName);
    if (!folderId) {
      throw new Error('Failed to create creator folder');
    }
    console.log(`Created creator folder: ${folderName} with ID: ${folderId}`);
  }
  
  const folderUrl = getFolderLink(folderId);
  
  return { folderId, folderUrl };
}