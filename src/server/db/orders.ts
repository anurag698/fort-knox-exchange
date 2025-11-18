import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { collection, collectionGroup, query, where, orderBy, getDocs } from 'firebase/firestore';

export async function getUserTradesHistory(userId: string) {
  const { firestore } = getFirebaseAdmin();

  // Query the 'orders' subcollection for the given userId
  const q = query(
    collectionGroup(firestore, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function getUserTradeFills(userId: string) {
  const { firestore } = getFirebaseAdmin();

  // In a real app, this might query a global 'fills' or 'trades' collection.
  // For this example, we'll assume fills are stored in a user's subcollection.
  const q = query(
    collection(firestore, 'users', userId, 'fills'),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}
