
import { initializeApp, getApps, getApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Ensure this file is treated as a server-only module
import 'server-only';

const appName = 'firebase-admin-app-singleton';

/**
 * A memoized function to get the Firebase Admin SDK instances.
 * Ensures that the SDK is initialized only once.
 * This robust pattern checks for credentials from several sources.
 * @returns An object containing the Firestore, Auth, and App instances.
 */
export function getFirebaseAdmin() {
    // Check if the app is already initialized to prevent re-initialization
    if (getApps().some(app => app.name === appName)) {
        const adminApp = getApp(appName);
        return { 
            firestore: getFirestore(adminApp), 
            auth: getAuth(adminApp), 
            app: adminApp,
            FieldValue,
        };
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    try {
        let adminApp;
        if (serviceAccountJson) {
            // Initialize from a JSON string in an environment variable.
            // This is common for serverless environments like Vercel or Cloud Run.
            const parsedServiceAccount = JSON.parse(serviceAccountJson);
            adminApp = initializeApp({
                credential: cert(parsedServiceAccount),
                projectId: parsedServiceAccount.project_id,
            }, appName);
            console.log('Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON.');
        } else {
            // Fallback to Application Default Credentials (ADC).
            // This works automatically in Google Cloud environments (e.g., Cloud Functions, App Engine)
            // or when the gcloud CLI is configured locally.
            adminApp = initializeApp({
              credential: applicationDefault(),
            }, appName);
            console.log('Firebase Admin initialized with default credentials (ADC).');
        }
        
        return { 
            firestore: getFirestore(adminApp), 
            auth: getAuth(adminApp), 
            app: adminApp,
            FieldValue,
        };

    } catch (error: any) {
        console.error("Firebase Admin Initialization Error:", error);
        // Throw a more descriptive error to help with debugging.
        throw new Error(`Failed to initialize Firebase Admin SDK. Ensure your server environment has the necessary Google Cloud credentials (e.g., FIREBASE_SERVICE_ACCOUNT_JSON env var). Original error: ${error.message}`);
    }
}
