
'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getFirebaseClient } from '@/firebase/client-init';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Use the robust singleton initializer.
  // This function ensures Firebase is only initialized once per client session.
  const { firebaseApp, auth, firestore } = getFirebaseClient();

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
