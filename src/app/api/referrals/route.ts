import { NextResponse } from 'next/server';

// Mock data for referral settings
let referralSettings = {
    enabled: true,
    defaultCommissionRate: 20, // 20% of trading fees
    tier1Rate: 20, // 1-10 referrals
    tier2Rate: 25, // 11-50 referrals
    tier3Rate: 30, // 51-100 referrals
    tier4Rate: 35, // 101+ referrals
    minimumWithdrawal: 10,
    cookieDuration: 30, // days
};

// Mock referral data
const mockReferrals = [
    {
        userId: 'user1',
        referralCode: 'FORTKNOX-ABC123',
        totalReferrals: 5,
        activeReferrals: 3,
        totalEarnings: 125.50,
        availableBalance: 85.30,
        lifetimeCommission: 125.50,
        currentTier: 1,
        referredUsers: [
            { id: 'ref1', username: 'trader_alice', joinedAt: '2024-01-15', tradingVolume: 5000, commission: 25 },
            { id: 'ref2', username: 'crypto_bob', joinedAt: '2024-01-20', tradingVolume: 3000, commission: 15.50 },
        ],
    },
];

// GET /api/referrals - Get user's referral data
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'user1';

        const userReferral = mockReferrals.find(r => r.userId === userId) || {
            userId,
            referralCode: `FORTKNOX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            totalReferrals: 0,
            activeReferrals: 0,
            totalEarnings: 0,
            availableBalance: 0,
            lifetimeCommission: 0,
            currentTier: 1,
            referredUsers: [],
        };

        return NextResponse.json({
            success: true,
            data: userReferral,
            settings: referralSettings,
        });
    } catch (error) {
        console.error('Referral fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch referral data' },
            { status: 500 }
        );
    }
}

// POST /api/referrals/withdraw - Withdraw referral earnings
export async function POST(request: Request) {
    try {
        const { userId, amount } = await request.json();

        if (amount < referralSettings.minimumWithdrawal) {
            return NextResponse.json(
                {
                    error: `Minimum withdrawal is ${referralSettings.minimumWithdrawal} USDT`,
                    success: false,
                },
                { status: 400 }
            );
        }

        // In production, this would create a withdrawal request
        return NextResponse.json({
            success: true,
            message: `Withdrawal request for ${amount} USDT submitted`,
            transactionId: `WD-${Date.now()}`,
        });
    } catch (error) {
        console.error('Withdrawal error:', error);
        return NextResponse.json(
            { error: 'Failed to process withdrawal' },
            { status: 500 }
        );
    }
}
