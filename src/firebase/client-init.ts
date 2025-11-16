
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

type FirebaseClientServices = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

// This variable will hold the singleton instance of the Firebase services.
// It's defined outside the function to persist across re-renders.
let firebaseClientServices: FirebaseClientServices | null = null;

/**
 * A robust singleton initializer for Firebase on the client.
 * This function ensures that `initializeApp` is called only once, preventing
 * internal assertion errors related to multiple initializations.
 *
 * @returns The initialized Firebase services (app, auth, firestore).
 */
export function getFirebaseClient(): FirebaseClientServices {
  // If the services have already been initialized, return the existing instance.
  if (firebaseClientServices) {
    return firebaseClientServices;
  }

  // Check if any Firebase app has already been initialized (e.g., by another part of the code).
  if (getApps().length > 0) {
    const app = getApp();
    firebaseClientServices = {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  } else {
    // If no app is initialized, initialize one.
    const app = initializeApp(firebaseConfig);
    firebaseClientServices = {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  }

  return firebaseClientServices;
}
