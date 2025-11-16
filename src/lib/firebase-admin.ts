
import { initializeApp, getApps, getApp, applicationDefault, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';

// Ensure this file is treated as a server-only module
import 'server-only';

const appName = 'firebase-admin-app-singleton';

type FirebaseAdminServices = {
  firestore: Firestore;
  auth: Auth;
  app: App;
  FieldValue: typeof FieldValue;
};

/**
 * A memoized function to get the Firebase Admin SDK instances.
 * This robust pattern ensures the SDK is initialized only once and checks
 * for credentials from several sources, making it suitable for various environments.
 * @returns An object containing the Firestore, Auth, and App instances.
 */
export function getFirebaseAdmin(): FirebaseAdminServices {
    // Check if the app is already initialized to prevent re-initialization
    const existingApp = getApps().find(app => app.name === appName);
    if (existingApp) {
        return { 
            firestore: getFirestore(existingApp), 
            auth: getAuth(existingApp), 
            app: existingApp,
            FieldValue,
        };
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    let adminApp: App;

    if (serviceAccountJson) {
        try {
            // Initialize from a JSON string in an environment variable.
            // This is common for serverless environments like Vercel or Cloud Run.
            const parsedServiceAccount = JSON.parse(serviceAccountJson);
            adminApp = initializeApp({
                credential: cert(parsedServiceAccount),
                projectId: parsedServiceAccount.project_id,
            }, appName);
            console.log('Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON.');
        } catch (error: any) {
            console.error('Failed to parse or use FIREBASE_SERVICE_ACCOUNT_JSON:', error);
            throw new Error('Could not initialize Firebase Admin from service account JSON.');
        }
    } else {
        try {
            // Fallback to Application Default Credentials (ADC).
            // This works automatically in Google Cloud environments (e.g., Cloud Functions, App Engine)
            // or when the gcloud CLI is configured locally.
            adminApp = initializeApp({
              credential: applicationDefault(),
            }, appName);
            console.log('Firebase Admin initialized with default credentials (ADC).');
        } catch (error: any) {
            console.error("Firebase Admin Initialization Error:", error);
            // Throw a more descriptive error to help with debugging.
            throw new Error(`Failed to initialize Firebase Admin SDK. Ensure your server environment has the necessary Google Cloud credentials (e.g., FIREBASE_SERVICE_ACCOUNT_JSON env var). Original error: ${error.message}`);
        }
    }
    
    return { 
        firestore: getFirestore(adminApp), 
        auth: getAuth(adminApp), 
        app: adminApp,
        FieldValue,
    };
}
