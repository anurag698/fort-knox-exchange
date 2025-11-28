import { NextResponse } from 'next/server';

// In-memory storage for demo (replace with database in production)
let exchangeSettings = {
    // Branding
    exchangeName: 'Fort Knox Exchange',
    tagline: 'Secure Crypto Trading',
    logoUrl: '/logo.png',
    primaryColor: '#8B5CF6',

    // Trading Fees (in percentage)
    makerFee: 0.1,
    takerFee: 0.15,

    // Withdrawal Settings
    minWithdrawal: 10,
    withdrawalFeePercentage: 0.5,

    // Trading Limits
    maxDailyTradingVolume: 100000,
    maxSingleOrderSize: 50000,
    minOrderSize: 1,

    // Feature Toggles
    enableSpotTrading: true,
    enableMarginTrading: false,
    enableFutures: false,
    enableStaking: false,
    enableP2P: false,
    enableCopyTrading: true,

    // System
    maintenanceMode: false,
    tradingHalted: false,
    kycRequired: true,
    twoFactorRequired: false,

    // Announcements
    systemAnnouncement: '',
    announcementEnabled: false,
};

// GET /api/admin/settings
export async function GET() {
    return NextResponse.json({ settings: exchangeSettings });
}

// POST /api/admin/settings
export async function POST(request: Request) {
    try {
        const updates = await request.json();

        // Merge updates with existing settings
        exchangeSettings = {
            ...exchangeSettings,
            ...updates,
        };

        return NextResponse.json({
            success: true,
            settings: exchangeSettings,
            message: 'Settings updated successfully',
        });
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
