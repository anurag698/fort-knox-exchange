
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  doc,
  serverTimestamp,
  CollectionReference,
  DocumentReference,
  SetOptions,
  Firestore,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: data,
      })
    )
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}

/**
 * Checks if a user document exists and creates it if it doesn't.
 * This is an async function but is typically not awaited in the auth flow.
 */
export async function createNewUserDocument(firestore: Firestore, firebaseUser: User) {
    if (!firestore || !firebaseUser) return;

    const userRef = doc(firestore, 'users', firebaseUser.uid);
    try {
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const newUser = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                username: firebaseUser.email?.split('@')[0] ?? `user_${Math.random().toString(36).substring(2, 8)}`,
                kycStatus: 'PENDING',
                referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isAdmin: firebaseUser.email === 'admin@fortknox.exchange'
            };
            // Use a non-blocking write to avoid delaying the auth flow.
            setDocumentNonBlocking(userRef, newUser, {});
        }
    } catch(e) {
      // Intentionally ignore permission errors, as the security rules may prevent reads.
      // The set operation will still be attempted.
    }
}
