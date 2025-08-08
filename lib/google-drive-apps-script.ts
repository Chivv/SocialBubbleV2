/**
 * Google Drive integration using Apps Script Web App
 * This bypasses service account restrictions by using a deployed Apps Script
 */

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

async function callAppsScript(action: string, data: any) {
  if (!APPS_SCRIPT_URL) {
    throw new Error('GOOGLE_APPS_SCRIPT_URL not configured');
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...data }),
  });

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Apps Script call failed');
  }
  
  return result.data;
}

export async function ensureRAWFolder(clientDriveFolderId: string): Promise<string> {
  try {
    const rawFolderId = await callAppsScript('ensureRAWFolder', {
      parentFolderId: clientDriveFolderId
    });
    
    console.log(`RAW folder ready with ID: ${rawFolderId}`);
    return rawFolderId;
  } catch (error) {
    console.error('Error ensuring RAW folder:', error);
    throw error;
  }
}

export async function createCreatorFolder(
  rawFolderId: string, 
  creatorFullName: string, 
  castingName: string
): Promise<{ folderId: string; folderUrl: string }> {
  try {
    const result = await callAppsScript('createCreatorFolder', {
      rawFolderId,
      creatorName: creatorFullName,
      castingName
    });
    
    console.log(`Created creator folder: ${creatorFullName} - ${castingName}`);
    return result;
  } catch (error) {
    console.error('Error creating creator folder:', error);
    throw error;
  }
}

// For compatibility with existing code
export function getFolderLink(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

// Not needed for Apps Script but kept for compatibility
export async function shareCreatorFolder(folderId: string, creatorEmail: string): Promise<void> {
  console.log(`Sharing folder ${folderId} with ${creatorEmail} - manual sharing required`);
}

export async function testDriveConnection(): Promise<boolean> {
  try {
    if (!APPS_SCRIPT_URL) {
      console.error('GOOGLE_APPS_SCRIPT_URL not configured');
      return false;
    }
    
    // Simple test - try to call the script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'test' }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Drive connection test failed:', error);
    return false;
  }
}