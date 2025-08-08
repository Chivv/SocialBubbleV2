import { drive_v3 } from '@googleapis/drive';
import { GaxiosError } from 'gaxios';
import { GoogleAuth } from 'google-auth-library';

// Initialize the Drive client with service account credentials
function initializeDriveClient(): drive_v3.Drive {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  let credentials;
  try {
    credentials = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));
  } catch (error) {
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY. Make sure it is base64 encoded.');
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return new drive_v3.Drive({ auth });
}

// Check if a folder exists in a parent folder
async function findFolder(drive: drive_v3.Drive, parentId: string, folderName: string): Promise<string | null> {
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

// Create a folder in Google Drive
async function createFolder(drive: drive_v3.Drive, parentId: string, folderName: string): Promise<string | null> {
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

// Get the shareable link for a folder
function getFolderLink(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

// Share a folder with a user
async function shareFolder(drive: drive_v3.Drive, folderId: string, email: string, role: 'reader' | 'writer' | 'owner' = 'writer'): Promise<void> {
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        type: 'user',
        role,
        emailAddress: email,
      },
      sendNotificationEmail: true,
    });
  } catch (error) {
    console.error('Error sharing folder:', error);
    throw error;
  }
}

// Main function to ensure RAW folder exists
export async function ensureRAWFolder(clientDriveFolderId: string): Promise<string> {
  const drive = initializeDriveClient();
  
  // Check if RAW folder already exists
  let rawFolderId = await findFolder(drive, clientDriveFolderId, 'RAW');
  
  if (!rawFolderId) {
    // Create RAW folder if it doesn't exist
    rawFolderId = await createFolder(drive, clientDriveFolderId, 'RAW');
    if (!rawFolderId) {
      throw new Error('Failed to create RAW folder');
    }
    console.log(`Created RAW folder with ID: ${rawFolderId}`);
  } else {
    console.log(`RAW folder already exists with ID: ${rawFolderId}`);
  }
  
  return rawFolderId;
}

// Create a creator folder for submissions
export async function createCreatorFolder(
  rawFolderId: string, 
  creatorFullName: string, 
  castingName: string
): Promise<{ folderId: string; folderUrl: string }> {
  const drive = initializeDriveClient();
  
  // Format folder name
  const folderName = `${creatorFullName} - ${castingName}`;
  
  // Check if folder already exists
  let folderId = await findFolder(drive, rawFolderId, folderName);
  
  if (!folderId) {
    // Create folder if it doesn't exist
    folderId = await createFolder(drive, rawFolderId, folderName);
    if (!folderId) {
      throw new Error('Failed to create creator folder');
    }
    console.log(`Created creator folder: ${folderName} with ID: ${folderId}`);
  } else {
    console.log(`Creator folder already exists: ${folderName} with ID: ${folderId}`);
  }
  
  const folderUrl = getFolderLink(folderId);
  
  return { folderId, folderUrl };
}

// Optional: Share folder with creator
export async function shareCreatorFolder(folderId: string, creatorEmail: string): Promise<void> {
  const drive = initializeDriveClient();
  
  try {
    await shareFolder(drive, folderId, creatorEmail, 'writer');
    console.log(`Shared folder ${folderId} with ${creatorEmail}`);
  } catch (error) {
    // Check if it's a permission already exists error
    if (error instanceof GaxiosError && error.response?.status === 400) {
      console.log(`Folder ${folderId} already shared with ${creatorEmail}`);
    } else {
      throw error;
    }
  }
}

// Test connection to Google Drive
export async function testDriveConnection(): Promise<boolean> {
  try {
    const drive = initializeDriveClient();
    await drive.about.get({ fields: 'user' });
    return true;
  } catch (error) {
    console.error('Drive connection test failed:', error);
    return false;
  }
}