
// src/lib/firebase-admin.ts  (DROP THIS IN NOW)
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


function isClientSide() {
  // true if this module ever runs in a browser / client bundle
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
  // Export a stub that fails early and clearly
  const stub: any = {
    apps: [],
    initializeApp: () => { throw new Error('firebase-admin called in client; move server-only imports to API routes / server code'); },
    credential: { cert: () => { throw new Error('firebase-admin credential called in client'); } },
    firestore: () => { throw new Error('firebase-admin firestore called in client'); },
    auth: () => { throw new Error('firebase-admin auth called in client'); },
    FieldValue: {}
  };
  
  // To prevent the app from crashing entirely, we can export the stub.
  // The error will be thrown upon usage.
  module.exports = {
    getFirebaseAdmin: () => stub
  };

} else {
  // Server-side safe init
  const appName = 'firebase-admin-app-singleton';

  function initFirebaseAdmin(): FirebaseAdminServices {
     const existingApp = getApps().find(app => app.name === appName);
    if (existingApp) {
        return { 
            firestore: getFirestore(existingApp), 
            auth: getAuth(existingApp), 
            app: existingApp,
            FieldValue,
        };
    }

    const svcJsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const googleCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // debug info to logs
    console.log('[firebase-admin] init server-side. env keys present?',
      { hasSAJson: !!svcJsonEnv, hasGoogleCredPath: !!googleCredsPath, NODE_ENV: process.env.NODE_ENV });
    
    let adminApp: App;

    try {
      if (svcJsonEnv) {
        let parsed;
        try { parsed = JSON.parse(svcJsonEnv); }
        catch (err) {
          try {
            const cleaned = svcJsonEnv.replace(/\\n/g, '\n');
            parsed = JSON.parse(cleaned);
          } catch (e: any) {
            console.error('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON parse failed', e.message);
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

      return { 
        firestore: getFirestore(adminApp), 
        auth: getAuth(adminApp), 
        app: adminApp,
        FieldValue,
      };

    } catch (err: any) {
      console.error('[firebase-admin] initialization FAILED', err && err.message ? err.message : err);
      throw err;
    }
  }
  
  let services: FirebaseAdminServices | null = null;

  module.exports = {
    getFirebaseAdmin: () => {
        if (!services) {
            services = initFirebaseAdmin();
        }
        return services;
    }
  };
}
