import { NextResponse } from 'next/server';

// Mock user stakes
const mockUserStakes = [
    {
        id: '1',
        poolId: '1',
        poolName: 'BTC Flexible Staking',
        token: 'BTC',
        amount: 0.5,
        apy: 5.5,
        startDate: new Date(Date.now() - 2592000000).toISOString(),
        status: 'active',
        earnedRewards: 0.00226,
        type: 'flexible',
    },
];

// GET /api/staking/user - Get user's stakes
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'user1';

        return NextResponse.json({
            success: true,
            stakes: mockUserStakes,
            summary: {
                totalStaked: 0.5,
                totalEarned: 0.00226,
                activeStakes: 1,
            },
        });
    } catch (error) {
        console.error('User stakes fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch stakes' }, { status: 500 });
    }
}

// POST /api/staking/user - Stake tokens
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { poolId, amount } = body;

        // In production, this would create a stake record
        return NextResponse.json({
            success: true,
            message: `Successfully staked ${amount} tokens`,
            stakeId: Date.now().toString(),
        });
    } catch (error) {
        console.error('Staking error:', error);
        return NextResponse.json({ error: 'Failed to stake tokens' }, { status: 500 });
    }
}

// DELETE /api/staking/user - Unstake tokens
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const stakeId = searchParams.get('stakeId');

        if (!stakeId) {
            return NextResponse.json({ error: 'Stake ID required' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: 'Tokens unstaked successfully',
        });
    } catch (error) {
        console.error('Unstaking error:', error);
        return NextResponse.json({ error: 'Failed to unstake tokens' }, { status: 500 });
    }
}
