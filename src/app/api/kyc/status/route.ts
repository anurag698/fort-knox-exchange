import { NextResponse } from 'next/server';
import { getKYCStatus } from '@/services/kyc/kyc-service';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        const user = await getKYCStatus(userId);

        return NextResponse.json({
            status: 'success',
            kycStatus: user?.kycStatus || 'none',
            rejectionReason: user?.kycData?.rejectionReason
        });
    } catch (error: any) {
        console.error('KYC status error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch KYC status' },
            { status: 500 }
        );
    }
}
