// Token Trading Validation Utilities
// Prevents price inversion and network fee calculation errors across all token pairs

import { getTokenDecimals } from '@/config/trading-config';
import { ethers } from 'ethers';

/**
 * Validates and normalizes a swap price to ensure correct direction
 * Price should always be: Quote Currency / Base Currency (e.g., USDT/BTC)
 * 
 * @param fromToken - Source token symbol
 * @param toToken - Destination token symbol
 * @param fromAmount - Amount in wei (source)
 * @param toAmount - Amount in wei (destination)
 * @returns Normalized price in human-readable units
 */
export function calculateSwapPrice(
    fromToken: string,
    toToken: string,
    fromAmount: string,
    toAmount: string
): number {
    const fromDecimals = getTokenDecimals(fromToken);
    const toDecimals = getTokenDecimals(toToken);

    const fromValue = parseFloat(ethers.formatUnits(fromAmount, fromDecimals));
    const toValue = parseFloat(ethers.formatUnits(toAmount, toDecimals));

    if (fromValue === 0 || toValue === 0) {
        throw new Error('Invalid swap amounts: cannot calculate price with zero values');
    }

    // Price = Input / Output (always gives you the exchange rate)
    // For BUY USDT->BTC: price = USDT/BTC (e.g., 87000 USDT per 1 BTC)
    // For SELL BTC->USDT: price = BTC/USDT (e.g., 0.0000115 BTC per 1 USDT, inverted)
    return fromValue / toValue;
}

/**
 * Converts network fee from native token to target token
 * 
 * @param networkFeeWei - Fee in wei (native token like POL)
 * @param targetToken - Token to convert fee to
 * @param swapPrice - Current swap price (fromToken/toToken)
 * @param fromToken - Source token in the swap
 * @param nativeTokenPrice - Price of native token in USD (default 0.6 for POL)
 * @returns Fee amount in target token units
 */
export function convertNetworkFee(
    networkFeeWei: string,
    targetToken: string,
    swapPrice: number,
    fromToken: string,
    nativeTokenPrice: number = 0.6 // POL price in USD
): number {
    // Convert fee from wei to token units
    const feeNative = parseFloat(ethers.formatUnits(networkFeeWei, 18)); // POL has 18 decimals
    const feeUsd = feeNative * nativeTokenPrice;

    // If target is a stablecoin (USDT/USDC), fee is already in USD equivalent
    if (targetToken === 'USDT' || targetToken === 'USDC') {
        return feeUsd;
    }

    // If target is the asset we're receiving (e.g., BTC when buying)
    // We need to convert USD fee to BTC equivalent
    // If swap price is USDT/BTC (e.g., 87000), then BTC = USD / price
    if (fromToken === 'USDT' || fromToken === 'USDC') {
        // Buying: price is already USDT/BTC, so BTC = USD / price
        return feeUsd / swapPrice;
    } else {
        // Selling: price is BTC/USDT (inverted), need to get USDT/BTC first
        const normalizedPrice = 1 / swapPrice; // Convert to USDT/BTC
        return feeUsd / normalizedPrice;
    }
}

/**
 * Validates token configuration before trading
 */
export function validateTokenConfig(symbol: string): {
    valid: boolean;
    error?: string;
} {
    try {
        getTokenDecimals(symbol);
        return { valid: true };
    } catch (error: any) {
        return {
            valid: false,
            error: `Token ${symbol} is not properly configured. Please add it to trading-config.ts`,
        };
    }
}

/**
 * Validates a trade before execution
 */
export function validateTrade(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    networkFee?: string;
}): { valid: boolean; error?: string; warnings?: string[] } {
    const warnings: string[] = [];

    // Check token configuration
    const fromValidation = validateTokenConfig(params.fromToken);
    if (!fromValidation.valid) return fromValidation;

    const toValidation = validateTokenConfig(params.toToken);
    if (!toValidation.valid) return toValidation;

    // Calculate price and check for anomalies
    try {
        const price = calculateSwapPrice(
            params.fromToken,
            params.toToken,
            params.fromAmount,
            params.toAmount
        );

        // Warn if price seems inverted (for major pairs)
        if (params.fromToken === 'USDT' && params.toToken === 'BTC') {
            if (price < 1000) {
                warnings.push(
                    `Price ${price} USDT/BTC seems too low. Expected >$50,000. May be inverted.`
                );
            }
        }

        // Warn if network fee is too high relative to trade size
        if (params.networkFee) {
            const toValue = parseFloat(
                ethers.formatUnits(params.toAmount, getTokenDecimals(params.toToken))
            );
            const feeValue = convertNetworkFee(
                params.networkFee,
                params.toToken,
                price,
                params.fromToken
            );

            if (feeValue >= toValue) {
                return {
                    valid: false,
                    error: `Network fee (${feeValue} ${params.toToken}) exceeds trade output (${toValue} ${params.toToken})`,
                };
            }

            if (feeValue > toValue * 0.5) {
                warnings.push(
                    `Network fee is ${((feeValue / toValue) * 100).toFixed(1)}% of trade value`
                );
            }
        }

        return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
    } catch (error: any) {
        return { valid: false, error: error.message };
    }
}
