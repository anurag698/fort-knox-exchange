
'use client';

import { useMemo, type DependencyList } from 'react';

type MemoFirebase<T> = T & { __memo?: boolean };

/**
 * A hook that memoizes Firestore queries and references to prevent re-renders.
 * It's a wrapper around `React.useMemo` that adds a flag to the memoized object,
 * which helps in debugging and ensuring that the object is indeed memoized.
 *
 * @param factory The function that creates the Firestore query or reference.
 * @param deps The dependency array for the `useMemo` hook.
 * @returns The memoized Firestore query or reference.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);

  if (typeof memoized !== 'object' || memoized === null) {
    return memoized;
  }

  (memoized as MemoFirebase<T>).__memo = true;

  return memoized;
}
