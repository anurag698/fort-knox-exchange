// Admin API: Update Confirmations
// Checks pending deposits and updates confirmation counts
// Should be called via cron job every 30-60 seconds

import { NextResponse } from 'next/server';
import { ConfirmationTracker } from '@/services/deposits/confirmation-tracker';

export async function POST(req: Request) {
    try {
        // TODO: Add admin authentication
        // const auth = req.headers.get('x-admin-key');
        // if (auth !== process.env.ADMIN_API_KEY) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        console.log('[Confirmation Tracker] Starting confirmation check');

        const tracker = new ConfirmationTracker();
        const results = await tracker.checkPendingDeposits();

        console.log('[Confirmation Tracker] Check complete:', results);

        return NextResponse.json({
            success: true,
            ...results,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[Confirmation Tracker API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
