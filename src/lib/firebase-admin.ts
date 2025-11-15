
import { initializeApp, getApps, getApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

const appName = 'firebase-admin-app-singleton';

/**
 * A memoized function to get the Firebase Admin SDK instances.
 * Ensures that the SDK is initialized only once.
 * @returns An object containing the Firestore, Auth, and App instances.
 */
export function getFirebaseAdmin() {
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
        const adminApp = initializeApp({
            credential: applicationDefault(),
        }, appName);
        
        return { 
            firestore: getFirestore(adminApp), 
            auth: getAuth(adminApp), 
            app: adminApp,
            FieldValue,
        };

    } catch (error: any) {
        console.error("Firebase Admin Initialization Error:", error);
        throw new Error(`Failed to initialize Firebase Admin SDK. Original error: ${error.message}`);
    }
}


export async function getUserIdFromSession() {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return null;
  }
  try {
    const { auth } = getFirebaseAdmin();
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    return decodedToken.uid;
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}
