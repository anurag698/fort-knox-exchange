// Admin API: Scan for Deposits
// Triggers blockchain monitoring for all active deposit addresses
// Should be called via cron job every 30-60 seconds

import { NextResponse } from 'next/server';
import { ETHMonitor } from '@/services/deposits/eth-monitor';
import { BTCMonitor } from '@/services/deposits/btc-monitor';
import { queryItems } from '@/lib/azure/cosmos';

export async function POST(req: Request) {
    try {
        // TODO: Add admin authentication
        // const auth = req.headers.get('x-admin-key');
        // if (auth !== process.env.ADMIN_API_KEY) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const { chain } = await req.json().catch(() => ({ chain: 'ETH' }));

        console.log(`[Deposit Scanner] Starting scan for chain: ${chain}`);

        let scanResults = {
            chain,
            addressesScanned: 0,
            depositsDetected: 0,
            errors: [] as string[],
            timestamp: new Date().toISOString(),
        };

        if (chain === 'ETH') {
            scanResults = await scanETHDeposits();
        } else if (chain === 'MATIC') {
            scanResults = await scanMATICDeposits();
        } else if (chain === 'BSC') {
            scanResults = await scanBSCDeposits();
        } else if (chain === 'BTC') {
            scanResults = await scanBTCDeposits();
        } else {
            return NextResponse.json({ error: 'Invalid chain' }, { status: 400 });
        }

        console.log(`[Deposit Scanner] Scan complete:`, scanResults);

        return NextResponse.json({
            success: true,
            ...scanResults,
        });
    } catch (error: any) {
        console.error('[Deposit Scanner] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Scan all ETH deposit addresses for incoming deposits
 */
async function scanETHDeposits() {
    const results = {
        chain: 'ETH' as const,
        addressesScanned: 0,
        depositsDetected: 0,
        errors: [] as string[],
        timestamp: new Date().toISOString(),
    };

    try {
        // Get all active deposit addresses for ETH
        const depositAddresses = await queryItems<any>(
            'deposit_addresses',
            'SELECT * FROM c WHERE c.chain = @chain AND c.status = @status',
            [
                { name: '@chain', value: 'ETH' },
                { name: '@status', value: 'active' },
            ]
        );

        console.log(`[ETH Scanner] Found ${depositAddresses.length} active ETH deposit addresses`);

        // Initialize ETH monitor
        const monitor = new ETHMonitor({
            rpcUrl: process.env.ETHEREUM_RPC_URL || '',
            requiredConfirmations: parseInt(process.env.ETH_REQUIRED_CONFIRMATIONS || '12'),
            chainName: 'ETH',
        });

        // Scan each address
        for (const addressDoc of depositAddresses) {
            try {
                const deposits = await monitor.monitorAddress(
                    addressDoc.address,
                    addressDoc.userId // Changed from user_id
                );

                results.addressesScanned++;
                results.depositsDetected += deposits.length;

                if (deposits.length > 0) {
                    console.log(`[ETH Scanner] Found ${deposits.length} deposits for ${addressDoc.address}`);
                }
            } catch (error: any) {
                console.error(`[ETH Scanner] Error scanning ${addressDoc.address}:`, error.message);
                results.errors.push(`${addressDoc.address}: ${error.message}`);
            }
        }

        return results;
    } catch (error: any) {
        console.error('[ETH Scanner] Fatal error:', error);
        results.errors.push(`Fatal: ${error.message}`);
        return results;
    }
}

/**
 * Scan all MATIC deposit addresses
 */
async function scanMATICDeposits() {
    const results = {
        chain: 'MATIC' as const,
        addressesScanned: 0,
        depositsDetected: 0,
        errors: [] as string[],
        timestamp: new Date().toISOString(),
    };

    try {
        const depositAddresses = await queryItems<any>(
            'deposit_addresses',
            'SELECT * FROM c WHERE c.chain = @chain AND c.status = @status',
            [
                { name: '@chain', value: 'MATIC' },
                { name: '@status', value: 'active' },
            ]
        );

        console.log(`[MATIC Scanner] Found ${depositAddresses.length} active MATIC deposit addresses`);

        const monitor = new ETHMonitor({
            rpcUrl: process.env.POLYGON_RPC_URL || '',
            requiredConfirmations: parseInt(process.env.MATIC_REQUIRED_CONFIRMATIONS || '128'),
            chainName: 'MATIC',
        });

        for (const addressDoc of depositAddresses) {
            try {
                const deposits = await monitor.monitorAddress(
                    addressDoc.address,
                    addressDoc.userId // Changed from user_id
                );

                results.addressesScanned++;
                results.depositsDetected += deposits.length;

                if (deposits.length > 0) {
                    console.log(`[MATIC Scanner] Found ${deposits.length} deposits for ${addressDoc.address}`);
                }
            } catch (error: any) {
                console.error(`[MATIC Scanner] Error scanning ${addressDoc.address}:`, error.message);
                results.errors.push(`${addressDoc.address}: ${error.message}`);
            }
        }

        return results;
    } catch (error: any) {
        console.error('[MATIC Scanner] Fatal error:', error);
        results.errors.push(`Fatal: ${error.message}`);
        return results;
    }
}

/**
 * Scan all BSC deposit addresses
 */
async function scanBSCDeposits() {
    const results = {
        chain: 'BSC' as const,
        addressesScanned: 0,
        depositsDetected: 0,
        errors: [] as string[],
        timestamp: new Date().toISOString(),
    };

    try {
        const depositAddresses = await queryItems<any>(
            'deposit_addresses',
            'SELECT * FROM c WHERE c.chain = @chain AND c.status = @status',
            [
                { name: '@chain', value: 'BSC' },
                { name: '@status', value: 'active' },
            ]
        );

        console.log(`[BSC Scanner] Found ${depositAddresses.length} active BSC deposit addresses`);

        const monitor = new ETHMonitor({
            rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
            requiredConfirmations: parseInt(process.env.BSC_REQUIRED_CONFIRMATIONS || '15'),
            chainName: 'BSC',
        });

        for (const addressDoc of depositAddresses) {
            try {
                const deposits = await monitor.monitorAddress(
                    addressDoc.address,
                    addressDoc.userId
                );

                results.addressesScanned++;
                results.depositsDetected += deposits.length;

                if (deposits.length > 0) {
                    console.log(`[BSC Scanner] Found ${deposits.length} deposits for ${addressDoc.address}`);
                }
            } catch (error: any) {
                console.error(`[BSC Scanner] Error scanning ${addressDoc.address}:`, error.message);
                results.errors.push(`${addressDoc.address}: ${error.message}`);
            }
        }

        return results;
    } catch (error: any) {
        console.error('[BSC Scanner] Fatal error:', error);
        results.errors.push(`Fatal: ${error.message}`);
        return results;
    }
}

/**
 * Scan all BTC deposit addresses
 */
async function scanBTCDeposits() {
    const results = {
        chain: 'BTC' as const,
        addressesScanned: 0,
        depositsDetected: 0,
        errors: [] as string[],
        timestamp: new Date().toISOString(),
    };

    try {
        const depositAddresses = await queryItems<any>(
            'deposit_addresses',
            'SELECT * FROM c WHERE c.chain = @chain AND c.status = @status',
            [
                { name: '@chain', value: 'BTC' },
                { name: '@status', value: 'active' },
            ]
        );

        console.log(`[BTC Scanner] Found ${depositAddresses.length} active BTC deposit addresses`);

        const monitor = new BTCMonitor({
            rpcUrl: process.env.BTC_API_URL || 'https://blockstream.info/api',
            requiredConfirmations: parseInt(process.env.BTC_REQUIRED_CONFIRMATIONS || '3'),
            chainName: 'BTC',
        });

        for (const addressDoc of depositAddresses) {
            try {
                const deposits = await monitor.monitorAddress(
                    addressDoc.address,
                    addressDoc.userId
                );

                results.addressesScanned++;
                results.depositsDetected += deposits.length;

                if (deposits.length > 0) {
                    console.log(`[BTC Scanner] Found ${deposits.length} deposits for ${addressDoc.address}`);
                }
            } catch (error: any) {
                console.error(`[BTC Scanner] Error scanning ${addressDoc.address}:`, error.message);
                results.errors.push(`${addressDoc.address}: ${error.message}`);
            }
        }

        return results;
    } catch (error: any) {
        console.error('[BTC Scanner] Fatal error:', error);
        results.errors.push(`Fatal: ${error.message}`);
        return results;
    }
}
