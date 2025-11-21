#!/usr/bin/env ts-node

/**
 * Deposit Worker - Automated Blockchain Monitor
 * 
 * This worker runs continuously and:
 * 1. Scans all active deposit addresses for new deposits (every 30s)
 * 2. Updates confirmation counts for pending deposits (every 30s)
 * 3. Auto-credits confirmed deposits to user balances
 */

// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';

console.log('Current directory:', process.cwd());
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

console.log('Loading .env.local from:', envLocalPath);
const resultLocal = dotenv.config({ path: envLocalPath, override: true });

if (resultLocal.error) {
    console.warn('Warning: .env.local not found or failed to load');
} else {
    console.log('.env.local loaded successfully');
}

console.log('AZURE_COSMOS_ENDPOINT:', process.env.AZURE_COSMOS_ENDPOINT ? 'SET' : 'NOT SET');


// Configuration
const SCAN_INTERVAL_MS = 30000; // 30 seconds
const CHAINS_TO_MONITOR = ['ETH', 'MATIC', 'BSC', 'BTC']; // All chains enabled!

interface DepositAddressDoc {
    id: string;
    userId: string;
    chain: string;
    address: string;
    index: number;
    status: string;
}

class DepositWorker {
    private isRunning = false;
    private confirmationTracker: any;
    private queryItems: any;
    private ETHMonitor: any;
    private BTCMonitor: any;

    constructor(deps: any) {
        this.confirmationTracker = new deps.ConfirmationTracker();
        this.queryItems = deps.queryItems;
        this.ETHMonitor = deps.ETHMonitor;
        this.BTCMonitor = deps.BTCMonitor;
    }

    /**
     * Start the worker
     */
    async start() {
        if (this.isRunning) {
            console.warn('[Deposit Worker] Already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 [Deposit Worker] Starting...');
        console.log(`   Chains: ${CHAINS_TO_MONITOR.join(', ')}`);
        console.log(`   Interval: ${SCAN_INTERVAL_MS / 1000}s`);
        console.log('');

        // Run initial scan immediately
        await this.runCycle();

        // Then run on interval
        setInterval(() => this.runCycle(), SCAN_INTERVAL_MS);
    }

    /**
     * Stop the worker
     */
    stop() {
        this.isRunning = false;
        console.log('🛑 [Deposit Worker] Stopped');
    }

    /**
     * Run one complete scan cycle
     */
    private async runCycle() {
        const cycleStart = Date.now();
        console.log(`\n━━━ Scan Cycle [${new Date().toISOString()}] ━━━`);

        try {
            // Step 1: Scan for new deposits
            await this.scanForDeposits();

            // Step 2: Update confirmations and credit
            await this.updateConfirmations();

            const duration = Date.now() - cycleStart;
            console.log(`✅ Cycle complete in ${duration}ms\n`);
        } catch (error) {
            console.error('❌ [Deposit Worker] Cycle error:', error);
        }
    }

    /**
     * Scan all active deposit addresses for new deposits
     */
    private async scanForDeposits() {
        for (const chain of CHAINS_TO_MONITOR) {
            try {
                const results = await this.scanChain(chain);

                if (results.depositsDetected > 0) {
                    console.log(`   💰 ${chain}: Found ${results.depositsDetected} new deposits`);
                } else {
                    console.log(`   ✓ ${chain}: ${results.addressesScanned} addresses (no new deposits)`);
                }

                if (results.errors.length > 0) {
                    console.warn(`   ⚠️  ${chain}: ${results.errors.length} errors`);
                }
            } catch (error: any) {
                console.error(`   ❌ ${chain}: ${error.message}`);
            }
        }
    }

    /**
     * Scan a specific chain for deposits
     */
    private async scanChain(chain: string) {
        const results = {
            addressesScanned: 0,
            depositsDetected: 0,
            errors: [] as string[],
        };

        // Get all active deposit addresses for this chain
        const addresses = await this.queryItems(
            'deposit_addresses',
            'SELECT * FROM c WHERE c.chain = @chain AND c.status = @status',
            [
                { name: '@chain', value: chain },
                { name: '@status', value: 'active' },
            ]
        );

        if (addresses.length === 0) {
            return results;
        }

        // Initialize monitor
        const monitor = this.getMonitor(chain);
        if (!monitor) {
            results.errors.push(`No monitor implementation for ${chain}`);
            return results;
        }

        // Scan each address
        for (const addr of addresses) {
            try {
                const deposits = await monitor.monitorAddress(addr.address, addr.userId);
                results.addressesScanned++;
                results.depositsDetected += deposits.length;
            } catch (error: any) {
                results.errors.push(`${addr.address}: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Update confirmations for pending deposits
     */
    private async updateConfirmations() {
        try {
            const results = await this.confirmationTracker.checkPendingDeposits();

            if (results.confirmed > 0 || results.credited > 0) {
                console.log(`   🔔 Confirmations: ${results.updated} updated, ${results.confirmed} confirmed, ${results.credited} credited`);
            } else if (results.checked > 0) {
                console.log(`   ✓ Confirmations: ${results.checked} checked (none ready)`);
            }

            if (results.errors.length > 0) {
                console.warn(`   ⚠️  Confirmation errors: ${results.errors.length}`);
            }
        } catch (error: any) {
            console.error(`   ❌ Confirmation update failed: ${error.message}`);
        }
    }

    /**
     * Get blockchain monitor for a specific chain
     */
    private getMonitor(chain: string): any {
        switch (chain) {
            case 'ETH':
                return new this.ETHMonitor({
                    rpcUrl: process.env.ETHEREUM_RPC_URL || '',
                    requiredConfirmations: parseInt(process.env.ETH_REQUIRED_CONFIRMATIONS || '12'),
                    chainName: 'ETH',
                });

            case 'MATIC':
                return new this.ETHMonitor({
                    rpcUrl: process.env.POLYGON_RPC_URL || '',
                    requiredConfirmations: parseInt(process.env.MATIC_REQUIRED_CONFIRMATIONS || '128'),
                    chainName: 'MATIC',
                });

            case 'BSC':
                return new this.ETHMonitor({
                    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
                    requiredConfirmations: parseInt(process.env.BSC_REQUIRED_CONFIRMATIONS || '15'),
                    chainName: 'BSC',
                });

            case 'BTC':
                return new this.BTCMonitor({
                    rpcUrl: process.env.BTC_API_URL || 'https://blockstream.info/api',
                    requiredConfirmations: parseInt(process.env.BTC_REQUIRED_CONFIRMATIONS || '3'),
                    chainName: 'BTC',
                });

            default:
                return null;
        }
    }
}

// Main execution with dynamic imports
async function main() {
    try {
        // Import dependencies dynamically AFTER dotenv.config()
        const { ETHMonitor } = await import('./src/services/deposits/eth-monitor');
        const { ConfirmationTracker } = await import('./src/services/deposits/confirmation-tracker');
        const { queryItems } = await import('./src/lib/azure/cosmos');
        const { BTCMonitor } = await import('./src/services/deposits/btc-monitor');

        const worker = new DepositWorker({
            ETHMonitor,
            ConfirmationTracker,
            queryItems,
            BTCMonitor
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down gracefully...');
            worker.stop();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 Shutting down gracefully...');
            worker.stop();
            process.exit(0);
        });

        // Start worker
        await worker.start();

    } catch (error) {
        console.error('Fatal error starting worker:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export default DepositWorker;
