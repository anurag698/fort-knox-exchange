
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
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
            app: adminApp 
        };
    }

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }

    try {
        const credential = {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: JSON.parse(serviceAccount).client_email,
            privateKey: JSON.parse(serviceAccount).private_key.replace(/\\n/g, '\n'),
        };

        const adminApp = initializeApp({ credential }, appName);

        return { 
            firestore: getFirestore(adminApp), 
            auth: getAuth(adminApp), 
            app: adminApp 
        };

    } catch (error: any) {
        console.error("Firebase Admin Initialization Error:", error);
        throw new Error(`Failed to initialize Firebase Admin SDK. Please check your FIREBASE_SERVICE_ACCOUNT environment variable. Original error: ${error.message}`);
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
