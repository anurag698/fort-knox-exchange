// Confirmation Tracker Service
// Updates confirmation counts for pending deposits and credits confirmed ones

import { ethers } from 'ethers';
import {
    getPendingDeposits,
    updateDeposit,
    creditConfirmedDeposit,
    Deposit,
} from '@/lib/azure/cosmos-trading';

export class ConfirmationTracker {
    private providers: Map<string, ethers.JsonRpcProvider>;

    constructor() {
        this.providers = new Map();

        // Initialize RPC providers for each chain
        if (process.env.ETHEREUM_RPC_URL) {
            this.providers.set('ETH', new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL));
        }
        if (process.env.POLYGON_RPC_URL) {
            this.providers.set('MATIC', new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL));
        }
        if (process.env.BSC_RPC_URL) {
            this.providers.set('BSC', new ethers.JsonRpcProvider(process.env.BSC_RPC_URL));
        }
    }

    /**
     * Check and update all pending deposits
     */
    async checkPendingDeposits(): Promise<{
        checked: number;
        updated: number;
        confirmed: number;
        credited: number;
        errors: string[];
    }> {
        const results = {
            checked: 0,
            updated: 0,
            confirmed: 0,
            credited: 0,
            errors: [] as string[],
        };

        try {
            // Get all pending/confirming deposits
            const pendingDeposits = await getPendingDeposits();

            console.log(`[Confirmation Tracker] Checking ${pendingDeposits.length} pending deposits`);

            for (const deposit of pendingDeposits) {
                results.checked++;

                try {
                    const updated = await this.updateDepositConfirmations(deposit);

                    if (updated) {
                        results.updated++;

                        // If now confirmed, try to credit
                        if (deposit.status === 'confirmed') {
                            results.confirmed++;

                            const credited = await creditConfirmedDeposit(deposit.id, deposit.userId);
                            if (credited) {
                                results.credited++;
                            }
                        }
                    }
                } catch (error: any) {
                    console.error(`[Confirmation Tracker] Error updating deposit ${deposit.id}:`, error.message);
                    results.errors.push(`${deposit.id}: ${error.message}`);
                }
            }

            console.log(`[Confirmation Tracker] Results:`, results);
            return results;
        } catch (error: any) {
            console.error('[Confirmation Tracker] Fatal error:', error);
            results.errors.push(`Fatal: ${error.message}`);
            return results;
        }
    }

    /**
     * Update confirmation count for a single deposit
     */
    private async updateDepositConfirmations(deposit: Deposit): Promise<boolean> {
        const provider = this.providers.get(deposit.chain);
        if (!provider) {
            console.warn(`[Confirmation Tracker] No provider for chain ${deposit.chain}`);
            return false;
        }

        try {
            // Get current block number
            const currentBlock = await provider.getBlockNumber();

            // Calculate confirmations
            const confirmations = currentBlock - deposit.blockNumber;

            // Check if confirmations have increased
            if (confirmations <= deposit.confirmations) {
                return false; // No update needed
            }

            // Determine new status
            let newStatus = deposit.status;
            if (confirmations >= deposit.requiredConfirmations && deposit.status !== 'confirmed') {
                newStatus = 'confirmed';
                console.log(`✅ [Confirmation Tracker] Deposit ${deposit.id} is now confirmed (${confirmations}/${deposit.requiredConfirmations})`);
            } else if (confirmations > 0 && deposit.status === 'pending') {
                newStatus = 'confirming';
            }

            // Update deposit
            await updateDeposit(deposit.id, deposit.userId, {
                confirmations,
                status: newStatus,
            });

            return true;
        } catch (error: any) {
            console.error(`[Confirmation Tracker] Error checking confirmations for ${deposit.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Get confirmation count for a specific transaction
     */
    async getTransactionConfirmations(
        txHash: string,
        chain: 'ETH' | 'BSC' | 'MATIC'
    ): Promise<number> {
        const provider = this.providers.get(chain);
        if (!provider) {
            throw new Error(`No provider for chain ${chain}`);
        }

        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) {
            return 0;
        }

        const currentBlock = await provider.getBlockNumber();
        return currentBlock - receipt.blockNumber;
    }
}
