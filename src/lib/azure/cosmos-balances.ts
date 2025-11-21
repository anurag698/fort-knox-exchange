// Balance management functions for Cosmos DB
import { getContainer } from './cosmos';
import { incrementField } from './cosmos-updates';
import type { Balance } from '@/lib/types';

/**
 * Get or create a balance for a user and asset
 */
export async function getOrCreateBalance(
    userId: string,
    assetId: string
): Promise<Balance> {
    const container = getContainer('balances');

    // Generate balance ID
    const balanceId = `${userId}_${assetId}`;

    try {
        const { resource } = await container.item(balanceId, userId).read<Balance>();
        if (resource) {
            return resource;
        }
    } catch (error: any) {
        if (error.code !== 404) throw error;
    }

    // Create new balance
    const newBalance: Balance = {
        id: balanceId,
        userId,
        assetId,
        available: 0,
        locked: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await container.items.upsert(newBalance);
    return newBalance;
}

/**
 * Lock funds for an order (decrease available, increase locked)
 */
export async function lockFunds(
    userId: string,
    assetId: string,
    amount: number
): Promise<void> {
    const balance = await getOrCreateBalance(userId, assetId);

    if (balance.available < amount) {
        throw new Error(`Insufficient funds. Available: ${balance.available}, Required: ${amount}`);
    }

    const container = getContainer('balances');
    const updatedBalance = {
        ...balance,
        available: balance.available - amount,
        locked: balance.locked + amount,
        updatedAt: new Date().toISOString()
    };

    await container.item(balance.id, userId).replace(updatedBalance);
}

/**
 * Unlock funds (increase available, decrease locked)
 */
export async function unlockFunds(
    userId: string,
    assetId: string,
    amount: number
): Promise<void> {
    const balance = await getOrCreateBalance(userId, assetId);

    const container = getContainer('balances');
    const updatedBalance = {
        ...balance,
        available: balance.available + amount,
        locked: Math.max(0, balance.locked - amount),
        updatedAt: new Date().toISOString()
    };

    await container.item(balance.id, userId).replace(updatedBalance);
}

/**
 * Settle trade: move from locked to spent (source), add to available (destination)
 */
export async function settleTrade(
    userId: string,
    sourceAssetId: string,
    destAssetId: string,
    sourceAmount: number,
    destAmount: number
): Promise<void> {
    // Decrease locked on source asset
    const sourceBalance = await getOrCreateBalance(userId, sourceAssetId);
    const container = getContainer('balances');

    const updatedSource = {
        ...sourceBalance,
        locked: Math.max(0, sourceBalance.locked - sourceAmount),
        updatedAt: new Date().toISOString()
    };
    await container.item(sourceBalance.id, userId).replace(updatedSource);

    // Increase available on destination asset
    const destBalance = await getOrCreateBalance(userId, destAssetId);
    const updatedDest = {
        ...destBalance,
        available: destBalance.available + destAmount,
        updatedAt: new Date().toISOString()
    };
    await container.item(destBalance.id, userId).replace(updatedDest);
}
