// BTC Blockchain Monitor
// Monitors Bitcoin addresses for incoming BTC deposits using UTXO model

import { BlockchainMonitor, BlockchainMonitorConfig } from './blockchain-monitor';
import {
    createDeposit,
    Deposit,
} from '@/lib/azure/cosmos-trading';

interface UTXOResponse {
    address: string;
    txid: string;
    vout: number;
    status: {
        confirmed: boolean;
        block_height?: number;
        block_hash?: string;
        block_time?: number;
    };
    value: number; // In satoshis
}

export class BTCMonitor extends BlockchainMonitor {
    private apiUrl: string;

    constructor(config: BlockchainMonitorConfig) {
        super(config);
        this.apiUrl = config.rpcUrl; // Blockstream API URL
    }

    /**
     * Get current block height
     */
    async getCurrentBlockNumber(): Promise<number> {
        try {
            const response = await fetch(`${this.apiUrl}/blocks/tip/height`);
            const height = await response.text();
            return parseInt(height);
        } catch (error) {
            console.error('[BTC Monitor] Error fetching block height:', error);
            throw error;
        }
    }

    /**
     * Monitor a Bitcoin address for deposits
     */
    async monitorAddress(
        address: string,
        userId: string,
        fromBlock?: number
    ): Promise<Deposit[]> {
        const deposits: Deposit[] = [];

        try {
            const currentBlock = await this.getCurrentBlockNumber();
            console.log(`[BTC Monitor] Scanning ${address} (current block: ${currentBlock})`);

            // Get all UTXOs for this address
            const response = await fetch(`${this.apiUrl}/address/${address}/utxo`);
            if (!response.ok) {
                throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
            }

            const utxos: UTXOResponse[] = await response.json();

            for (const utxo of utxos) {
                // Check if this deposit already exists
                if (await this.isDepositDuplicate(`${utxo.txid}:${utxo.vout}`, this.config.chainName)) {
                    continue;
                }

                // Get transaction details
                const txResponse = await fetch(`${this.apiUrl}/tx/${utxo.txid}`);
                if (!txResponse.ok) continue;

                const txData = await txResponse.json();

                // Calculate confirmations
                let confirmations = 0;
                if (utxo.status.confirmed && utxo.status.block_height) {
                    confirmations = currentBlock - utxo.status.block_height + 1;
                }

                // Convert satoshis to BTC
                const amountNormalized = this.parseAmount(utxo.value.toString(), 8); // 8 decimals for BTC

                // Skip dust (< 0.0001 BTC)
                if (amountNormalized < 0.0001) {
                    console.log(`[BTC Monitor] Skipping dust deposit: ${amountNormalized} BTC`);
                    continue;
                }

                // Determine status
                let status: Deposit['status'] = 'pending';
                if (confirmations >= this.config.requiredConfirmations) {
                    status = 'confirmed';
                } else if (confirmations > 0) {
                    status = 'confirming';
                }

                // Get sender addresses (first input)
                const fromAddress = txData.vin?.[0]?.prevout?.scriptpubkey_address || 'unknown';

                // Create deposit record
                const deposit = await createDeposit({
                    userId,
                    chain: this.config.chainName,
                    depositAddress: address,
                    txHash: `${utxo.txid}:${utxo.vout}`, // Include vout for uniqueness
                    amount: utxo.value.toString(),
                    amountNormalized,
                    status,
                    confirmations,
                    requiredConfirmations: this.config.requiredConfirmations,
                    blockNumber: utxo.status.block_height || 0,
                    timestamp: new Date(utxo.status.block_time ? utxo.status.block_time * 1000 : Date.now()),
                    metadata: {
                        fromAddress,
                        blockHash: utxo.status.block_hash || '',
                        gasUsed: '0', // BTC doesn't have gas
                    },
                });

                deposits.push(deposit);
                console.log(`✅ [BTC Monitor] Detected deposit: ${amountNormalized} BTC (${confirmations}/${this.config.requiredConfirmations} confirmations)`);
            }

            return deposits;
        } catch (error) {
            console.error(`[BTC Monitor] Error scanning address ${address}:`, error);
            throw error;
        }
    }
}
