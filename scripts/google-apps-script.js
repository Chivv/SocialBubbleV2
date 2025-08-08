/**
 * Google Apps Script - Deploy this as a Web App
 * This runs under a user account, bypassing service account restrictions
 * 
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Paste this code
 * 4. Deploy as Web App with "Execute as: Me" and "Who has access: Anyone"
 * 5. Use the Web App URL as your API endpoint
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result;
    
    switch(action) {
      case 'ensureRAWFolder':
        result = ensureRAWFolder(data.parentFolderId);
        break;
      case 'createCreatorFolder':
        result = createCreatorFolder(data.rawFolderId, data.creatorName, data.castingName);
        break;
      default:
        throw new Error('Invalid action');
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureRAWFolder(parentFolderId) {
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  const folders = parentFolder.getFoldersByName('RAW');
  
  if (folders.hasNext()) {
    return folders.next().getId();
  } else {
    const rawFolder = parentFolder.createFolder('RAW');
    return rawFolder.getId();
  }
}

function createCreatorFolder(rawFolderId, creatorName, castingName) {
  const rawFolder = DriveApp.getFolderById(rawFolderId);
  const folderName = `${creatorName} - ${castingName}`;
  
  const folders = rawFolder.getFoldersByName(folderName);
  
  let folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = rawFolder.createFolder(folderName);
  }
  
  return {
    folderId: folder.getId(),
    folderUrl: folder.getUrl()
  };
}