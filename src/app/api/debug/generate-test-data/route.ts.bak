// Debug API: Generate Test Data for Current User
// Visit this URL while logged in to create test balances and deposits

import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getContainer } from '@/lib/azure/cosmos';
import { createDeposit } from '@/lib/azure/cosmos-trading';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
    try {
        const idToken = req.headers.get('authorization')?.replace('Bearer ', '');
        if (!idToken) {
            return NextResponse.json({
                error: 'Not logged in. Please sign in first.',
                hint: 'Visit the homepage and sign in, then come back to this URL'
            }, { status: 401 });
        }

        const auth = getAuth();
        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

        console.log(`🧪 Generating test data for user: ${userId}`);

        // Create test balances
        const balancesContainer = getContainer('balances');

        await balancesContainer.items.upsert({
            id: uuidv4(),
            userId,
            assetId: 'ETH',
            available: 1.5,
            locked: 0.2,
            updatedAt: new Date().toISOString(),
        });

        await balancesContainer.items.upsert({
            id: uuidv4(),
            userId,
            assetId: 'USDT',
            available: 5000,
            locked: 1000,
            updatedAt: new Date().toISOString(),
        });

        await balancesContainer.items.upsert({
            id: uuidv4(),
            userId,
            assetId: 'BTC',
            available: 0.1,
            locked: 0.05,
            updatedAt: new Date().toISOString(),
        });

        // Create test deposits
        const deposit1 = await createDeposit({
            userId,
            chain: 'ETH',
            depositAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
            txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            amount: '1000000000000000000', // 1 ETH
            amountNormalized: 1.0,
            status: 'credited',
            confirmations: 15,
            requiredConfirmations: 12,
            blockNumber: 12345678,
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            creditedAt: new Date(Date.now() - 3000000),
            metadata: {
                fromAddress: '0x1234567890123456789012345678901234567890',
                gasUsed: '21000',
                blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            },
        });

        const deposit2 = await createDeposit({
            userId,
            chain: 'MATIC',
            depositAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
            txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            amount: '5000000000000000000', // 5 MATIC
            amountNormalized: 5.0,
            status: 'confirming',
            confirmations: 50,
            requiredConfirmations: 128,
            blockNumber: 12345700,
            timestamp: new Date(Date.now() - 600000), // 10 mins ago
            metadata: {
                fromAddress: '0x9876543210987654321098765432109876543210',
                gasUsed: '21000',
                blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            },
        });

        return NextResponse.json({
            success: true,
            message: '✅ Test data generated successfully!',
            userId,
            data: {
                balances: [
                    { asset: 'ETH', available: 1.5, locked: 0.2 },
                    { asset: 'USDT', available: 5000, locked: 1000 },
                    { asset: 'BTC', available: 0.1, locked: 0.05 },
                ],
                deposits: [
                    { id: deposit1.id, chain: 'ETH', amount: 1.0, status: 'credited' },
                    { id: deposit2.id, chain: 'MATIC', amount: 5.0, status: 'confirming' },
                ],
            },
            nextSteps: [
                '1. Visit /deposits to see your test deposits',
                '2. Visit /withdrawals to test withdrawals',
                '3. Visit /trade/BTC-USDT to test trading',
                '4. Check balances in the header',
            ],
        });
    } catch (error: any) {
        console.error('[Test Data Generator] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate test data' },
            { status: 500 }
        );
    }
}
