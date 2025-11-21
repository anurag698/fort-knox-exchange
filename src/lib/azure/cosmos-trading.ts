// Azure Cosmos DB Trading Service Layer
// Provides atomic balance management and order operations

import { getContainer, upsertItem, getItemById, queryItems } from './cosmos';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface Balance {
    id: string;
    userId: string;
    assetId: string;
    available: number;
    locked: number;
    updatedAt: string;
}

export interface Order {
    id: string;
    userId: string;
    marketId: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET';
    price?: number;
    averagePrice?: number;
    quantity: number;
    filled: number;
    remaining: number;
    status: 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'EXPIRED' | 'ROUTING';
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
    lockedAsset?: string;
    lockedAmount?: number;
    externalId?: string;
    externalStatus?: string;
    createdAt: string;
    updatedAt: string;
    expiresAt?: string;
}

export interface Trade {
    id: string;
    orderId: string;
    userId: string;
    marketId: string;
    side: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    fee: number;
    feeAsset: string;
    source: 'INTERNAL' | 'EXTERNAL';
    createdAt: string;
}

export interface User {
    id: string;
    userId: string; // Partition Key
    email: string;
    kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
    kycData?: {
        fullName: string;
        dob: string;
        country: string;
        idType: 'passport' | 'national_id' | 'drivers_license';
        idNumber: string;
        documents: {
            front: string;
            back?: string;
            selfie: string;
        };
        submittedAt: string;
        reviewedAt?: string;
        rejectionReason?: string;
    };
    createdAt: string;
    updatedAt: string;
}

// ========================================
// BALANCE MANAGEMENT
// ========================================

/**
 * Get user balance for a specific asset
 */
