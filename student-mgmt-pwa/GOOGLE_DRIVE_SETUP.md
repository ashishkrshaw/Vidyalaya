# Google Drive API Setup Guide

This guide explains how to configure Google Cloud Console for the Google Drive backup/restore feature.

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top → **New Project**
3. Enter a project name (e.g., `School Management App`)
4. Click **Create**

---

## Step 2: Enable Google Drive API

1. In the sidebar, go to **APIs & Services** → **Library**
2. Search for **Google Drive API**
3. Click on it and press **Enable**

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace org)
3. Click **Create**

### Fill in the details:
| Field | Value |
|-------|-------|
| App name | `School Management System` |
| User support email | Your email |
| Developer contact email | Your email |

4. Click **Save and Continue**

### Add Scopes:
1. Click **Add or Remove Scopes**
2. Search and add these scopes:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.appdata`
3. Click **Update** → **Save and Continue**

### Test Users (for development):
1. Click **Add Users**
2. Add your Google email
3. Click **Save and Continue** → **Back to Dashboard**

---

## Step 4: Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**

### Configure:
| Field | Value |
|-------|-------|
| Application type | **Web application** |
| Name | `School App Web Client` |

### Authorized JavaScript Origins:
Add these URLs:
```
http://localhost:5173
http://localhost:5174
http://127.0.0.1:5173
```

> **Note:** For production, add your actual domain (e.g., `https://your-school-app.com`)

### Authorized Redirect URIs:
(Leave empty for this flow - we use implicit grant)

3. Click **Create**

---

## Step 5: Copy Your Client ID

After creating, you'll see:
- **Client ID:** `XXXXXXXX.apps.googleusercontent.com`
- **Client Secret:** (not needed for browser-only apps)

Your Client ID looks like:
```
868489588525-tk04vimaevj4ae7060u9fcsbot26ni1s.apps.googleusercontent.com
```

---

## Step 6: Update the App (Already Done)

The Client ID is already configured in:
- `src/googleDrive.ts` → Line 4

```typescript
const CLIENT_ID = '868489588525-tk04vimaevj4ae7060u9fcsbot26ni1s.apps.googleusercontent.com';
```

---

## Step 7: Publish the App (For Production)

While in **Testing** mode, only added test users can use the app.

### To allow anyone to sign in:
1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Confirm the verification process

> **Note:** Google may require verification for sensitive scopes. The `drive.file` scope is relatively safe and may not require full verification.

---

## Troubleshooting

### "Access Blocked: This app's request is invalid"
- ✅ Check that your origin URL is in **Authorized JavaScript Origins**
- ✅ Make sure it matches exactly (including port number)

### "Sign-in popup blocked"
- ✅ Allow popups for localhost in your browser

### "This app isn't verified"
- ✅ Click **Advanced** → **Go to [App Name] (unsafe)** during development
- ✅ Or add yourself as a Test User in OAuth consent screen

### "Error 400: redirect_uri_mismatch"
- ✅ For OAuth popup flow, you don't need redirect URIs
- ✅ Just ensure JavaScript origins are correct

### Console shows "Google API not loaded"
- ✅ Check internet connection
- ✅ Ensure the scripts in `index.html` are loading:
  ```html
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <script src="https://apis.google.com/js/api.js" async defer></script>
  ```

---

## Summary Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled Google Drive API
- [ ] Configured OAuth Consent Screen
- [ ] Added scopes: `drive.file`, `drive.appdata`
- [ ] Created OAuth 2.0 Client ID (Web application)
- [ ] Added `http://localhost:5173` to JavaScript Origins
- [ ] Added yourself as a Test User
- [ ] Copied Client ID to `src/googleDrive.ts`

---

## How It Works

```
User clicks "Backup to Drive"
        ↓
App initializes Google Identity Services
        ↓
OAuth popup opens → User signs in
        ↓
App receives access token
        ↓
App uploads backup to user's Google Drive
        ↓
Creates "SchoolBackups" folder if not exists
        ↓
Saves backup as JSON file
```

---

## Security Notes

- ✅ **Client ID is public** - It's designed to be visible in browser apps
- ✅ **No client secret** - Browser apps use implicit grant flow
- ✅ **User's Drive only** - Backups go to the signed-in user's own Drive
- ✅ **Limited scope** - `drive.file` only accesses files created by the app
- ✅ **Token expires** - Access tokens are short-lived and auto-expire

---

## Current Configuration

| Setting | Value |
|---------|-------|
| Client ID | `868489588525-tk04vimaevj4ae7060u9fcsbot26ni1s.apps.googleusercontent.com` |
| Scopes | `drive.file`, `drive.appdata` |
| Backup Folder | `SchoolBackups` |
| File Format | JSON |

---

*Last updated: December 21, 2024*
