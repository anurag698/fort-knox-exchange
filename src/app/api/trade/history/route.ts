import { NextResponse } from 'next/server';
import { getUserTradesHistory } from '@/server/db/orders';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

// This is a mock implementation. In a real scenario, you'd get the user from the session.
async function getAuthenticatedUserId() {
    const { auth } = getFirebaseAdmin();
    try {
        // For demonstration, listing users and picking the first one.
        // In a real app, you'd get the UID from the verified session token.
        const userRecords = await auth.listUsers(1);
        return userRecords.users[0]?.uid || null;
    } catch (error) {
        console.error("Error getting authenticated user:", error);
        return null;
    }
}


export async function GET(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await getUserTradesHistory(userId);
    return NextResponse.json(data);
  } catch (err) {
    console.error('History load error', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