export async function getBalance(
    userId: string,
    assetId: string
): Promise<Balance | null> {
    try {
        const balances = await queryItems<Balance>(
            'balances',
            'SELECT * FROM c WHERE c.userId = @userId AND c.assetId = @assetId',
            [
                { name: '@userId', value: userId },
                { name: '@assetId', value: assetId },
            ]
        );
        return balances[0] || null;
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
}

/**
 * Get all balances for a user
 */
export async function getUserBalances(userId: string): Promise<Balance[]> {
    return queryItems<Balance>(
        'balances',
        'SELECT * FROM c WHERE c.userId = @userId',
        [{ name: '@userId', value: userId }]
    );
}

/**
 * Lock funds for an order (decrease available, increase locked)
 */
export async function lockBalance(
    userId: string,
    assetId: string,
    amount: number
): Promise<Balance> {
    const balance = await getBalance(userId, assetId);

    if (!balance) {
        throw new Error(`No balance found for ${assetId}`);
    }

    // Use epsilon tolerance for floating-point comparison
    const EPSILON = 0.0000001;
    if (balance.available < amount - EPSILON) {
        throw new Error(`Insufficient ${assetId} balance. Available: ${balance.available}, Required: ${amount}`);
    }

    const updatedBalance: Balance = {
        ...balance,
        available: balance.available - amount,
        locked: balance.locked + amount,
        updatedAt: new Date().toISOString(),
    };

    return await upsertItem<Balance>('balances', updatedBalance);
}

/**
 * Unlock funds (increase available, decrease locked)
 */
export async function unlockBalance(
    userId: string,
    assetId: string,
    amount: number
): Promise<Balance> {
    const balance = await getBalance(userId, assetId);

    if (!balance) {
        throw new Error(`No balance found for ${assetId}`);
    }

    if (balance.locked < amount) {
        throw new Error(`Insufficient locked ${assetId} balance. Locked: ${balance.locked}, Unlocking: ${amount}`);
    }

    const updatedBalance: Balance = {
        ...balance,
        available: balance.available + amount,
        locked: balance.locked - amount,
        updatedAt: new Date().toISOString(),
    };

    return await upsertItem<Balance>('balances', updatedBalance);
}

/**
 * Transfer locked funds to available (used after order fill)
 */
export async function settleFunds(
    userId: string,
    deductAsset: string,
    deductAmount: number,
    creditAsset: string,
    creditAmount: number
): Promise<void> {
    // Deduct from locked balance
    const deductBalance = await getBalance(userId, deductAsset);
    if (!deductBalance || deductBalance.locked < deductAmount) {
        throw new Error(`Insufficient locked ${deductAsset}`);
    }

    await upsertItem<Balance>('balances', {
        ...deductBalance,
        locked: deductBalance.locked - deductAmount,
        updatedAt: new Date().toISOString(),
    });

    // Credit to available balance
    const creditBalance = await getBalance(userId, creditAsset);
    if (creditBalance) {
        await upsertItem<Balance>('balances', {
            ...creditBalance,
            available: creditBalance.available + creditAmount,
            updatedAt: new Date().toISOString(),
        });
    } else {
        // Create new balance if doesn't exist
        await upsertItem<Balance>('balances', {
            id: uuidv4(),
            userId,
            assetId: creditAsset,
            available: creditAmount,
            locked: 0,
            updatedAt: new Date().toISOString(),
        });
    }
}

// ========================================
// ORDER MANAGEMENT
// ========================================

/**
 * Create a new order
 */
export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const newOrder: Order = {
        ...order,
        id: `ORD-${Date.now()}-${uuidv4().substring(0, 8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return await upsertItem<Order>('orders', newOrder);
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string, userId: string): Promise<Order | null> {
    try {
        const orders = await queryItems<Order>(
            'orders',
            'SELECT * FROM c WHERE c.id = @orderId AND c.userId = @userId',
            [
                { name: '@orderId', value: orderId },
                { name: '@userId', value: userId },
            ]
        );
        return orders[0] || null;
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
}

/**
 * Update order
 */
export async function updateOrder(
    orderId: string,
    userId: string,
    updates: Partial<Order>
): Promise<Order> {
    const existingOrder = await getOrder(orderId, userId);

    if (!existingOrder) {
        throw new Error(`Order ${orderId} not found`);
    }

    const updatedOrder: Order = {
        ...existingOrder,
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    return await upsertItem<Order>('orders', updatedOrder);
}

/**
 * Get user orders with filters
 */
export async function getUserOrders(
    userId: string,
    filters?: {
        status?: string;
        symbol?: string;
        side?: 'BUY' | 'SELL';
    }
): Promise<Order[]> {
    let query = 'SELECT * FROM c WHERE c.userId = @userId';
    const parameters: any[] = [{ name: '@userId', value: userId }];

    if (filters?.status) {
        // Handle comma-separated status values (e.g., "OPEN,PARTIAL")
        const statuses = filters.status.split(',').map(s => s.trim());
        if (statuses.length === 1) {
            query += ' AND c.status = @status';
            parameters.push({ name: '@status', value: statuses[0] });
        } else {
            // Use IN operator for multiple statuses
            const statusParams = statuses.map((status, idx) => {
                const paramName = `@status${idx}`;
                parameters.push({ name: paramName, value: status });
                return paramName;
            });
            query += ` AND c.status IN (${statusParams.join(', ')})`;
        }
    }

    if (filters?.symbol) {
        query += ' AND c.symbol = @symbol';
        parameters.push({ name: '@symbol', value: filters.symbol });
    }

    if (filters?.side) {
        query += ' AND c.side = @side';
        parameters.push({ name: '@side', value: filters.side });
    }

    query += ' ORDER BY c.createdAt DESC';

    return queryItems<Order>('orders', query, parameters);
}

/**
 * Get ALL open orders for matching engine hydration
 */
export async function getAllOpenOrders(): Promise<Order[]> {
    return queryItems<Order>(
        'orders',
        'SELECT * FROM c WHERE c.status = "OPEN" OR c.status = "PARTIAL"',
        []
    );
}

/**
 * Cancel order and unlock funds
 */
export async function cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await getOrder(orderId, userId);

    if (!order) {
        throw new Error('Order not found');
    }

    if (order.status === 'FILLED' || order.status === 'CANCELLED') {
        throw new Error(`Cannot cancel order in ${order.status} status`);
    }

    // Unlock remaining funds
    if (order.lockedAsset && order.lockedAmount && order.remaining > 0) {
        const remainingLocked = (order.lockedAmount / order.quantity) * order.remaining;
        await unlockBalance(userId, order.lockedAsset, remainingLocked);
    }

    // Update order status
    return await updateOrder(orderId, userId, {
        status: 'CANCELLED',
        updatedAt: new Date().toISOString(),
    });
}

// ========================================
// TRADE HISTORY
// ========================================

/**
 * Record a trade
 */
export async function recordTrade(trade: Omit<Trade, 'id' | 'createdAt'>): Promise<Trade> {
    const newTrade: Trade = {
        ...trade,
        id: `TRD-${Date.now()}-${uuidv4().substring(0, 8)}`,
        createdAt: new Date().toISOString(),
    };

    return await upsertItem<Trade>('trades', newTrade);
}

/**
 * Get user trades
 */
export async function getUserTrades(
    userId: string,
    marketId?: string
): Promise<Trade[]> {
    let query = 'SELECT * FROM c WHERE c.userId = @userId';
    const parameters: any[] = [{ name: '@userId', value: userId }];

    if (marketId) {
        query += ' AND c.marketId = @marketId';
        parameters.push({ name: '@marketId', value: marketId });
    }

    query += ' ORDER BY c.createdAt DESC';

    return queryItems<Trade>('trades', query, parameters);
}

// ========================================
// TRANSACTION HELPERS
// ========================================

/**
 * Atomic operation: Lock balance and create order
 */
export async function lockAndCreateOrder(
    userId: string,
    assetId: string,
    lockAmount: number,
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
    try {
        // Lock balance first
        await lockBalance(userId, assetId, lockAmount);

        // Create order with locked info
        const newOrder = await createOrder({
            ...order,
            lockedAsset: assetId,
            lockedAmount: lockAmount,
        });

        return newOrder;
    } catch (error) {
        // If order creation fails, unlock the balance
        try {
            await unlockBalance(userId, assetId, lockAmount);
        } catch (rollbackError) {
            console.error('Failed to rollback balance lock:', rollbackError);
        }
        throw error;
    }
}

/**
 * Atomic operation: Update order and adjust locked balance
 */
export async function updateOrderAndBalance(
    orderId: string,
    userId: string,
    orderUpdates: Partial<Order>,
    balanceDelta: {
        assetId: string;
        lockDelta: number; // positive = lock more, negative = unlock
    }
): Promise<Order> {
    try {
        // Adjust balance
        if (balanceDelta.lockDelta > 0) {
            await lockBalance(userId, balanceDelta.assetId, balanceDelta.lockDelta);
        } else if (balanceDelta.lockDelta < 0) {
            await unlockBalance(userId, balanceDelta.assetId, Math.abs(balanceDelta.lockDelta));
        }

        // Update order
        const updatedOrder = await updateOrder(orderId, userId, orderUpdates);
        return updatedOrder;
    } catch (error) {
        // Rollback balance change if order update fails
        try {
            if (balanceDelta.lockDelta > 0) {
                await unlockBalance(userId, balanceDelta.assetId, balanceDelta.lockDelta);
            } else if (balanceDelta.lockDelta < 0) {
                await lockBalance(userId, balanceDelta.assetId, Math.abs(balanceDelta.lockDelta));
            }
        } catch (rollbackError) {
            console.error('Failed to rollback balance adjustment:', rollbackError);
        }
        throw error;
    }
}

// ============================================================================
// DEPOSIT MANAGEMENT
// ============================================================================

export interface Deposit {
    id: string;
    userId: string;
    chain: 'BTC' | 'ETH' | 'BSC' | 'MATIC';
    depositAddress: string;
    txHash: string;
    amount: string; // Raw blockchain amount (wei, satoshi, etc.)
    amountNormalized: number; // Converted to exchange units
    token?: string; // For ERC20 deposits (e.g., 'USDT', 'USDC')
    status: 'pending' | 'confirming' | 'confirmed' | 'credited' | 'failed';
    confirmations: number;
    requiredConfirmations: number;
    blockNumber: number;
    timestamp: Date;
    creditedAt?: Date;
    sweptAt?: Date;
    sweepTxHash?: string;
    metadata: {
        fromAddress: string;
        gasUsed?: string;
        blockHash: string;
    };
}

export interface DepositFilter {
    status?: Deposit['status'];
    chain?: Deposit['chain'];
    startDate?: Date;
    endDate?: Date;
}

/**
 * Create a new deposit record
 */
export async function createDeposit(deposit: Omit<Deposit, 'id'>): Promise<Deposit> {
    const newDeposit: Deposit = {
        id: `DEP-${uuidv4()}`,
        ...deposit,
    };

    await upsertItem('deposits', newDeposit);
    return newDeposit;
}

/**
 * Update an existing deposit
 */
export async function updateDeposit(
    depositId: string,
    userId: string,
    updates: Partial<Deposit>
): Promise<Deposit | null> {
    const existing = await getItemById<Deposit>('deposits', depositId, userId);
    if (!existing) return null;

    const updated: Deposit = {
        ...existing,
        ...updates,
        id: depositId, // Ensure ID doesn't change
        userId, // Ensure userId doesn't change
    };

    await upsertItem('deposits', updated);
    return updated;
}

/**
 * Get deposit by ID
 */
export async function getDeposit(depositId: string, userId: string): Promise<Deposit | null> {
    return await getItemById<Deposit>('deposits', depositId, userId);
}

/**
 * Get deposit by transaction hash (for deduplication)
 */
export async function getDepositByTxHash(txHash: string, chain: string): Promise<Deposit | null> {
    const query = 'SELECT * FROM c WHERE c.txHash = @txHash AND c.chain = @chain';
    const results = await queryItems<Deposit>('deposits', query, [
        { name: '@txHash', value: txHash },
        { name: '@chain', value: chain },
    ]);
    return results[0] || null;
}

/**
 * Get all pending deposits (for confirmation tracking)
 */
export async function getPendingDeposits(chain?: string): Promise<Deposit[]> {
    let query = 'SELECT * FROM c WHERE c.status IN ("pending", "confirming")';
    const parameters: any[] = [];

    if (chain) {
        query += ' AND c.chain = @chain';
        parameters.push({ name: '@chain', value: chain });
    }

    query += ' ORDER BY c.timestamp ASC';
    return await queryItems<Deposit>('deposits', query, parameters);
}

/**
 * Get user's deposit history with optional filters
 */
export async function getUserDeposits(
    userId: string,
    filter?: DepositFilter
): Promise<Deposit[]> {
    let query = 'SELECT * FROM c WHERE c.userId = @userId';
    const parameters: any[] = [{ name: '@userId', value: userId }];

    if (filter?.status) {
        query += ' AND c.status = @status';
        parameters.push({ name: '@status', value: filter.status });
    }

    if (filter?.chain) {
        query += ' AND c.chain = @chain';
        parameters.push({ name: '@chain', value: filter.chain });
    }

    if (filter?.startDate) {
        query += ' AND c.timestamp >= @startDate';
        parameters.push({ name: '@startDate', value: filter.startDate.toISOString() });
    }

    if (filter?.endDate) {
        query += ' AND c.timestamp <= @endDate';
        parameters.push({ name: '@endDate', value: filter.endDate.toISOString() });
    }

    query += ' ORDER BY c.timestamp DESC';
    return await queryItems<Deposit>('deposits', query, parameters);
}

/**
 * Credit a confirmed deposit to user's balance
 * This is an atomic operation that updates both deposit status and balance
 */
export async function creditConfirmedDeposit(
    depositId: string,
    userId: string
): Promise<boolean> {
    try {
        // Get deposit
        const deposit = await getDeposit(depositId, userId);
        if (!deposit) {
            console.error(`Deposit ${depositId} not found`);
            return false;
        }

        // Check if already credited
        if (deposit.status === 'credited') {
            console.warn(`Deposit ${depositId} already credited`);
            return true;
        }

        // Check if confirmed
        if (deposit.status !== 'confirmed') {
            console.error(`Deposit ${depositId} not confirmed yet (status: ${deposit.status})`);
            return false;
        }

        //Determine asset ID (for ERC20, use token symbol, otherwise use chain)
        const assetId = deposit.token || deposit.chain;

        // Credit balance directly (deposits don't have a deduct side)
        const balance = await getBalance(userId, assetId);
        if (balance) {
            await upsertItem<Balance>('balances', {
                ...balance,
                available: balance.available + deposit.amountNormalized,
                updatedAt: new Date().toISOString(),
            });
        } else {
            // Create new balance if doesn't exist
            await upsertItem<Balance>('balances', {
                id: uuidv4(),
                userId,
                assetId,
                available: deposit.amountNormalized,
                locked: 0,
                updatedAt: new Date().toISOString(),
            });
        }

        // Update deposit status
        await updateDeposit(depositId, userId, {
            status: 'credited',
            creditedAt: new Date(),
        });

        console.log(`✅ Credited ${deposit.amountNormalized} ${assetId} to user ${userId} from deposit ${depositId}`);
        return true;
    } catch (error) {
        console.error(`Error crediting deposit ${depositId}:`, error);
        throw error;
    }
}

// ============================================================================
// WITHDRAWAL MANAGEMENT
// ============================================================================

export interface Withdrawal {
    id: string;
    userId: string;
    chain: 'BTC' | 'ETH' | 'BSC' | 'MATIC';
    amount: number;
    destinationAddress: string;
    status: 'pending' | 'processing' | 'broadcasted' | 'confirmed' | 'failed' | 'cancelled';

    networkFee: number;
    networkFeeUSD: number;
    exchangeFee: number;
    totalDeducted: number;

    txHash?: string;
    blockNumber?: number;
    confirmations?: number;

    requestedAt: Date;
    processedAt?: Date;
    confirmedAt?: Date;
    failureReason?: string;

    ipAddress: string;
    userAgent: string;
    requires2FA: boolean;
    twoFAVerified?: boolean;
}

export interface WithdrawalFilter {
    status?: Withdrawal['status'];
    chain?: Withdrawal['chain'];
    startDate?: Date;
    endDate?: Date;
}

/**
 * Create a new withdrawal request
 */
export async function createWithdrawal(withdrawal: Omit<Withdrawal, 'id'>): Promise<Withdrawal> {
    const newWithdrawal: Withdrawal = {
        id: `WD-${uuidv4()}`,
        ...withdrawal,
    };

    await upsertItem('withdrawals', newWithdrawal);
    return newWithdrawal;
}

/**
 * Update an existing withdrawal
 */
export async function updateWithdrawal(
    withdrawalId: string,
    userId: string,
    updates: Partial<Withdrawal>
): Promise<Withdrawal | null> {
    const existing = await getItemById<Withdrawal>('withdrawals', withdrawalId, userId);
    if (!existing) return null;

    const updated: Withdrawal = {
        ...existing,
        ...updates,
        id: withdrawalId,
        userId,
    };

    await upsertItem('withdrawals', updated);
    return updated;
}

/**
 * Get withdrawal by ID
 */
export async function getWithdrawal(withdrawalId: string, userId: string): Promise<Withdrawal | null> {
    return await getItemById<Withdrawal>('withdrawals', withdrawalId, userId);
}

/**
 * Get all pending withdrawals (for processing)
 */
export async function getPendingWithdrawals(chain?: string): Promise<Withdrawal[]> {
    let query = 'SELECT * FROM c WHERE c.status = "pending"';
    const parameters: any[] = [];

    if (chain) {
        query += ' AND c.chain = @chain';
        parameters.push({ name: '@chain', value: chain });
    }

    query += ' ORDER BY c.requestedAt ASC';
    return await queryItems<Withdrawal>('withdrawals', query, parameters);
}

/**
 * Get user's withdrawal history
 */
export async function getUserWithdrawals(
    userId: string,
    filter?: WithdrawalFilter
): Promise<Withdrawal[]> {
    let query = 'SELECT * FROM c WHERE c.userId = @userId';
    const parameters: any[] = [{ name: '@userId', value: userId }];

    if (filter?.status) {
        query += ' AND c.status = @status';
        parameters.push({ name: '@status', value: filter.status });
    }

    if (filter?.chain) {
        query += ' AND c.chain = @chain';
        parameters.push({ name: '@chain', value: filter.chain });
    }

    if (filter?.startDate) {
        query += ' AND c.requestedAt >= @startDate';
        parameters.push({ name: '@startDate', value: filter.startDate.toISOString() });
    }

    if (filter?.endDate) {
        query += ' AND c.requestedAt <= @endDate';
        parameters.push({ name: '@endDate', value: filter.endDate.toISOString() });
    }

    query += ' ORDER BY c.requestedAt DESC';
    return await queryItems<Withdrawal>('withdrawals', query, parameters);
}

/**
 * Cancel a pending withdrawal
 * Can only cancel if status is 'pending' (not yet processed)
 */
export async function cancelWithdrawal(
    withdrawalId: string,
    userId: string
): Promise<boolean> {
    try {
        const withdrawal = await getWithdrawal(withdrawalId, userId);
        if (!withdrawal) {
            throw new Error(`Withdrawal ${withdrawalId} not found`);
        }

        if (withdrawal.status !== 'pending') {
            throw new Error(`Cannot cancel withdrawal in ${withdrawal.status} status`);
        }

        // Unlock the funds
        await unlockBalance(userId, withdrawal.chain, withdrawal.totalDeducted);

        // Update withdrawal status
        await updateWithdrawal(withdrawalId, userId, {
            status: 'cancelled',
        });

        console.log(`✅ Cancelled withdrawal ${withdrawalId} and unlocked ${withdrawal.totalDeducted} ${withdrawal.chain}`);
        return true;
    } catch (error) {
        console.error(`Error cancelling withdrawal ${withdrawalId}:`, error);
        throw error;
    }
}
