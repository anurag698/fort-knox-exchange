'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, type Query, type DocumentData } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMemoOne } from 'use-memo-one';

export interface UseCollectionResult<T> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
}

// Helper to create a stable key from a query object
const getQueryKey = (q: Query | null): string => {
  if (!q) return 'null';
  // @ts-ignore The _query property is not part of the public API, but it's the most reliable way to get a stable key
  const { path, an, cn } = q._query;
  return JSON.stringify({
    path: path.segments.join('/'),
    an, // where clauses
    cn, // orderBy clauses
  });
};


/**
 * A hook to fetch and listen to a Firestore collection in real-time.
 * @param query The Firestore query to execute.
 * @returns An object containing the data, loading state, and any error.
 */
export function useCollection<T extends DocumentData>(
  query: Query<DocumentData> | null
): UseCollectionResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // The query key is a stable dependency for useEffect.
  const queryKey = useMemoOne(() => getQueryKey(query), [query]);

  useEffect(() => {
    if (!query) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const result: T[] = snapshot.docs.map(doc => ({
          ...doc.data() as T,
          id: doc.id,
        }));
        setData(result);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error("useCollection error:", err);
        setError(err);
        const permissionError = new FirestorePermissionError({
          // @ts-ignore
          path: (query as any)._query.path.segments.join('/'),
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]); // Use the stable query key as the dependency

  return { data, isLoading, error };
}
