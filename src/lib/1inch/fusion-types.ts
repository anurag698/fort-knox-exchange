// ======================================================
// 1inch Fusion+ Types
// ======================================================

/**
 * Fusion+ Quote Request Parameters
 */
export interface FusionQuoteRequest {
    fromToken: string;        // Token address on source chain
    toToken: string;          // Token address on destination chain
    fromChain: number;        // Source chain ID
    toChain: number;          // Destination chain ID
    amount: string;           // Amount in wei
    walletAddress?: string;   // User wallet address
    enableEstimate?: boolean; // Enable gas estimation
}

/**
 * Fusion+ Quote Response
 */
export interface FusionQuoteResponse {
    quoteId: string;
    fromToken: TokenInfo;
    toToken: TokenInfo;
    fromChain: number;
    toChain: number;
    fromAmount: string;
    toAmount: string;
    gas: number;
    gasPrice?: string;
    protocols?: Protocol[][];
    estimatedGas?: string;
    prices?: TokenPrices;
}

/**
 * Token Information
 */
export interface TokenInfo {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
    tags?: string[];
}

/**
 * Protocol information for the swap route
 */
export interface Protocol {
    name: string;
    part: number;
    fromTokenAddress: string;
    toTokenAddress: string;
}

/**
 * Token prices
 */
export interface TokenPrices {
    [tokenAddress: string]: string;
}

/**
 * Fusion+ Build Order Request
 */
export interface FusionBuildOrderRequest {
    quoteId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    fromChain: number;
    toChain: number;
    walletAddress: string;
    receiver?: string;
    permit?: string;
    customPreset?: CustomPreset;
}

/**
 * Custom preset for order configuration
 */
export interface CustomPreset {
    auctionDuration?: number;
    startAuctionIn?: number;
    bankFee?: string;
    initialRateBump?: number;
    points?: AuctionPoint[];
    exclusiveResolver?: string;
    allowMultipleFills?: boolean;
}

/**
 * Auction point for Dutch auction curve
 */
export interface AuctionPoint {
    delay: number;
    coefficient: number;
}

/**
 * Fusion+ Build Order Response
 */
export interface FusionBuildOrderResponse {
    order: FusionOrder;
    quoteId: string;
    orderHash: string;
}

/**
 * Fusion+ Order structure
 */
export interface FusionOrder {
    maker: string;
    makerAsset: string;
    makingAmount: string;
    taker: string;
    takerAsset: string;
    takingAmount: string;
    salt: string;
    receiver: string;
    makingAmountData: string;
    takingAmountData: string;
    makerAssetData: string;
    takerAssetData: string;
    getMakerAmount: string;
    getTakerAmount: string;
    predicate: string;
    permit: string;
    interaction: string;
}

/**
 * Signed Fusion+ Order (ready for submission)
 */
export interface SignedFusionOrder {
    order: FusionOrder;
    signature: string;
    quoteId: string;
    extension?: string;
}

/**
 * Submit Order Response
 */
export interface SubmitOrderResponse {
    orderHash: string;
    status: FusionOrderStatus;
    createdAt: string;
}

/**
 * Order Status enum
 */
export enum FusionOrderStatus {
    Pending = 'pending',
    Announced = 'announced',
    Deposited = 'deposited',
    Withdrawn = 'withdrawn',
    Filled = 'filled',
    Cancelled = 'cancelled',
    Expired = 'expired',
    Failed = 'failed',
}

/**
 * Get Order Response
 */
export interface GetOrderResponse {
    orderHash: string;
    order: FusionOrder;
    signature: string;
    status: FusionOrderStatus;
    createdAt: string;
    updatedAt: string;
    fills?: OrderFill[];
    cancels?: OrderCancel[];
    sourceChain: number;
    destinationChain: number;
    fromToken: string;
    toToken: string;
    makingAmount: string;
    takingAmount: string;
    maker: string;
    taker?: string;
    auctionStartTime?: string;
    auctionEndTime?: string;
}

/**
 * Order Fill information
 */
export interface OrderFill {
    txHash: string;
    filledMakingAmount: string;
    filledTakingAmount: string;
    timestamp: string;
}

/**
 * Order Cancellation information
 */
export interface OrderCancel {
    txHash: string;
    timestamp: string;
    reason: string;
}

/**
 * Get Orders by Maker Response
 */
export interface GetOrdersByMakerResponse {
    orders: GetOrderResponse[];
    meta: {
        page: number;
        limit: number;
        totalCount: number;
        hasMore: boolean;
    };
}

/**
 * Active Orders Response
 */
export interface ActiveOrdersResponse {
    activeOrders: {
        fromChain: number;
        toChain: number;
        count: number;
    }[];
    total: number;
}

/**
 * Secret submission request (for escrow unlocking)
 */
export interface SubmitSecretRequest {
    orderHash: string;
    secret: string;
    secretHash?: string;
}

/**
 * Secret submission response
 */
export interface SubmitSecretResponse {
    success: boolean;
    orderHash: string;
    message?: string;
}

/**
 * Cancelable Orders Response
 */
export interface CancelableOrdersResponse {
    orders: string[]; // Array of order hashes
    count: number;
}

/**
 * Error response from Fusion+ API
 */
export interface FusionErrorResponse {
    error: string;
    description?: string;
    statusCode: number;
    meta?: any;
}

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}
