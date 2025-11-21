// ======================================================
// Fusion+ Order Routing Integration
// ======================================================

import { fusionPlusService } from './fusion-plus.service';
import type {
    FusionQuoteRequest,
    SignedFusionOrder,
    GetOrderResponse,
} from './fusion-types';
import { upsertItem } from '../azure/cosmos';

/**
 * Order routing result
 */
export interface RoutingResult {
    success: boolean;
    orderHash?: string;
    error?: string;
    quote?: any;
    internalOrderId?: string;
}

/**
 * Track Fusion+ order in database
 */
export interface FusionOrderTracking {
    id: string;
    orderHash: string;
    internalOrderId: string;
    userId: string;
    fromToken: string;
    toToken: string;
    fromChain: number;
    toChain: number;
    amount: string;
    expectedOutput: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    txHash?: string;
}

/**
 * Sign order function type (to be implemented by your wallet service)
 */
export type SignOrderFunction = (
    order: any,
    userAddress: string,
    quoteId: string
) => Promise<string>;

/**
 * High-level Fusion+ integration for order routing
 */
export class FusionOrderRouter {

    /**
     * Route order through Fusion+ when no internal match found
     */
    async routeOrderThroughFusion(params: {
        userId: string;
        internalOrderId: string;
        fromToken: string;
        toToken: string;
        fromChain: number;
        toChain: number;
        amount: string;
        walletAddress: string;
        signOrder: SignOrderFunction;
    }): Promise<RoutingResult> {
        try {
            console.log(`🔄 Routing order ${params.internalOrderId} through Fusion+`);

            // Step 1: Get quote
            const quoteRequest: FusionQuoteRequest = {
                fromToken: params.fromToken,
                toToken: params.toToken,
                fromChain: params.fromChain,
                toChain: params.toChain,
                amount: params.amount,
                walletAddress: params.walletAddress,
                enableEstimate: true,
            };

            const quote = await fusionPlusService.getQuote(quoteRequest);
            console.log(`✅ Got Fusion+ quote: ${quote.toAmount} ${quote.toToken.symbol}`);

            // Step 2: Build order
            const orderRequest = {
                quoteId: quote.quoteId,
                fromTokenAddress: params.fromToken,
                toTokenAddress: params.toToken,
                amount: params.amount,
                fromChain: params.fromChain,
                toChain: params.toChain,
                walletAddress: params.walletAddress,
            };

            const builtOrder = await fusionPlusService.buildOrder(orderRequest);
            console.log(`✅ Built Fusion+ order: ${builtOrder.orderHash}`);

            // Step 3: Sign order
            const signature = await params.signOrder(
                builtOrder.order,
                params.walletAddress,
                quote.quoteId
            );

            const signedOrder: SignedFusionOrder = {
                order: builtOrder.order,
                signature,
                quoteId: quote.quoteId,
            };

            // Step 4: Submit order
            const submitResult = await fusionPlusService.submitOrder(signedOrder);
            console.log(`✅ Submitted Fusion+ order: ${submitResult.orderHash}`);

            // Step 5: Store tracking information
            await this.trackFusionOrder({
                id: `fusion_${submitResult.orderHash}`,
                orderHash: submitResult.orderHash,
                internalOrderId: params.internalOrderId,
                userId: params.userId,
                fromToken: params.fromToken,
                toToken: params.toToken,
                fromChain: params.fromChain,
                toChain: params.toChain,
                amount: params.amount,
                expectedOutput: quote.toAmount,
                status: submitResult.status,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            return {
                success: true,
                orderHash: submitResult.orderHash,
                quote,
                internalOrderId: params.internalOrderId,
            };

        } catch (error) {
            console.error('❌ Fusion+ order routing failed:', error);
            return {
                success: false,
                error: (error as Error).message,
                internalOrderId: params.internalOrderId,
            };
        }
    }

    /**
     * Monitor order completion and update database
     */
    async monitorAndUpdateOrder(
        orderHash: string,
        onComplete?: (order: GetOrderResponse) => void
    ): Promise<GetOrderResponse> {
        try {
            const finalOrder = await fusionPlusService.waitForOrderCompletion(orderHash);

            // Update tracking in database
            const tracking = await this.getFusionOrderTracking(orderHash);
            if (tracking) {
                await this.updateFusionOrderTracking(orderHash, {
                    status: finalOrder.status,
                    completedAt: new Date().toISOString(),
                    txHash: finalOrder.fills?.[0]?.txHash,
                });
            }

            if (onComplete) {
                onComplete(finalOrder);
            }

            return finalOrder;

        } catch (error) {
            console.error(`Failed to monitor order ${orderHash}:`, error);
            throw error;
        }
    }

    /**
     * Store Fusion+ order tracking
     */
    public async trackFusionOrder(tracking: FusionOrderTracking): Promise<void> {
        await upsertItem('fusion_orders', tracking);
    }

    /**
     * Get Fusion+ order tracking
     */
    private async getFusionOrderTracking(orderHash: string): Promise<FusionOrderTracking | null> {
        const { queryItems } = await import('../azure/cosmos');
        const query = 'SELECT * FROM c WHERE c.orderHash = @orderHash';
        const parameters = [{ name: '@orderHash', value: orderHash }];

        const results = await queryItems<FusionOrderTracking>('fusion_orders', query, parameters);
        return results[0] || null;
    }

    /**
     * Update Fusion+ order tracking
     */
    private async updateFusionOrderTracking(
        orderHash: string,
        updates: Partial<FusionOrderTracking>
    ): Promise<void> {
        const tracking = await this.getFusionOrderTracking(orderHash);
        if (tracking) {
            await upsertItem('fusion_orders', {
                ...tracking,
                ...updates,
                updatedAt: new Date().toISOString(),
            });
        }
    }

    /**
     * Get all Fusion+ orders for a user
     */
    async getUserFusionOrders(userId: string): Promise<FusionOrderTracking[]> {
        const { queryItems } = await import('../azure/cosmos');
        const query = 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC';
        const parameters = [{ name: '@userId', value: userId }];

        return queryItems<FusionOrderTracking>('fusion_orders', query, parameters);
    }

    /**
     * Batch check order statuses for a user
     */
    async batchUpdateOrderStatuses(userId: string): Promise<void> {
        const orders = await this.getUserFusionOrders(userId);
        const pendingOrders = orders.filter(o =>
            !['filled', 'cancelled', 'expired', 'failed'].includes(o.status.toLowerCase())
        );

        if (pendingOrders.length === 0) return;

        const orderHashes = pendingOrders.map(o => o.orderHash);
        const statuses = await fusionPlusService.getOrdersByHashes(orderHashes);

        for (const status of statuses) {
            await this.updateFusionOrderTracking(status.orderHash, {
                status: status.status,
                ...(status.fills?.[0] && { txHash: status.fills[0].txHash }),
                ...(status.status.toLowerCase() === 'filled' && { completedAt: new Date().toISOString() }),
            });
        }
    }
}

// Singleton instance
export const fusionOrderRouter = new FusionOrderRouter();
