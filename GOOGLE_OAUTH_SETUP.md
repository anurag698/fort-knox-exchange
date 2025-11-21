# Google OAuth Setup Instructions

## Overview
This guide will help you configure Google OAuth for Fort Knox Exchange.

## Steps to Get Google OAuth Credentials

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Fort Knox Exchange"
4. Click "Create"

### 2. Enable Google+ API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have Google Workspace)
3. Click "Create"
4. Fill in:
   - App name: `Fort Knox Exchange`
   - User support email: Your email
   - Developer contact: Your email
5. Click "Save and Continue"
6. Skip "Scopes" (click "Save and Continue")
7. Skip "Test users" (click "Save and Continue")

### 4. Create OAuth Client ID
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "Fort Knox Web Client"
5. **Authorized JavaScript origins:**
   ```
   http://localhost:9002
   https://nonevanescent-aplacental-asuncion.ngrok-free.dev
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:9002/api/auth/callback/google
   https://nonevanescent-aplacental-asuncion.ngrok-free.dev/api/auth/callback/google
   ```
7. Click "Create"
8. Copy your **Client ID** and **Client Secret**

### 5. Configure Environment Variables
1. Open `.env.local` in your project root
2. Add the following (replace with your actual values):
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   NEXTAUTH_SECRET=generate-this-with-openssl-rand-base64-32
   NEXTAUTH_URL=http://localhost:9002
   ```

### 6. Generate NEXTAUTH_SECRET
Run in terminal:
```bash
openssl rand -base64 32
```
Copy the output and use it as your `NEXTAUTH_SECRET`.

### 7. Restart Development Server
```bash
npm run dev
```

## Testing
1. Go to `/auth`
2. Click "Continue with Google"
3. You should see Google's OAuth consent screen
4. Select your account
5. You'll be redirected back to the app

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure the redirect URI in Google Console exactly matches: `http://localhost:9002/api/auth/callback/google`
- Don't forget the trailing `/google`

### "Error 401: invalid_client"
- Double-check your Client ID and Secret in `.env.local`
- Make sure there are no extra spaces

### Still using Microsoft login?
- Make sure `.env.local` has the Google credentials
- Restart the dev server after adding env variables
- Clear browser cache if needed

## Production Deployment
When deploying to production:
1. Add your production domain to "Authorized JavaScript origins"
2. Add your production callback URL to "Authorized redirect URIs"
   ```
   https://your-domain.com/api/auth/callback/google
   ```
3. Update `NEXTAUTH_URL` in production environment variables
