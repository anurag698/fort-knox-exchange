'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

/**
 * A client-side hook to protect a page from unauthenticated access.
 * It checks the user's authentication status and redirects to a specified
 * path if they are not logged in.
 *
 * @param redirectTo The path to redirect to if the user is not authenticated. Defaults to '/auth'.
 */
export function useAuthGate(redirectTo: string = '/auth') {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until the initial auth check is complete.
    if (isUserLoading) {
      return;
    }

    // If the check is done and there's no user, redirect.
    if (!user) {
      router.push(redirectTo);
    }
  }, [user, isUserLoading, router, redirectTo]);
}
