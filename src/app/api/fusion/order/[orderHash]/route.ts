import { NextResponse } from 'next/server';
import { fusionPlusService } from '@/lib/1inch/fusion-plus.service';

/**
 * GET /api/fusion/order/[orderHash]
 * Get Fusion+ order status by hash
 */
export async function GET(
    request: Request,
    { params }: { params: { orderHash: string } }
) {
    try {
        const orderHash = params.orderHash;

        if (!orderHash) {
            return NextResponse.json(
                { error: 'Order hash is required' },
                { status: 400 }
            );
        }

        const order = await fusionPlusService.getOrderByHash(orderHash);

        return NextResponse.json(order);
    } catch (error) {
        console.error('Fusion+ get order error:', error);

        // Check if order not found
        if ((error as Error).message.includes('404')) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to get order status', message: (error as Error).message },
            { status: 500 }
        );
    }
}
