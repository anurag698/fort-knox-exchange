import { NextResponse } from 'next/server';
import { deleteItem } from '@/lib/azure/cosmos';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { userId, assetId } = await req.json();
        if (!userId || !assetId) {
            return NextResponse.json({ error: 'userId and assetId required' }, { status: 400 });
        }
        const balanceId = `balance-${userId}-${assetId}`;
        await deleteItem('balances', balanceId, userId);
        return NextResponse.json({ success: true, message: `Deleted ${assetId} balance for user ${userId}` });
    } catch (err: any) {
        console.error('[DELETE BALANCE]', err);
        return NextResponse.json({ error: err.message || 'Failed to delete balance' }, { status: 500 });
    }
}
