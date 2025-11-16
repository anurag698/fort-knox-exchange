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
 * @param query The Firestore query to execute. Can be null.
 * @param options An object with an `enabled` flag to conditionally run the hook.
 * @returns An object containing the data, loading state, and any error.
 */
export function useCollection<T extends DocumentData>(
  query: Query<DocumentData> | null,
  options: { enabled: boolean } = { enabled: true }
): UseCollectionResult<T> {
  const { enabled } = options;
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  // The query key is a stable dependency for useEffect.
  const queryKey = useMemoOne(() => getQueryKey(query), [query]);

  useEffect(() => {
    // This is the safety guard. If the query is null or the hook is disabled,
    // we do not proceed. We also reset the state.
    if (!query || !enabled) {
      setData(null);
      setIsLoading(false);
      setError(null);
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
        // This is the critical change: instead of just logging, we now
        // create and emit a detailed, contextual error for the LLM to analyze.
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            // @ts-ignore
            path: (query as any)._query.path.segments.join('/'),
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        
        setError(err); // Still store the original error for the component's use
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, enabled]); // Re-run when the query or the enabled state changes.

  return { data, isLoading, error };
}
