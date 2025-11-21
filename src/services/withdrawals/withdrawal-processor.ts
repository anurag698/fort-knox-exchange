// Withdrawal Processor
// Signs and broadcasts withdrawal transactions to blockchain

import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import {
    updateWithdrawal,
    getPendingWithdrawals,
    Withdrawal,
} from '@/lib/azure/cosmos-trading';

const ECPair = ECPairFactory(ecc);

export class WithdrawalProcessor {
    private providers: Map<string, ethers.JsonRpcProvider>;
    private wallets: Map<string, ethers.Wallet>;

    constructor() {
        this.providers = new Map();
        this.wallets = new Map();

        // Initialize EVM providers and wallets
        if (process.env.ETHEREUM_RPC_URL && process.env.HOT_WALLET_PRIVATE_KEY_EVM) {
            const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
            const wallet = new ethers.Wallet(process.env.HOT_WALLET_PRIVATE_KEY_EVM, provider);

            this.providers.set('ETH', provider);
            this.wallets.set('ETH', wallet);
        }

        if (process.env.POLYGON_RPC_URL && process.env.HOT_WALLET_PRIVATE_KEY_EVM) {
            const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
            const wallet = new ethers.Wallet(process.env.HOT_WALLET_PRIVATE_KEY_EVM, provider);

            this.providers.set('MATIC', provider);
            this.wallets.set('MATIC', wallet);
        }

        if (process.env.BSC_RPC_URL && process.env.HOT_WALLET_PRIVATE_KEY_EVM) {
            const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
            const wallet = new ethers.Wallet(process.env.HOT_WALLET_PRIVATE_KEY_EVM, provider);

            this.providers.set('BSC', provider);
            this.wallets.set('BSC', wallet);
        }
    }

    /**
     * Process all pending withdrawals
     */
    async processPendingWithdrawals(): Promise<{
        processed: number;
        failed: number;
        errors: string[];
    }> {
        const results = {
            processed: 0,
            failed: 0,
            errors: [] as string[],
        };

        try {
            const pendingWithdrawals = await getPendingWithdrawals();
            console.log(`[Withdrawal Processor] Found ${pendingWithdrawals.length} pending withdrawals`);

            for (const withdrawal of pendingWithdrawals) {
                // Skip if 2FA not verified
                if (withdrawal.requires2FA && !withdrawal.twoFAVerified) {
                    console.log(`[Withdrawal Processor] Skipping ${withdrawal.id} - awaiting 2FA`);
                    continue;
                }

                try {
                    await this.processWithdrawal(withdrawal);
                    results.processed++;
                } catch (error: any) {
                    console.error(`[Withdrawal Processor] Failed to process ${withdrawal.id}:`, error.message);
                    results.failed++;
                    results.errors.push(`${withdrawal.id}: ${error.message}`);

                    // Mark as failed
                    await updateWithdrawal(withdrawal.id, withdrawal.userId, {
                        status: 'failed',
                        failureReason: error.message,
                    });
                }
            }

            return results;
        } catch (error: any) {
            console.error('[Withdrawal Processor] Fatal error:', error);
            results.errors.push(`Fatal: ${error.message}`);
            return results;
        }
    }

    /**
     * Process a single withdrawal
     */
    private async processWithdrawal(withdrawal: Withdrawal): Promise<void> {
        console.log(`[Withdrawal Processor] Processing ${withdrawal.id} (${withdrawal.amount} ${withdrawal.chain})`);

        // Update status to processing
        await updateWithdrawal(withdrawal.id, withdrawal.userId, {
            status: 'processing',
            processedAt: new Date(),
        });

        let txHash: string;

        if (withdrawal.chain === 'BTC') {
            txHash = await this.broadcastBTC(withdrawal);
        } else {
            txHash = await this.broadcastEVM(withdrawal);
        }

        // Update with transaction hash
        await updateWithdrawal(withdrawal.id, withdrawal.userId, {
            status: 'broadcasted',
            txHash,
        });

        console.log(`✅ [Withdrawal Processor] Broadcasted ${withdrawal.id}: ${txHash}`);
    }

    /**
     * Broadcast EVM transaction (ETH, MATIC, BSC)
     */
    private async broadcastEVM(withdrawal: Withdrawal): Promise<string> {
        const wallet = this.wallets.get(withdrawal.chain);
        if (!wallet) {
            throw new Error(`No wallet configured for ${withdrawal.chain}`);
        }

        // Calculate amount to send (withdrawal amount, fee already deducted from user)
        const amountWei = ethers.parseEther(withdrawal.amount.toString());

        // Send transaction
        const tx = await wallet.sendTransaction({
            to: withdrawal.destinationAddress,
            value: amountWei,
        });

        return tx.hash;
    }

    /**
     * Broadcast Bitcoin transaction
     */
    private async broadcastBTC(withdrawal: Withdrawal): Promise<string> {
        // TODO: Implement BTC transaction broadcasting
        // This requires:
        // 1. Fetching UTXOs from hot wallet
        // 2. Building transaction with inputs/outputs
        // 3. Signing with private key
        // 4. Broadcasting via Bitcoin API

        throw new Error('BTC withdrawals not yet implemented');
    }
}
