import { NextResponse } from 'next/server';

// VIP tier configuration storage
let vipConfig = {
    bronze: {
        requirements: { tradingVolume30d: 0, minBalance: 0 },
        benefits: { makerFeeDiscount: 0, takerFeeDiscount: 0, withdrawalFeeDiscount: 0, dailyWithdrawalLimit: 10000 },
    },
    silver: {
        requirements: { tradingVolume30d: 10000, minBalance: 500 },
        benefits: { makerFeeDiscount: 10, takerFeeDiscount: 5, withdrawalFeeDiscount: 10, dailyWithdrawalLimit: 50000 },
    },
    gold: {
        requirements: { tradingVolume30d: 50000, minBalance: 2000 },
        benefits: { makerFeeDiscount: 20, takerFeeDiscount: 15, withdrawalFeeDiscount: 25, dailyWithdrawalLimit: 100000 },
    },
    platinum: {
        requirements: { tradingVolume30d: 200000, minBalance: 10000 },
        benefits: { makerFeeDiscount: 30, takerFeeDiscount: 25, withdrawalFeeDiscount: 50, dailyWithdrawalLimit: 500000 },
    },
    diamond: {
        requirements: { tradingVolume30d: 1000000, minBalance: 50000 },
        benefits: { makerFeeDiscount: 50, takerFeeDiscount: 40, withdrawalFeeDiscount: 75, dailyWithdrawalLimit: 2000000 },
    },
};

// GET /api/admin/vip-settings
export async function GET() {
    return NextResponse.json({ config: vipConfig });
}

// POST /api/admin/vip-settings
export async function POST(request: Request) {
    try {
        const updates = await request.json();

        vipConfig = {
            ...vipConfig,
            ...updates,
        };

        return NextResponse.json({
            success: true,
            config: vipConfig,
            message: 'VIP settings updated successfully',
        });
    } catch (error) {
        console.error('VIP settings update error:', error);
        return NextResponse.json(
            { error: 'Failed to update VIP settings' },
            { status: 500 }
        );
    }
}
