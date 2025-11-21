import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';
import { prisma } from '@/lib/prisma';

// POST /api/auth/2fa/verify-login - Verify token for login
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, token } = body;

        if (!userId || !token) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        try {
            // Fetch user's secret from DB
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { twoFactorSecret: true, twoFactorEnabled: true },
            });

            if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
                return NextResponse.json({ error: '2FA not enabled for this user' }, { status: 400 });
            }

            // Verify the token
            const totp = new OTPAuth.TOTP({
                issuer: 'Fort Knox Exchange',
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
            });

            const delta = totp.validate({ token, window: 1 });

            if (delta === null) {
                return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
            }

            // Token is valid
            // We could also create a session record here if we wanted strict session management

            return NextResponse.json({ success: true });

        } catch (dbError) {
            console.warn('Database not available, verifying against mock secret:', dbError);

            // Mock verification for testing without DB
            // Accept '123456' as valid code for mock
            if (token === '123456') {
                return NextResponse.json({ success: true, warning: 'Mock verification success' });
            }

            return NextResponse.json({ error: 'Invalid code (Mock: use 123456)' }, { status: 401 });
        }

    } catch (error) {
        console.error('2FA login verification error:', error);
        return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
    }
}
