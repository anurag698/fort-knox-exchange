import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { collectionGroup, query, where, orderBy, getDocs } from 'firebase/firestore';

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
