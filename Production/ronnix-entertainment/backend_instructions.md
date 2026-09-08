# Backend Setup for Cross-Domain SSO

This feature requires a Firebase Cloud Function to generate custom tokens securely.
Since this code runs on the server (Google Cloud), it cannot be included directly in the frontend build.

## 1. Setup Firebase Functions
If you haven't already:
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

## 2. Deploy this Cloud Function (V2 Gen)
The following code uses the **Firebase Functions V2 API**. This resolves the "functions.region is not a function" error by using modular imports.

Replace the content of `functions/index.js` with this:

```javascript
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2/options");
const admin = require("firebase-admin");

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Set Global Options (Region)
// IMPORTANT: This must match the region in your firebase.ts (europe-west1)
setGlobalOptions({region: "europe-west1", cors: true});

/**
 * Generates a Cross-Domain Custom Token for the currently logged-in user.
 * This token can be used to sign in on another domain sharing the same Project.
 */
exports.generateCrossDomainToken = onCall(async (request) => {
  // 1. Verify Authentication
  // In V2, auth context is available on request.auth
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "The user must be authenticated to generate a cross-domain token.",
    );
  }

  const uid = request.auth.uid;

  try {
    // 2. Create Custom Token
    // REQUIRES: "IAM Service Account Credentials API" enabled in Google Cloud
    const customToken = await admin.auth().createCustomToken(uid);
    return {token: customToken};
  } catch (error) {
    console.error("Error creating custom token:", error);
    throw new HttpsError(
        "internal",
        "Unable to generate token. Check IAM permissions and API enablement.",
        error
    );
  }
});
```

## 3. Mandatory Configuration Steps (DO NOT SKIP)

If you get errors like "Internal" or "Permission Denied", you must do the following in the Google Cloud/Firebase Console:

### Step A: Enable the API (Critical)
1. Go to **Google Cloud Console** > **APIs & Services** > **Library**.
2. Search for **"IAM Service Account Credentials API"**.
3. Click **Enable**.
   *Without this, `admin.auth().createCustomToken()` will always fail on the server.*

### Step B: Grant IAM Permissions
1. Go to **IAM & Admin** > **IAM**.
2. Find the service account your function uses.
   *   For V2 functions, this is often the **Default Compute Engine Service Account** (ends in `@developer.gserviceaccount.com`).
   *   If unsure, check the "Details" tab of your function in the Cloud Console to see which account it uses.
3. Edit that account (pencil icon).
4. Add the role: **"Service Account Token Creator"** (dt: Ersteller von Dienstkontotokens).
5. Save.

### Step C: Authorize Domains (Firebase Auth)
For the login to work on the destination domain (e.g., `ronnixcomix.de`), Firebase must allow it.
1. Go to **Firebase Console** > **Authentication** > **Settings** > **Authorized Domains**.
2. Click **Add Domain**.
3. Add **every** domain you use:
   - `ronnixcomix.de`
   - `ronnixboox.de`
   - `lamazgamez.de`
   - etc.

## 4. Deploy
Deploy the function:
```bash
firebase deploy --only functions
```

## 5. CRITICAL: Google OAuth Configuration (Google Login)

If "Sign in with Google" fails on the new domains (popup closes immediately or error), you MUST add them to the OAuth Client.

1. Go to **Google Cloud Console** > **APIs & Services** > **Credentials**.
2. Under "OAuth 2.0 Client IDs", find the client named **"Web client (auto created by Google Service)"**.
3. Click the pencil icon (Edit).
4. **Authorized JavaScript origins**:
   Add the URI for EVERY domain (no trailing slash):
   - `https://ronnixcomix.de`
   - `https://ronnixboox.de`
   - `https://lamazgamez.de`
   - `https://ronnixmoviez.de`
   - `https://ronnixseriez.de`
5. **Authorized redirect URIs**:
   Add the auth handler for EVERY domain:
   - `https://ronnixcomix.de/__/auth/handler`
   - `https://ronnixboox.de/__/auth/handler`
   - `https://lamazgamez.de/__/auth/handler`
   - `https://ronnixmoviez.de/__/auth/handler`
   - `https://ronnixseriez.de/__/auth/handler`
6. Click **SAVE**. Note: It may take 5 minutes to propagate.