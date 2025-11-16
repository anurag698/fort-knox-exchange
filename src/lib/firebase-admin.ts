
// src/lib/firebase-admin.ts
import { getApps, getApp, initializeApp, credential, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import 'server-only';

type FirebaseAdminServices = {
  firestore: Firestore;
  auth: Auth;
  app: App;
  FieldValue: typeof FieldValue;
};

/**
 * Defensive server/client guard.
 * If this file is accidentally executed in client bundle, it will throw a clear error.
 */
function isClientSide() {
  try {
    // window and document are only defined client-side
    if (typeof window !== 'undefined') return true;
    if (typeof document !== 'undefined') return true;
  } catch {}
  return false;
}

if (isClientSide()) {
  // if this line appears in browser console, you have a client import problem
  console.error('[FATAL] firebase-admin module executed in client bundle — search your imports for src/lib/firebase-admin or firebase-admin');
  
  // Export stubs that fail early and clearly to help debugging.
  // These exports need to exist to satisfy static analysis during build,
  // but they will throw a runtime error if ever called on the client.
  const clientStub = () => { throw new Error('firebase-admin function called in client bundle.'); };
  
  const firestoreStub = clientStub as unknown as Firestore;
  const authStub = clientStub as unknown as Auth;
  const FieldValueStub = clientStub as unknown as typeof FieldValue;
  const appStub = clientStub as unknown as App;

  const servicesStub: FirebaseAdminServices = {
    firestore: firestoreStub,
    auth: authStub,
    app: appStub,
    FieldValue: FieldValueStub
  };
  
  export const getFirebaseAdmin = (): FirebaseAdminServices => {
    throw new Error('getFirebaseAdmin should not be called on the client.');
  };
  export const firestore = firestoreStub;
  export const auth = authStub;

} else {
  // Server-side initialization
  let services: FirebaseAdminServices | null = null;
  
  function initFirebaseAdmin(): FirebaseAdminServices {
     if (services) {
      return services;
    }

    const appName = 'firebase-admin-app-singleton';
    const existingApp = getApps().find(app => app.name === appName);
    
    if (existingApp) {
        services = { 
            firestore: getFirestore(existingApp), 
            auth: getAuth(existingApp), 
            app: existingApp,
            FieldValue,
        };
        return services;
    }

    const svcJsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const googleCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // debug info to logs
    console.log('[firebase-admin] init server-side. env keys present?',
      { hasSAJson: !!svcJsonEnv, hasGoogleCredPath: !!googleCredsPath, NODE_ENV: process.env.NODE_ENV });
    
    let adminApp: App;

    try {
      if (svcJsonEnv) {
        let parsed: any;
        try { parsed = JSON.parse(svcJsonEnv); }
        catch (err) {
          // try to fix newline-escaped env values
          try {
            const cleaned = svcJsonEnv.replace(/\\n/g, '\n');
            parsed = JSON.parse(cleaned);
          } catch (e: any) {
            console.error('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON parse failed', e);
            throw e;
          }
        }
        adminApp = initializeApp({
          credential: credential.cert(parsed),
          projectId: parsed.project_id,
        }, appName);
        console.log('[firebase-admin] initialized from FIREBASE_SERVICE_ACCOUNT_JSON', { projectId: parsed.project_id });
        
      } else {
          // Fallback to Application Default Credentials (ADC).
          // This works automatically in Google Cloud environments or when gcloud CLI is configured.
          adminApp = initializeApp({}, appName);
          console.log('[firebase-admin] initialized using Application Default Credentials (ADC)');
      }

      services = { 
        firestore: getFirestore(adminApp), 
        auth: getAuth(adminApp), 
        app: adminApp,
        FieldValue,
      };
      return services;

    } catch (err: any) {
      console.error('[firebase-admin] initialization FAILED', err && err.message ? err.message : err);
      throw err;
    }
  }
  
  // getFirebaseAdmin is the named accessor for code that expects it.
  // Correctly export using ES module syntax.
  export function getFirebaseAdmin(): FirebaseAdminServices {
    return initFirebaseAdmin();
  }
  
  const adminServices = initFirebaseAdmin();
  export const firestore = adminServices.firestore;
  export const auth = adminServices.auth;
}
