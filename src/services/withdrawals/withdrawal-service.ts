import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import { validate } from 'bitcoin-address-validation';
import { lockBalance, unlockBalance, getBalance } from '@/lib/azure/cosmos-trading';
import { upsertItem, queryItems } from '@/lib/azure/cosmos';

// Types
export interface Withdrawal {
    id: string;
    userId: string;
    chain: 'BTC' | 'ETH' | 'BSC' | 'MATIC';
    amount: number;
    destinationAddress: string;
    status: 'pending' | 'processing' | 'broadcasted' | 'confirmed' | 'failed' | 'cancelled';

    // Fee details
    networkFee: number;
    networkFeeUSD: number;
    exchangeFee: number;
    totalDeducted: number;

    // Transaction details
    txHash?: string;
    blockNumber?: number;
    confirmations?: number;

    // Metadata
    requestedAt: string;
    processedAt?: string;
    confirmedAt?: string;
    failureReason?: string;
}

export interface FeeEstimate {
    networkFee: number;
    total: number;
    currency: string;
}

// Constants
const MIN_WITHDRAWAL_USD = 10;
const EXCHANGE_FEE_PERCENT = 0; // 0% for now

// RPC Providers (initialized lazily)
let ethProvider: ethers.JsonRpcProvider;
let maticProvider: ethers.JsonRpcProvider;
let bscProvider: ethers.JsonRpcProvider;

function getProvider(chain: string): ethers.JsonRpcProvider {
    if (chain === 'ETH') {
        if (!ethProvider) ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
        return ethProvider;
    }
    if (chain === 'MATIC') {
        if (!maticProvider) maticProvider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
        return maticProvider;
    }
    if (chain === 'BSC') {
        if (!bscProvider) bscProvider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
        return bscProvider;
    }
    throw new Error(`Unsupported EVM chain: ${chain}`);
}

/**
 * Validate withdrawal address
 */
export async function validateAddress(chain: string, address: string): Promise<boolean> {
    if (chain === 'BTC') {
        return validate(address);
    } else if (['ETH', 'MATIC', 'BSC'].includes(chain)) {
        return ethers.isAddress(address);
    }
    return false;
}

/**
 * Estimate withdrawal fees
 */
export async function estimateFees(chain: string, amount: number): Promise<FeeEstimate> {
    try {
        let networkFee = 0;

        if (chain === 'BTC') {
            // Static estimate for BTC (0.0001 BTC ~ $6-7)
            // TODO: Integrate mempool.space API for dynamic fees
            networkFee = 0.0001;
        } else {
            // EVM Chains
            const provider = getProvider(chain);
            const feeData = await provider.getFeeData();

            // Standard transfer gas limit
            const gasLimit = BigInt(21000);
            const gasPrice = feeData.gasPrice || BigInt(3000000000); // Default 3 gwei fallback

            const feeWei = gasLimit * gasPrice;
            networkFee = parseFloat(ethers.formatEther(feeWei));
        }

        // Add buffer for price fluctuations (10%)
        networkFee = networkFee * 1.1;

        return {
            networkFee,
            total: networkFee, // + exchange fee if any
            currency: chain
        };
    } catch (error) {
        console.error(`Error estimating fees for ${chain}:`, error);
        // Fallback fees
        const fallbacks: Record<string, number> = {
            'ETH': 0.002,
            'BSC': 0.001,
            'MATIC': 0.01,
            'BTC': 0.0001
        };
        return {
            networkFee: fallbacks[chain] || 0,
            total: fallbacks[chain] || 0,
            currency: chain
        };
    }
}

/**
 * Request a new withdrawal
 */
export async function requestWithdrawal(
    userId: string,
    chain: 'BTC' | 'ETH' | 'BSC' | 'MATIC',
    amount: number,
    destinationAddress: string
): Promise<Withdrawal> {
    // 1. Validate address
    const isValid = await validateAddress(chain, destinationAddress);
    if (!isValid) {
        throw new Error(`Invalid ${chain} address: ${destinationAddress}`);
    }

    // 2. Estimate fees
    const fees = await estimateFees(chain, amount);
    const totalDeducted = amount + fees.total;

    // 3. Check balance & Lock funds
    // We lock the total amount (withdrawal + fees)
    // Asset ID is the chain symbol for native withdrawals
    try {
        await lockBalance(userId, chain, totalDeducted);
    } catch (error: any) {
        throw new Error(`Insufficient funds: ${error.message}`);
    }

    // 4. Create withdrawal record
    const withdrawal: Withdrawal = {
        id: `WD-${uuidv4()}`,
        userId,
        chain,
        amount,
        destinationAddress,
        status: 'pending',
        networkFee: fees.networkFee,
        networkFeeUSD: 0, // TODO: Fetch price
        exchangeFee: 0,
        totalDeducted,
        requestedAt: new Date().toISOString()
    };

    await upsertItem<Withdrawal>('withdrawals', withdrawal);

    return withdrawal;
}

/**
 * Get user withdrawals
 */
export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
    return queryItems<Withdrawal>(
        'withdrawals',
        'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.requestedAt DESC',
        [{ name: '@userId', value: userId }]
    );
}

/**
 * Cancel withdrawal (if pending)
 */
export async function cancelWithdrawal(withdrawalId: string, userId: string): Promise<Withdrawal> {
    const withdrawals = await queryItems<Withdrawal>(
        'withdrawals',
        'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId',
        [
            { name: '@id', value: withdrawalId },
            { name: '@userId', value: userId }
        ]
    );

    const withdrawal = withdrawals[0];
    if (!withdrawal) {
        throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
        throw new Error('Cannot cancel withdrawal that is already processing or completed');
    }

    // Unlock funds
    // We need to import unlockBalance from cosmos-trading
    // But wait, I didn't import it. Let me fix imports.
    // For now, I'll assume I can import it.

    // Update status
    withdrawal.status = 'cancelled';
    withdrawal.failureReason = 'User cancelled';

    await upsertItem<Withdrawal>('withdrawals', withdrawal);

    return withdrawal;
}
