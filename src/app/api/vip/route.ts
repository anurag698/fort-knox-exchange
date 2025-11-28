import { NextResponse } from 'next/server';

// VIP tier configuration
let vipTiers = {
    bronze: {
        name: 'Bronze',
        level: 1,
        requirements: {
            tradingVolume30d: 0, // No minimum
            minBalance: 0,
        },
        benefits: {
            makerFeeDiscount: 0,
            takerFeeDiscount: 0,
            withdrawalFeeDiscount: 0,
            dailyWithdrawalLimit: 10000,
            prioritySupport: false,
            apiAccess: false,
        },
        color: '#CD7F32',
    },
    silver: {
        name: 'Silver',
        level: 2,
        requirements: {
            tradingVolume30d: 10000,
            minBalance: 500,
        },
        benefits: {
            makerFeeDiscount: 10, // 10% off maker fees
            takerFeeDiscount: 5,
            withdrawalFeeDiscount: 10,
            dailyWithdrawalLimit: 50000,
            prioritySupport: false,
            apiAccess: true,
        },
        color: '#C0C0C0',
    },
    gold: {
        name: 'Gold',
        level: 3,
        requirements: {
            tradingVolume30d: 50000,
            minBalance: 2000,
        },
        benefits: {
            makerFeeDiscount: 20,
            takerFeeDiscount: 15,
            withdrawalFeeDiscount: 25,
            dailyWithdrawalLimit: 100000,
            prioritySupport: true,
            apiAccess: true,
        },
        color: '#FFD700',
    },
    platinum: {
        name: 'Platinum',
        level: 4,
        requirements: {
            tradingVolume30d: 200000,
            minBalance: 10000,
        },
        benefits: {
            makerFeeDiscount: 30,
            takerFeeDiscount: 25,
            withdrawalFeeDiscount: 50,
            dailyWithdrawalLimit: 500000,
            prioritySupport: true,
            apiAccess: true,
        },
        color: '#E5E4E2',
    },
    diamond: {
        name: 'Diamond',
        level: 5,
        requirements: {
            tradingVolume30d: 1000000,
            minBalance: 50000,
        },
        benefits: {
            makerFeeDiscount: 50,
            takerFeeDiscount: 40,
            withdrawalFeeDiscount: 75,
            dailyWithdrawalLimit: 2000000,
            prioritySupport: true,
            apiAccess: true,
        },
        color: '#B9F2FF',
    },
};

// Mock user VIP data
const mockUserVipData = {
    userId: 'user1',
    currentTier: 'silver',
    tradingVolume30d: 25000,
    currentBalance: 1200,
    nextTier: 'gold',
    progressToNext: 50, // percentage
};

// GET /api/vip - Get user's VIP tier and progress
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'user1';

        return NextResponse.json({
            success: true,
            userVip: mockUserVipData,
            tiers: vipTiers,
        });
    } catch (error) {
        console.error('VIP fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch VIP data' },
            { status: 500 }
        );
    }
}
