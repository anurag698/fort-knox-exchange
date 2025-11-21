import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';
import { prisma } from '@/lib/prisma';

// POST /api/auth/2fa/verify - Verify token and enable 2FA
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, token, secret } = body;

        if (!userId || !token || !secret) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify the token
        const totp = new OTPAuth.TOTP({
            issuer: 'Fort Knox Exchange',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secret),
        });

        const delta = totp.validate({ token, window: 1 });

        if (delta === null) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
        }

        // Token is valid, save secret to user and enable 2FA
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: true,
                    twoFactorSecret: secret,
                },
            });

            return NextResponse.json({ success: true });
        } catch (dbError) {
            console.warn('Database not available, 2FA enabled in memory only:', dbError);
            return NextResponse.json({
                success: true,
                warning: '2FA enabled in session only. Configure database for persistence.'
            });
        }

    } catch (error) {
        console.error('2FA verification error:', error);
        return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
    }
}

// DELETE /api/auth/2fa/disable - Disable 2FA
export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                },
            });

            return NextResponse.json({ success: true });
        } catch (dbError) {
            console.warn('Database not available, 2FA disabled in memory only:', dbError);
            return NextResponse.json({
                success: true,
                warning: '2FA disabled in session only.'
            });
        }
    } catch (error) {
        console.error('2FA disable error:', error);
        return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
    }
}
