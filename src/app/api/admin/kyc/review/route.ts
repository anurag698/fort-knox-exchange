import { NextResponse } from 'next/server';
import { approveKYC, rejectKYC } from '@/services/kyc/kyc-service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, action, reason } = body;

        if (!userId || !action) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        let user;
        if (action === 'approve') {
            user = await approveKYC(userId);
        } else if (action === 'reject') {
            if (!reason) {
                return NextResponse.json(
                    { error: 'Rejection reason is required' },
                    { status: 400 }
                );
            }
            user = await rejectKYC(userId, reason);
        } else {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            status: 'success',
            message: `KYC ${action}d successfully`,
            user
        });
    } catch (error: any) {
        console.error('KYC review error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to review KYC' },
            { status: 500 }
        );
    }
}
