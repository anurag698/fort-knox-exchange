// ETH Blockchain Monitor
// Monitors Ethereum addresses for incoming ETH and ERC20 deposits

import { ethers } from 'ethers';
import { BlockchainMonitor, BlockchainMonitorConfig } from './blockchain-monitor';
import {
    createDeposit,
    Deposit,
} from '@/lib/azure/cosmos-trading';

export class ETHMonitor extends BlockchainMonitor {
    private provider: ethers.JsonRpcProvider;
    private scanProvider: ethers.EtherscanProvider | null = null;

    constructor(config: BlockchainMonitorConfig) {
        super(config);
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

        // Initialize Etherscan provider for history (if key available)
        let chainId = 1;
        let networkName = 'mainnet';

        if (config.chainName === 'MATIC') { chainId = 137; networkName = 'matic'; }
        else if (config.chainName === 'BSC') { chainId = 56; networkName = 'bnb'; }

        const apiKey = process.env[`${config.chainName}_SCAN_API_KEY`];
        if (apiKey) {
            this.scanProvider = new ethers.EtherscanProvider(new ethers.Network(networkName, chainId), apiKey);
        }
    }

    /**
     * Get current block number
     */
    async getCurrentBlockNumber(): Promise<number> {
        return await this.provider.getBlockNumber();
    }

    /**
     * Monitor an address for ETH deposits
     * @param address - Ethereum address to monitor
     * @param userId - User ID associated with this address
     * @param fromBlock - Starting block to scan from (defaults to current - 1000)
     */
    async monitorAddress(
        address: string,
        userId: string,
        fromBlock?: number
    ): Promise<Deposit[]> {
        const deposits: Deposit[] = [];

        try {
            const currentBlock = await this.getCurrentBlockNumber();
            const startBlock = fromBlock || currentBlock - 1000; // Default: scan last ~1000 blocks (~3.5 hours)

            console.log(`[ETH Monitor] Scanning ${address} from block ${startBlock} to ${currentBlock}`);

            // Get ETH transfer history using eth_getLogs
            const filter = {
                address: null, // null = all addresses (we filter by `to` in topics)
                fromBlock: startBlock,
                toBlock: currentBlock,
                topics: [
                    null, // Any event signature
                    null, // Any from address
                    ethers.zeroPadValue(address, 32), // To our deposit address
                ],
            };

            // Query transaction history for this address
            let history: Array<ethers.TransactionResponse> = [];
            if (this.scanProvider) {
                history = await (this.scanProvider as any).getHistory(address, startBlock, currentBlock);
            }

            for (const tx of history) {
                // Skip outgoing transactions
                if (tx.from.toLowerCase() === address.toLowerCase()) {
                    continue;
                }

                // Skip if not incoming
                if (!tx.to || tx.to.toLowerCase() !== address.toLowerCase()) {
                    continue;
                }

                // Check for duplicates
                if (await this.isDepositDuplicate(tx.hash, this.config.chainName)) {
                    console.log(`[ETH Monitor] Skipping duplicate deposit: ${tx.hash}`);
                    continue;
                }

                // Get transaction receipt for confirmation data
                const receipt = await tx.wait();
                if (!receipt) continue;

                // Calculate confirmations
                const confirmations = currentBlock - receipt.blockNumber;

                // Parse ETH amount
                const amountNormalized = this.parseAmount(tx.value.toString(), 18);

                // Skip dust transactions (< 0.0001 ETH)
                if (amountNormalized < 0.0001) {
                    console.log(`[ETH Monitor] Skipping dust deposit: ${amountNormalized} ETH`);
                    continue;
                }

                // Determine deposit status based on confirmations
                let status: Deposit['status'] = 'pending';
                if (confirmations >= this.config.requiredConfirmations) {
                    status = 'confirmed';
                } else if (confirmations > 0) {
                    status = 'confirming';
                }

                // Create deposit record
                const deposit = await createDeposit({
                    userId,
                    chain: this.config.chainName,
                    depositAddress: address,
                    txHash: tx.hash,
                    amount: tx.value.toString(),
                    amountNormalized,
                    status,
                    confirmations,
                    requiredConfirmations: this.config.requiredConfirmations,
                    blockNumber: receipt.blockNumber,
                    timestamp: new Date(),
                    metadata: {
                        fromAddress: tx.from,
                        gasUsed: receipt.gasUsed.toString(),
                        blockHash: receipt.blockHash,
                    },
                });

                deposits.push(deposit);
                console.log(`✅ [ETH Monitor] Detected deposit: ${amountNormalized} ETH (${confirmations}/${this.config.requiredConfirmations} confirmations)`);
            }

            return deposits;
        } catch (error) {
            console.error(`[ETH Monitor] Error scanning address ${address}:`, error);
            throw error;
        }
    }

    /**
     * Monitor an address for ERC20 token deposits
     * @param tokenAddress - ERC20 token contract address
     * @param depositAddress - User's deposit address
     * @param userId - User ID
     * @param fromBlock - Starting block
     */
    async monitorERC20Deposits(
        tokenAddress: string,
        depositAddress: string,
        userId: string,
        fromBlock?: number
    ): Promise<Deposit[]> {
        const deposits: Deposit[] = [];

        try {
            const currentBlock = await this.getCurrentBlockNumber();
            const startBlock = fromBlock || currentBlock - 1000;

            // ERC20 Transfer event signature: Transfer(address,address,uint256)
            const transferTopic = ethers.id('Transfer(address,address,uint256)');

            const filter = {
                address: tokenAddress,
                fromBlock: startBlock,
                toBlock: currentBlock,
                topics: [
                    transferTopic,
                    null, // from any address
                    ethers.zeroPadValue(depositAddress, 32), // to our deposit address
                ],
            };

            const logs = await this.provider.getLogs(filter);

            for (const log of logs) {
                const txHash = log.transactionHash;

                // Check for duplicates
                if (await this.isDepositDuplicate(txHash, this.config.chainName)) {
                    continue;
                }

                // Parse transfer data
                const fromAddress = ethers.getAddress('0x' + log.topics[1].slice(26));
                const amount = BigInt(log.data);

                // Get token decimals (you'll need to query the ERC20 contract)
                // For now, assuming 18 decimals (USDT, USDC might be 6)
                const decimals = 18;
                const amountNormalized = this.parseAmount(amount.toString(), decimals);

                // Get transaction receipt
                const receipt = await this.provider.getTransactionReceipt(txHash);
                if (!receipt) continue;

                const confirmations = currentBlock - receipt.blockNumber;

                let status: Deposit['status'] = 'pending';
                if (confirmations >= this.config.requiredConfirmations) {
                    status = 'confirmed';
                } else if (confirmations > 0) {
                    status = 'confirming';
                }

                // Create deposit record
                const deposit = await createDeposit({
                    userId,
                    chain: this.config.chainName,
                    depositAddress,
                    txHash,
                    amount: amount.toString(),
                    amountNormalized,
                    token: 'ERC20', // TODO: Get token symbol from contract
                    status,
                    confirmations,
                    requiredConfirmations: this.config.requiredConfirmations,
                    blockNumber: receipt.blockNumber,
                    timestamp: new Date(),
                    metadata: {
                        fromAddress,
                        gasUsed: receipt.gasUsed.toString(),
                        blockHash: receipt.blockHash,
                    },
                });

                deposits.push(deposit);
                console.log(`✅ [ETH Monitor] Detected ERC20 deposit: ${amountNormalized} tokens`);
            }

            return deposits;
        } catch (error) {
            console.error('[ETH Monitor] Error scanning ERC20 deposits:', error);
            throw error;
        }
    }
}
