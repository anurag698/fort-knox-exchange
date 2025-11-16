
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
 * Defensive server/client guard.
 * If this file is accidentally executed in client bundle, it will throw a clear error.
 */
function isClientSide(): boolean {
  try {
    if (typeof window !== 'undefined') return true;
    if (typeof document !== 'undefined') return true;
  } catch {}
  return false;
}

/**
 * Lazy init: only initialize admin when this function is called from server code.
 * This avoids running admin initialization during bundling or in client bundles.
 */
function initAdminIfNeeded(): FirebaseAdminServices {
  if (isClientSide()) {
    // Fail fast with a clear message if someone accidentally calls server SDK from client.
    throw new Error(
      '[firebase-admin] attempted to initialize on the client. Move any imports of server-only modules into server-side code (API routes, server components, or server utilities).'
    );
  }

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
      let parsed: any;
      try {
        parsed = JSON.parse(svcJsonEnv);
      } catch (err) {
        console.error('[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, attempting to clean it.', err);
        try {
          // Attempt to fix common issues like escaped newlines
          const cleaned = svcJsonEnv.replace(/\\n/g, '\n');
          parsed = JSON.parse(cleaned);
        } catch (e) {
          console.error('[firebase-admin] Re-parsing also failed.', e);
          throw e; // re-throw after logging
        }
      }
      newApp = initializeApp({
        credential: cert(parsed as ServiceAccount),
        projectId: parsed.project_id,
      }, appName);
    } else if (googleCredsPath) {
        // Fallback to Application Default Credentials via file path.
        // This works automatically in Google Cloud environments or when gcloud CLI is configured.
        newApp = initializeApp({ credential: cert(googleCredsPath) }, appName);
    } else {
        console.warn('[firebase-admin] No credentials provided. Using default for local emulator or ADC.');
        newApp = initializeApp({}, appName);
    }
    
    adminServices = {
        app: newApp,
        firestore: getAdminFirestore(newApp),
        auth: getAdminAuth(newApp),
        FieldValue
    };

    return adminServices;

  } catch (err) {
    console.error('[firebase-admin] initialization failed:', err && (err as Error).message);
    throw err;
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
