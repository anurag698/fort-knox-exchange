
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemoFirebase to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {Query<DocumentData> | null | undefined} memoizedTargetRefOrQuery -
 * The Firestore Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: Query<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // If the query is not ready, set loading to true and clear data/error.
    // The hook will re-run when the query becomes available.
    if (!memoizedTargetRefOrQuery) {
      setIsLoading(true);
      setData(null);
      setError(null);
      return;
    }
    
    // Start loading and clear previous errors when a new query is provided.
    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
        memoizedTargetRefOrQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
            const results: ResultItemType[] = snapshot.docs.map(doc => ({
                ...(doc.data() as T),
                id: doc.id,
            }));
            setData(results);
            setError(null); 
            setIsLoading(false);
        },
        (err: FirestoreError) => {
            const path = (memoizedTargetRefOrQuery as any)?._query?.path?.canonicalString() || 'unknown path';
            const contextualError = new FirestorePermissionError({
                operation: 'list',
                path: path,
            });

            console.error("useCollection error:", contextualError.message);
            setError(contextualError);
            setData(null);
            setIsLoading(false);
            errorEmitter.emit('permission-error', contextualError);
        }
    );

    // Cleanup function to unsubscribe from the listener when the component unmounts or the query changes.
    return () => {
        unsubscribe();
    }
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
