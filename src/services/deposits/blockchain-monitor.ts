// Blockchain Monitor Base Service
// Provides common functionality for monitoring deposits across different chains

import { ethers } from 'ethers';
import {
    createDeposit,
    getDepositByTxHash,
    Deposit,
} from '@/lib/azure/cosmos-trading';

export interface BlockchainMonitorConfig {
    rpcUrl: string;
    requiredConfirmations: number;
    chainName: 'BTC' | 'ETH' | 'BSC' | 'MATIC';
}

export abstract class BlockchainMonitor {
    protected config: BlockchainMonitorConfig;

    constructor(config: BlockchainMonitorConfig) {
        this.config = config;
    }

    /**
     * Monitor a specific address for deposits
     * Each blockchain monitor must implement this
     */
    abstract monitorAddress(
        address: string,
        userId: string,
        fromBlock?: number
    ): Promise<Deposit[]>;

    /**
     * Get current block number
     */
    abstract getCurrentBlockNumber(): Promise<number>;

    /**
     * Check if a deposit already exists (deduplication)
     */
    protected async isDepositDuplicate(txHash: string, chain: string): Promise<boolean> {
        const existing = await getDepositByTxHash(txHash, chain);
        return existing !== null;
    }

    /**
     * Parse amount from wei/satoshi to normalized units
     */
    protected parseAmount(rawAmount: string, decimals: number): number {
        return parseFloat(ethers.formatUnits(rawAmount, decimals));
    }
}
