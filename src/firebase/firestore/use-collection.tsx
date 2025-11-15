
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
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
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>))  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const collectionPath = (memoizedTargetRefOrQuery as any)?._query?.path?.canonicalString();
  console.log(`useCollection (${collectionPath}): Hook initiated.`);


  const [data, setData] = useState<StateDataType>(null);
  // Initialize isLoading based on whether the query is ready
  const [isLoading, setIsLoading] = useState<boolean>(!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // If the query is not ready, set loading to true and wait.
    if (!memoizedTargetRefOrQuery) {
      console.log(`useCollection (${collectionPath}): Query is not ready. Setting loading to true.`);
      setIsLoading(true);
      setData(null);
      setError(null);
      return;
    }

    // When the query is ready, attach the listener.
    console.log(`useCollection (${collectionPath}): Query is ready. Attaching onSnapshot listener.`);
    setIsLoading(true);
    
    const unsubscribe = onSnapshot(
        memoizedTargetRefOrQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
            console.log(`useCollection (${collectionPath}): onSnapshot fired with ${snapshot.docs.length} documents.`);
            const results: ResultItemType[] = snapshot.docs.map(doc => ({
                ...(doc.data() as T),
                id: doc.id,
            }));
            setData(results);
            setError(null);
            setIsLoading(false);
            console.log(`useCollection (${collectionPath}): State updated with new data.`, results);
        },
        (err: FirestoreError) => {
            const path = (memoizedTargetRefOrQuery as any)?._query?.path?.canonicalString() || 'unknown';
            console.error(`useCollection (${collectionPath}): Firestore Error on path: ${path}`, err);
            const contextualError = new FirestorePermissionError({
                operation: 'list',
                path: path,
            });

            setError(contextualError);
            setData(null);
            setIsLoading(false);
            errorEmitter.emit('permission-error', contextualError);
        }
    );

    // Cleanup function
    return () => {
        console.log(`useCollection (${collectionPath}): Unsubscribing from onSnapshot listener.`);
        unsubscribe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedTargetRefOrQuery]); // Re-run effect if the memoized query reference changes

  return { data, isLoading, error };
}
