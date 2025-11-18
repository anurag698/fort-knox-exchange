import { NextResponse } from 'next/server';
import { getUserTradeFills } from '@/server/db/orders';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

async function getAuthenticatedUserId() {
    const { auth } = getFirebaseAdmin();
    try {
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
    const data = await getUserTradeFills(userId);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Fills load error', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
