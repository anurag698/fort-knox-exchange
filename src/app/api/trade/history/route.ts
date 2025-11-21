import { NextResponse } from 'next/server';
import { getUserTradesHistory } from '@/server/db/orders';

// Simple helper to get userId from request query params
async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  return searchParams.get('userId');
}

export async function GET(req: Request) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - userId required' }, { status: 401 });
    }
    const data = await getUserTradesHistory(userId);
    return NextResponse.json(data);
  } catch (err) {
    console.error('History load error', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
