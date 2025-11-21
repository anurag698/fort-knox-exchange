import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';
import { prisma } from '@/lib/prisma';

// POST /api/auth/2fa/generate - Generate a new 2FA secret
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, email } = body;

        if (!userId || !email) {
            return NextResponse.json({ error: 'User ID and email required' }, { status: 400 });
        }

        // Generate a new TOTP object
        const totp = new OTPAuth.TOTP({
            issuer: 'Fort Knox Exchange',
            label: email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: new OTPAuth.Secret(), // Generates a random secret
        });

        const secret = totp.secret.base32;
        const otpauthUrl = totp.toString();

        // In a real app, we might store this temporarily or just return it to be verified
        // We don't save it to the user record yet until they verify it

        return NextResponse.json({
            secret,
            otpauthUrl
        });

    } catch (error) {
        console.error('2FA generation error:', error);
        return NextResponse.json({ error: 'Failed to generate 2FA secret' }, { status: 500 });
    }
}
