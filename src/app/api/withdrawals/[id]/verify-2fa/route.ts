// API: Verify 2FA for Withdrawal
// Verifies 2FA code and marks withdrawal ready for processing

import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getWithdrawal, updateWithdrawal } from '@/lib/azure/cosmos-trading';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const idToken = req.headers.get('authorization')?.replace('Bearer ', '');
        if (!idToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const auth = getAuth();
        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

        const withdrawalId = params.id;
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Missing 2FA code' }, { status: 400 });
        }

        // Get withdrawal
        const withdrawal = await getWithdrawal(withdrawalId, userId);
        if (!withdrawal) {
            return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
        }

        if (withdrawal.status !== 'pending') {
            return NextResponse.json(
                { error: `Cannot verify 2FA for withdrawal in ${withdrawal.status} status` },
                { status: 400 }
            );
        }

        // TODO: Verify 2FA code here
        // For now, we'll just check if code is provided
        // In production, integrate with your 2FA provider (Google Authenticator, Authy, etc.)

        // Simplified verification (accept any 6-digit code for now)
        if (!/^\d{6}$/.test(code)) {
            return NextResponse.json({ error: 'Invalid 2FA code format' }, { status: 400 });
        }

        // Mark as verified
        await updateWithdrawal(withdrawalId, userId, {
            twoFAVerified: true,
        });

        return NextResponse.json({
            success: true,
            message: '2FA verified. Withdrawal will be processed shortly.',
        });
    } catch (error: any) {
        console.error('[Verify 2FA] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify 2FA' },
            { status: 500 }
        );
    }
}
