
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

// Securely get the Firebase Admin SDK instance
export function getFirebaseAdmin() {
    if (adminApp) {
        return { firestore: getFirestore(adminApp), auth: getAuth(adminApp), app: adminApp };
    }
    
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }
     
    // Use a consistent app name
    const appName = 'firebase-admin-app-singleton';
    
    if (!getApps().some(existingApp => existingApp.name === appName)) {
        try {
            adminApp = initializeApp({
                credential: {
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    clientEmail: JSON.parse(serviceAccount).client_email,
                    privateKey: JSON.parse(serviceAccount).private_key.replace(/\\n/g, '\n'),
                },
            }, appName);
        } catch (e: any) {
             console.error("Firebase Admin SDK Initialization Error:", e.message);
             // Re-throw or handle as needed
             throw new Error("Failed to initialize Firebase Admin SDK.");
        }
    } else {
        adminApp = getApp(appName);
    }
    
    return { firestore: getFirestore(adminApp), auth: getAuth(adminApp), app: adminApp };
}
