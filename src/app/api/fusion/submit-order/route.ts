import { NextResponse } from 'next/server';
import { fusionPlusService } from '@/lib/1inch/fusion-plus.service';

/**
 * POST /api/fusion/submit-order
 * Submit a signed Fusion+ order
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { signedOrder, metadata } = body;

        // Validate required fields
        if (!signedOrder || !signedOrder.order || !signedOrder.signature || !signedOrder.quoteId) {
            return NextResponse.json(
                { error: 'Missing required fields: signedOrder object with order, signature, quoteId' },
                { status: 400 }
            );
        }

        const result = await fusionPlusService.submitOrder(signedOrder);

        // Track order if metadata is provided
        if (metadata && metadata.userId) {
            const { fusionOrderRouter } = await import('@/lib/1inch/fusion-router');

            await fusionOrderRouter.trackFusionOrder({
                id: `fusion_${result.orderHash}`,
                orderHash: result.orderHash,
                internalOrderId: metadata.internalOrderId || `web_${Date.now()}`,
                userId: metadata.userId,
                fromToken: metadata.fromToken || signedOrder.order.makerAsset,
                toToken: metadata.toToken || signedOrder.order.takerAsset,
                fromChain: metadata.fromChain || 0,
                toChain: metadata.toChain || 0,
                amount: signedOrder.order.makingAmount,
                expectedOutput: signedOrder.order.takingAmount,
                status: result.status,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }

        return NextResponse.json({
            success: true,
            orderHash: result.orderHash,
            status: result.status,
        });
    } catch (error) {
        console.error('Fusion+ submit order error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to submit Fusion+ order',
                message: (error as Error).message
            },
            { status: 500 }
        );
    }
}
