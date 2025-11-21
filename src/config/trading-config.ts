// Trading Configuration
// Central configuration for all trading parameters including slippage, fees, and chain settings

export const TRADING_CONFIG = {
    // Slippage & Price Protection
    maxSlippagePercent: 1.0,            // Maximum allowed slippage for 1inch swaps
    swapDeadlineMinutes: 20,            // How long before swap expires
    priceImpactWarningPercent: 5.0,     // Warn user if price impact exceeds this

    // Chain Configuration
    chainId: 137,                        // Polygon mainnet (change to 80001 for Mumbai testnet)
    rpcUrl: process.env.POLYGON_RPC_URL,

    // Minimum Order Sizes (prevent dust orders)
    minOrderSize: {
        BTC: 0.0001,   // ~$4 at $40k
        ETH: 0.001,    // ~$2 at $2k
        USDT: 1,       // $1
        USDC: 1,       // $1
        NOMOX: 10,     // Native token
    },

    // Fee Structure
    exchangeFeePercent: 0.1,            // 0.1% trading fee (competitive with CEXs)
    makerFeePercent: 0.05,              // Reduced fee for makers (adds liquidity)
    takerFeePercent: 0.1,               // Standard fee for takers
    gasMarkupPercent: 10,               // Add 10% to estimated gas as buffer

    // Order Execution
    retryAttempts: 3,                   // Retry failed swaps up to 3 times
    retryDelayMs: 2000,                 // Wait 2s between retries
    partialFillMinPercent: 10,          // Minimum 10% fill to accept partial

    // 1inch API
    oneInchApiBase: "https://api.1inch.dev/swap/v6.0",
    oneInchApiKey: process.env.ONE_INCH_API_KEY,

    // Risk Management
    maxOrderSizeUSD: 100000,            // Maximum single order size
    dailyVolumeLimit: 1000000,          // Per-user daily volume limit
    suspiciousVelocityThreshold: 10,    // Flag if >10 orders per minute

    // Orderbook Configuration
    maxPriceLevels: 50,                 // Show top 50 bid/ask levels
    orderbookDepthLevels: 20,           // Default depth for depth chart
    orderExpirationHours: 24,           // Cancel orders after 24h if not filled

    // Supported Token Addresses (Polygon mainnet)
    tokens: {
        USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
        WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        BTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // Map BTC to WBTC
        ETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // Map ETH to WETH
        POL: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // Native POL
        // Add NOMOX and other custom tokens here
    },

    // Token Decimals
    decimals: {
        USDT: 6,
        USDC: 6,
        WETH: 18,
        WBTC: 8,
        WMATIC: 18,
        POL: 18, // Decimals for POL (mapped to WMATIC)
        BTC: 8,   // For display purposes
        ETH: 18,  // For display purposes
    },
} as const;

// Helper to get token address by symbol
export function getTokenAddress(symbol: string): string {
    const address = TRADING_CONFIG.tokens[symbol as keyof typeof TRADING_CONFIG.tokens];
    if (!address) {
        throw new Error(`Token ${symbol} not configured`);
    }
    return address;
}

// Helper to get token decimals
export function getTokenDecimals(symbol: string): number {
    const decimals = TRADING_CONFIG.decimals[symbol as keyof typeof TRADING_CONFIG.decimals];
    if (decimals === undefined) {
        throw new Error(`Decimals for ${symbol} not configured`);
    }
    return decimals;
}

// Check if 1inch is available
export function isOneInchAvailable(): boolean {
    return !!TRADING_CONFIG.oneInchApiKey;
}

// Validate order size
export function validateOrderSize(symbol: string, amount: number): boolean {
    const minSize = TRADING_CONFIG.minOrderSize[symbol as keyof typeof TRADING_CONFIG.minOrderSize];
    if (minSize === undefined) return true; // No minimum configured
    return amount >= minSize;
}
