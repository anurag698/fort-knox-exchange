
import { initializeApp, getApps, getApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// Ensure this file is treated as a server-only module
import 'server-only';

const appName = 'firebase-admin-app-singleton';

/**
 * A memoized function to get the Firebase Admin SDK instances.
 * Ensures that the SDK is initialized only once.
 * @returns An object containing the Firestore, Auth, and App instances.
 */
export function getFirebaseAdmin() {
    // Check if the app is already initialized
    if (getApps().some(app => app.name === appName)) {
        const adminApp = getApp(appName);
        return { 
            firestore: getFirestore(adminApp), 
            auth: getAuth(adminApp), 
            app: adminApp,
            FieldValue,
        };
    }

    try {
        // Initialize the app with default credentials from the environment.
        // Explicitly setting the projectId is crucial in some environments where
        // default discovery can fail.
        const adminApp = initializeApp({
            credential: applicationDefault(),
            projectId: firebaseConfig.projectId,
        }, appName);
        
        return { 
            firestore: getFirestore(adminApp), 
            auth: getAuth(adminApp), 
            app: adminApp,
            FieldValue,
        };

    } catch (error: any) {
        console.error("Firebase Admin Initialization Error:", error);
        // Throw a more descriptive error to help with debugging.
        throw new Error(`Failed to initialize Firebase Admin SDK. Please ensure your server environment has the necessary Google Cloud credentials. Original error: ${error.message}`);
    }
}
