// ======================================================
// 1inch Fusion+ Service - Production Ready
// ======================================================

import { oneInchConfig } from '../dex/one-inch.config';
import type {
    FusionQuoteRequest,
    FusionQuoteResponse,
    FusionBuildOrderRequest,
    FusionBuildOrderResponse,
    SignedFusionOrder,
    SubmitOrderResponse,
    GetOrderResponse,
    GetOrdersByMakerResponse,
    ActiveOrdersResponse,
    CancelableOrdersResponse,
    SubmitSecretRequest,
    SubmitSecretResponse,
    RetryConfig,
} from './fusion-types';

/**
 * Production-ready Fusion+ Service with retry logic and comprehensive error handling
 */
export class FusionPlusService {
    private readonly client = oneInchConfig.getFusionClient();
    private readonly defaultRetryConfig: RetryConfig = {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
    };

    /**
     * Retry wrapper with exponential backoff
     */
    private async retry<T>(
        fn: () => Promise<T>,
        config: Partial<RetryConfig> = {}
    ): Promise<T> {
        const retryConfig = { ...this.defaultRetryConfig, ...config };
        let lastError: Error;
        let delay = retryConfig.initialDelayMs;

        for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;

                // Don't retry on client errors (4xx)
                if (error instanceof Error && error.message.includes('400')) {
                    throw error;
                }

                if (attempt < retryConfig.maxRetries) {
                    console.log(`Retry attempt ${attempt + 1}/${retryConfig.maxRetries} after ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelayMs);
                }
            }
        }

        throw lastError!;
    }

    // ==================== QUOTER ENDPOINTS ====================

    /**
     * Get a quote for cross-chain swap
     */
    async getQuote(params: FusionQuoteRequest): Promise<FusionQuoteResponse> {
        return this.retry(async () => {
            const query = new URLSearchParams({
                fromToken: params.fromToken,
                toToken: params.toToken,
                fromChain: params.fromChain.toString(),
                toChain: params.toChain.toString(),
                amount: params.amount,
                ...(params.walletAddress && { walletAddress: params.walletAddress }),
                ...(params.enableEstimate && { enableEstimate: 'true' }),
            });

            const response = await this.client.get<FusionQuoteResponse>(
                `/quoter?${query.toString()}`
            );

            return response.data;
        });
    }

    /**
     * Get quote with custom preset configuration
     */
    async getQuoteWithCustomPreset(
        params: FusionQuoteRequest & { customPreset: any }
    ): Promise<FusionQuoteResponse> {
        return this.retry(async () => {
            const response = await this.client.post<FusionQuoteResponse>(
                `/quoter/custom-preset`,
                {
                    fromToken: params.fromToken,
                    toToken: params.toToken,
                    fromChain: params.fromChain,
                    toChain: params.toChain,
                    amount: params.amount,
                    walletAddress: params.walletAddress,
                    customPreset: params.customPreset,
                }
            );

            return response.data;
        });
    }

    /**
     * Build order from quote
     */
    async buildOrder(request: FusionBuildOrderRequest): Promise<FusionBuildOrderResponse> {
        return this.retry(async () => {
            const response = await this.client.post<FusionBuildOrderResponse>(
                `/quoter/build`,
                request
            );

            return response.data;
        });
    }

    /**
     * Build unsigned transaction for order
     */
    async buildTransaction(orderData: any): Promise<any> {
        return this.retry(async () => {
            const response = await this.client.post(`/quoter/build-tx`, orderData);
            return response.data;
        });
    }

    // ==================== RELAYER ENDPOINTS ====================

    /**
     * Submit a signed cross-chain order
     */
    async submitOrder(signedOrder: SignedFusionOrder): Promise<SubmitOrderResponse> {
        return this.retry(async () => {
            const response = await this.client.post<SubmitOrderResponse>(
                `/relayer/order`,
                signedOrder
            );

            console.log(`✅ Order submitted successfully: ${response.data.orderHash}`);
            return response.data;
        }, { maxRetries: 1 }); // Single retry for submissions
    }

    /**
     * Submit multiple signed orders at once
     */
    async submitOrders(signedOrders: SignedFusionOrder[]): Promise<SubmitOrderResponse[]> {
        return this.retry(async () => {
            const response = await this.client.post<SubmitOrderResponse[]>(
                `/relayer/orders`,
                { orders: signedOrders }
            );

            console.log(`✅ ${signedOrders.length} orders submitted successfully`);
            return response.data;
        }, { maxRetries: 1 });
    }

    /**
     * Submit secret for escrow withdrawal
     */
    async submitSecret(request: SubmitSecretRequest): Promise<SubmitSecretResponse> {
        return this.retry(async () => {
            const response = await this.client.post<SubmitSecretResponse>(
                `/relayer/secret`,
                request
            );

            return response.data;
        });
    }

    // ==================== ORDERS ENDPOINTS ====================

    /**
     * Get active cross-chain orders
     */
    async getActiveOrders(page = 1, limit = 50): Promise<ActiveOrdersResponse> {
        return this.retry(async () => {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            const response = await this.client.get<ActiveOrdersResponse>(
                `/orders/active?${query.toString()}`
            );

            return response.data;
        });
    }

    /**
     * Get orders by maker address
     */
    async getOrdersByMaker(
        makerAddress: string,
        page = 1,
        limit = 50
    ): Promise<GetOrdersByMakerResponse> {
        return this.retry(async () => {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            const response = await this.client.get<GetOrdersByMakerResponse>(
                `/orders/by-maker/${makerAddress}?${query.toString()}`
            );

            return response.data;
        });
    }

    /**
     * Get order by hash
     */
    async getOrderByHash(orderHash: string): Promise<GetOrderResponse> {
        return this.retry(async () => {
            const response = await this.client.get<GetOrderResponse>(
                `/orders/${orderHash}`
            );

            return response.data;
        });
    }

    /**
     * Get multiple orders by hashes
     */
    async getOrdersByHashes(orderHashes: string[]): Promise<GetOrderResponse[]> {
        return this.retry(async () => {
            const response = await this.client.post<GetOrderResponse[]>(
                `/orders/by-hashes`,
                { hashes: orderHashes }
            );

            return response.data;
        });
    }

    /**
     * Get cancelable orders for a maker
     */
    async getCancelableOrders(makerAddress: string): Promise<CancelableOrdersResponse> {
        return this.retry(async () => {
            const query = new URLSearchParams({
                maker: makerAddress,
            });

            const response = await this.client.get<CancelableOrdersResponse>(
                `/orders/cancelable?${query.toString()}`
            );

            return response.data;
        });
    }

    // ==================== MONITORING & UTILITIES ====================

    /**
     * Monitor order status with polling
     */
    async monitorOrder(
        orderHash: string,
        onUpdate: (order: GetOrderResponse) => void,
        options: {
            pollIntervalMs?: number;
            maxPolls?: number;
            stopOnStatus?: string[];
        } = {}
    ): Promise<GetOrderResponse> {
        const {
            pollIntervalMs = 5000,
            maxPolls = 60, // 5 minutes max
            stopOnStatus = ['filled', 'cancelled', 'expired', 'failed'],
        } = options;

        let polls = 0;

        while (polls < maxPolls) {
            try {
                const order = await this.getOrderByHash(orderHash);
                onUpdate(order);

                if (stopOnStatus.includes(order.status.toLowerCase())) {
                    console.log(`Order ${orderHash} reached final status: ${order.status}`);
                    return order;
                }

                polls++;
                if (polls < maxPolls) {
                    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
                }
            } catch (error) {
                console.error(`Error monitoring order ${orderHash}:`, error);
                throw error;
            }
        }

        throw new Error(`Order monitoring timeout after ${maxPolls} polls`);
    }

    /**
     * Wait for order completion
     */
    async waitForOrderCompletion(
        orderHash: string,
        timeoutMs = 300000 // 5 minutes
    ): Promise<GetOrderResponse> {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            this.monitorOrder(
                orderHash,
                (order) => {
                    console.log(`Order ${orderHash} status: ${order.status}`);
                },
                {
                    pollIntervalMs: 5000,
                    maxPolls: Math.ceil(timeoutMs / 5000),
                }
            )
                .then(resolve)
                .catch(reject);

            // Timeout safety
            setTimeout(() => {
                reject(new Error(`Order completion timeout after ${timeoutMs}ms`));
            }, timeoutMs);
        });
    }

    /**
     * Get order statistics for a maker
     */
    async getOrderStats(makerAddress: string): Promise<{
        total: number;
        filled: number;
        pending: number;
        cancelled: number;
        failed: number;
    }> {
        const response = await this.getOrdersByMaker(makerAddress, 1, 1000);

        const stats = {
            total: response.meta.totalCount,
            filled: 0,
            pending: 0,
            cancelled: 0,
            failed: 0,
        };

        response.orders.forEach(order => {
            const status = order.status.toLowerCase();
            if (status === 'filled') stats.filled++;
            else if (status === 'cancelled') stats.cancelled++;
            else if (status === 'failed') stats.failed++;
            else stats.pending++;
        });

        return stats;
    }
}

// Singleton instance
export const fusionPlusService = new FusionPlusService();
