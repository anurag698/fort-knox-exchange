
'use client';

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, type Query, type DocumentData } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface UseCollectionResult<T> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * A hook to fetch and listen to a Firestore collection in real-time.
 * @param query The Firestore query to execute. Can be null.
 * @param options An object with an `enabled` flag to conditionally run the hook.
 * @returns An object containing the data, loading state, and any error.
 */
export function useCollection<T extends DocumentData>(
  query: Query<DocumentData> | null,
  options: { enabled?: boolean } = { enabled: true }
): UseCollectionResult<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Defensive guards: do NOT subscribe if disabled or no query given
    if (!enabled || !query) {
      setData(null);
      setIsLoading(false);
      setError(null);
      // tear down any previous subscription safely
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (_) {}
        unsubscribeRef.current = null;
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unsub = onSnapshot(
        query,
        (snapshot) => {
          const docs = snapshot.docs.map((d) => ({ id: d.id, ...(d.data ? d.data() : {}) } as T));
          setData(docs);
          setError(null);
          setIsLoading(false);
        },
        (err) => {
          // Do not access query internals here; keep error handling simple and safe.
          setError(err);
          setIsLoading(false);

          if (err?.code === 'permission-denied') {
             try {
                const path = (query && (query as any)._query?.path?.segments)
                ? (query as any)._query.path.segments.join('/')
                : 'unknown-path';

                const permissionError = new FirestorePermissionError({
                    path: path,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);

            } catch (e) {
                console.warn('Could not construct FirestorePermissionError:', e);
            }
          }
        }
      );
      unsubscribeRef.current = unsub;

      return () => {
        try {
          unsub();
        } catch (_) {}
        unsubscribeRef.current = null;
      };
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
    }
  // We are intentionally not including the query object itself in the dependency array.
  // Instead, consumers of this hook should memoize the query object (e.g., with useMemoFirebase).
  // This prevents infinite re-render loops caused by query objects being redefined on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, query]);

  return { data, isLoading, error };
}
