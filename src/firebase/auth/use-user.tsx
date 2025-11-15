
'use client';
import { useFirebase, type UserHookResult } from '@/firebase/provider';
import { useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';


/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * It also handles the creation of the user document in Firestore on first sign-in.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError, firestore } = useFirebase();

  useEffect(() => {
    if (isUserLoading || !user || !firestore) {
      return;
    }

    const createUserDocument = async () => {
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log(`User document for ${user.uid} does not exist. Creating...`);
        try {
           const batch = writeBatch(firestore);
           const newUser = {
                id: user.uid,
                email: user.email,
                username: user.email?.split('@')[0] ?? `user_${Math.random().toString(36).substring(2, 8)}`,
                kycStatus: 'NOT_STARTED',
                referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isAdmin: user.email === 'admin@fortknox.exchange'
            };
            batch.set(userRef, newUser);

            const balancesRef = collection(firestore, 'users', user.uid, 'balances');
            const usdtBalanceRef = doc(balancesRef, 'USDT');
            batch.set(usdtBalanceRef, {
                id: usdtBalanceRef.id,
                userId: user.uid,
                assetId: 'USDT',
                available: 100000,
                locked: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            const btcBalanceRef = doc(balancesRef, 'BTC');
            batch.set(btcBalanceRef, {
                id: btcBalanceRef.id,
                userId: user.uid,
                assetId: 'BTC',
                available: 1,
                locked: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
             const ethBalanceRef = doc(balancesRef, 'ETH');
            batch.set(ethBalanceRef, {
                id: ethBalanceRef.id,
                userId: user.uid,
                assetId: 'ETH',
                available: 10,
                locked: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            const dogeBalanceRef = doc(balancesRef, 'DOGE');
            batch.set(dogeBalanceRef, {
                id: dogeBalanceRef.id,
                userId: user.uid,
                assetId: 'DOGE',
                available: 50000,
                locked: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            const maticBalanceRef = doc(balancesRef, 'MATIC');
            batch.set(maticBalanceRef, {
                id: maticBalanceRef.id,
                userId: user.uid,
                assetId: 'MATIC',
                available: 2000,
                locked: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            
            await batch.commit();
          console.log(`Successfully created user document and seeded balances for ${user.uid}`);
        } catch (error) {
          console.error("Error creating user document or seeding balances:", error);
        }
      }
    };

    createUserDocument();
  }, [user, isUserLoading, firestore]);


  return { user, isUserLoading, userError };
};
