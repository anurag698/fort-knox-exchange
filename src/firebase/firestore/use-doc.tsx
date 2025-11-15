'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface UseDocResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * A hook to fetch and listen to a single Firestore document in real-time.
 * @param docRef The Firestore DocumentReference to fetch.
 * @returns An object containing the data, loading state, and any error.
 */
export function useDoc<T extends DocumentData>(
  docRef: DocumentReference<DocumentData> | null
): UseDocResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // The document path is a stable dependency for useEffect.
  const docPath = docRef ? docRef.path : 'null';

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ ...snapshot.data() as T, id: snapshot.id });
        } else {
          setData(null); // Document does not exist
        }
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error("useDoc error:", err);
        setError(err);
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docPath]); // Use the stable document path as the dependency

  return { data, isLoading, error };
}
