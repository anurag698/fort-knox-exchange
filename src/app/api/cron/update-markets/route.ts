import { NextResponse } from 'next/server';
import { marketAggregator } from '@/services/market-aggregator';

export const maxDuration = 60; // Allow 60 seconds for execution (Vercel Pro)
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Optional: Check for CRON_SECRET
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await marketAggregator.updateMarketData();

        return NextResponse.json({
            success: true,
            updated: result.updated,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Cron] Market update failed:', error);
        return NextResponse.json(
            { error: 'Failed to update markets', details: error.message },
            { status: 500 }
        );
    }
}
