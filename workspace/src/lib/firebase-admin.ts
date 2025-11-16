
// src/lib/firebase-admin.ts
import { App, getApp, getApps, initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore';
import 'server-only';

// Define a type for the services for clarity
type FirebaseAdminServices = {
  app: App;
  firestore: Firestore;
  auth: Auth;
  FieldValue: typeof FieldValue;
};

// This variable will hold the singleton instance of the initialized services
let adminServices: FirebaseAdminServices | null = null;

/**
 * Lazy init: only initialize admin when this function is called from server code.
 * This avoids running admin initialization during bundling or in client bundles.
 */
function initAdminIfNeeded(): FirebaseAdminServices {
  // If already initialized, return the existing instance
  if (adminServices) {
    return adminServices;
  }
  
  const appName = 'firebase-admin-app-singleton';
  const existingApp = getApps().find(app => app.name === appName);
  
  if (existingApp) {
      adminServices = { 
        app: existingApp,
        firestore: getAdminFirestore(existingApp), 
        auth: getAdminAuth(existingApp),
        FieldValue,
      };
      return adminServices;
  }
  
  const svcJsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const googleCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  let newApp: App;
  
  try {
    if (svcJsonEnv) {
      let parsedCreds: ServiceAccount;
      try {
        parsedCreds = JSON.parse(svcJsonEnv);
      } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
        throw new Error('Could not parse FIREBASE_SERVICE_ACCOUNT_JSON. Check for syntax errors.');
      }
      newApp = initializeApp({
        credential: cert(parsedCreds),
      }, appName);
    } else if (googleCredsPath) {
      // GAC path set for file-based credential (Cloud Run / local path)
      newApp = initializeApp({
        credential: cert(googleCredsPath),
      }, appName);
    } else {
      console.warn('No Firebase admin credentials provided. Attempting to initialize with Application Default Credentials.');
      // This will work in Google Cloud environments automatically.
      // It will fail in local environments if gcloud CLI is not configured.
      newApp = initializeApp({}, appName);
    }
    
    adminServices = {
        app: newApp,
        firestore: getAdminFirestore(newApp),
        auth: getAdminAuth(newApp),
        FieldValue
    };

    return adminServices;

  } catch (err: any) {
    console.error('[firebase-admin] initialization failed:', err?.stack || err?.message || err);
    // It's often better to throw here to prevent the app from running in a broken state.
    throw new Error(`Firebase Admin SDK initialization failed: ${err.message}`);
  }
}

/**
 * Named export used across the codebase.
 * Lazily initializes admin (server-only).
 * Returns the entire services object.
 */
export function getFirebaseAdmin(): FirebaseAdminServices {
  return initAdminIfNeeded();
}

/**
 * Default export kept for compatibility with any default imports.
 * This also returns the full services object for consistency.
 */
export default getFirebaseAdmin;
