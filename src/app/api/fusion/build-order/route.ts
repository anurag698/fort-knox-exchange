import { NextResponse } from 'next/server';
import { fusionPlusService } from '@/lib/1inch/fusion-plus.service';

/**
 * POST /api/fusion/build-order
 * Build a Fusion+ order from quote data
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate required fields
        const required = ['quoteId', 'fromTokenAddress', 'toTokenAddress', 'amount', 'fromChain', 'toChain', 'walletAddress'];
        const missing = required.filter(field => !body[field]);

        if (missing.length > 0) {
            return NextResponse.json(
                { error: `Missing required fields: ${missing.join(', ')}` },
                { status: 400 }
            );
        }

        const orderData = await fusionPlusService.buildOrder(body);

        return NextResponse.json(orderData);
    } catch (error) {
        console.error('Fusion+ build order error:', error);
        return NextResponse.json(
            { error: 'Failed to build Fusion+ order', message: (error as Error).message },
            { status: 500 }
        );
    }
}
