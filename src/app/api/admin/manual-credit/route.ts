import { NextRequest, NextResponse } from 'next/server';
import { upsertItem } from '@/lib/azure/cosmos';

export async function POST(request: NextRequest) {
    try {
        const { userId, asset, amount, txHash } = await request.json();

        if (!userId || !asset || !amount) {
            return NextResponse.json({
                error: 'userId, asset, and amount required'
            }, { status: 400 });
        }

        // Create balance entry with correct schema
        const balanceId = `balance-${userId}-${asset}`;
        const balance = {
            id: balanceId,
            userId,
            assetId: asset,  // Use assetId, not asset
            available: parseFloat(amount),
            locked: 0,
            updatedAt: new Date().toISOString()
        };

        await upsertItem('balances', balance);

        // Optionally create deposit record for tracking
        if (txHash) {
            const deposit = {
                id: `manual_${txHash}`,
                userId,
                chain: 'polygon',
                depositAddress: 'manual_credit',
                txHash,
                amount: amount.toString(),
                amountNormalized: parseFloat(amount),
                asset,
                status: 'confirmed',
                confirmations: 999,
                requiredConfirmations: 30,
                timestamp: new Date().toISOString(),
                metadata: {
                    manualCredit: true,
                    reason: 'Manual credit - deposit worker unavailable'
                }
            };

            await upsertItem('deposits', deposit);
        }

        return NextResponse.json({
            success: true,
            balance,
            message: `${amount} ${asset} credited to user ${userId}`
        });

    } catch (error: any) {
        console.error('Manual credit error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to credit balance' },
            { status: 500 }
        );
    }
}
