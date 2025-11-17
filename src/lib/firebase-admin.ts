
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
 * Get initialized Firebase Admin SDK. This function will try the following, in order:
 * 1. Use FIREBASE_SERVICE_ACCOUNT_JSON env if present (recommended for Studio preview)
 * 2. Use GOOGLE_APPLICATION_CREDENTIALS/applicationDefault if present
 * 3. Otherwise log a clear warning and return null.
 */
export function getFirebaseAdmin(): FirebaseAdminServices {
  if (adminServices) return adminServices;
  
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
  
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  try {
    if (svcJson) {
        const creds = JSON.parse(svcJson);
        const newApp = initializeApp({ credential: cert(creds) }, appName);
        console.info('[firebase-admin] Initialized successfully from FIREBASE_SERVICE_ACCOUNT_JSON.');
        adminServices = {
            app: newApp,
            firestore: getAdminFirestore(newApp),
            auth: getAdminAuth(newApp),
            FieldValue
        };
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const newApp = initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) }, appName);
        console.info('[firebase-admin] Initialized successfully using GOOGLE_APPLICATION_CREDENTIALS.');
        adminServices = {
            app: newApp,
            firestore: getAdminFirestore(newApp),
            auth: getAdminAuth(newApp),
            FieldValue
        };
    } else {
      console.warn(`[firebase-admin] WARNING: No Firebase admin credentials provided. Attempting to initialize with Application Default Credentials.`);
      const newApp = initializeApp({}, appName);
      adminServices = {
          app: newApp,
          firestore: getAdminFirestore(newApp),
          auth: getAdminAuth(newApp),
          FieldValue
      };
    }
  } catch(err: any) {
    console.error('[firebase-admin] initialization failed:', err?.stack || err?.message || err);
    throw new Error(`Firebase Admin SDK initialization failed: ${err.message}`);
  }
  
  return adminServices;
}
