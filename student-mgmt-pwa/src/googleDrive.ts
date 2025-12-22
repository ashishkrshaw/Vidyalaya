// Google Drive API Service for Backup/Restore
// Uses OAuth 2.0 with Google Identity Services

const CLIENT_ID = '868489588525-tk04vimaevj4ae7060u9fcsbot26ni1s.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Backup folder name in Drive
const BACKUP_FOLDER_NAME = 'SchoolBackups';

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;
let accessToken: string | null = null;

// Initialize GAPI client with retry
export const initGapiClient = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkGapi = () => {
      const gapi = (window as any).gapi;
      if (gapi) {
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              discoveryDocs: [DISCOVERY_DOC],
            });
            gapiInited = true;
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      } else {
        attempts++;
        if (attempts < 20) { // Wait up to 10 seconds (20 * 500ms)
          setTimeout(checkGapi, 500);
        } else {
          reject(new Error('Google API failed to load (timeout)'));
        }
      }
    };
    checkGapi();
  });
};

// Initialize Google Identity Services with retry
export const initGisClient = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkGoogle = () => {
      const google = (window as any).google;
      if (google?.accounts?.oauth2) {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // Will be set later
        });
        gisInited = true;
        resolve();
      } else {
        attempts++;
        if (attempts < 20) {
          setTimeout(checkGoogle, 500);
        } else {
          reject(new Error('Google Identity Services failed to load (timeout)'));
        }
      }
    };
    checkGoogle();
  });
};

// Check if user is signed in
export const isSignedIn = (): boolean => {
  return accessToken !== null;
};

// Get access token via OAuth popup
export const signIn = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized'));
      return;
    }
    
    tokenClient.callback = (response: any) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      accessToken = response.access_token;
      resolve(response.access_token);
    };
    
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

// Sign out
export const signOut = (): void => {
  const google = (window as any).google;
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
  }
};

// Get or create backup folder in Drive
const getOrCreateBackupFolder = async (): Promise<string> => {
  const gapi = (window as any).gapi;
  
  // Search for existing folder
  const searchResponse = await gapi.client.drive.files.list({
    q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });
  
  if (searchResponse.result.files && searchResponse.result.files.length > 0) {
    return searchResponse.result.files[0].id;
  }
  
  // Create new folder
  const createResponse = await gapi.client.drive.files.create({
    resource: {
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });
  
  return createResponse.result.id;
};

// Upload backup file to Drive
export const uploadToDrive = async (data: any, fileName: string): Promise<{ id: string; name: string }> => {
  if (!accessToken) {
    throw new Error('Not signed in');
  }
  
  const folderId = await getOrCreateBackupFolder();
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [folderId],
  };
  
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', blob);
  
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  
  return response.json();
};

// List backup files from Drive
export const listBackupFiles = async (): Promise<Array<{ id: string; name: string; modifiedTime: string }>> => {
  if (!accessToken) {
    throw new Error('Not signed in');
  }
  
  const gapi = (window as any).gapi;
  
  // First get folder ID
  const folderResponse = await gapi.client.drive.files.list({
    q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  });
  
  if (!folderResponse.result.files || folderResponse.result.files.length === 0) {
    return [];
  }
  
  const folderId = folderResponse.result.files[0].id;
  
  // List files in folder
  const filesResponse = await gapi.client.drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
    fields: 'files(id, name, modifiedTime)',
    orderBy: 'modifiedTime desc',
  });
  
  return filesResponse.result.files || [];
};

// Download backup file from Drive
export const downloadFromDrive = async (fileId: string): Promise<any> => {
  if (!accessToken) {
    throw new Error('Not signed in');
  }
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Download failed');
  }
  
  return response.json();
};

// Delete backup file from Drive
export const deleteFromDrive = async (fileId: string): Promise<void> => {
  if (!accessToken) {
    throw new Error('Not signed in');
  }
  
  const gapi = (window as any).gapi;
  await gapi.client.drive.files.delete({ fileId });
};
