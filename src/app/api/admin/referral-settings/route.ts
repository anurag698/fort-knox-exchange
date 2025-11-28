import { NextResponse } from 'next/server';

// Referral settings storage
let referralSettings = {
    enabled: true,
    defaultCommissionRate: 20,
    tier1Rate: 20,
    tier2Rate: 25,
    tier3Rate: 30,
    tier4Rate: 35,
    tier1Threshold: 10,
    tier2Threshold: 50,
    tier3Threshold: 100,
    minimumWithdrawal: 10,
    cookieDuration: 30,
};

// GET /api/admin/referral-settings
export async function GET() {
    return NextResponse.json({ settings: referralSettings });
}

// POST /api/admin/referral-settings
export async function POST(request: Request) {
    try {
        const updates = await request.json();

        referralSettings = {
            ...referralSettings,
            ...updates,
        };

        return NextResponse.json({
            success: true,
            settings: referralSettings,
            message: 'Referral settings updated successfully',
        });
    } catch (error) {
        console.error('Referral settings update error:', error);
        return NextResponse.json(
            { error: 'Failed to update referral settings' },
            { status: 500 }
        );
    }
}
