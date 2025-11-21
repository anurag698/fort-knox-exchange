import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/auth/2fa/status - Check if 2FA is enabled for a user
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { twoFactorEnabled: true },
            });

            return NextResponse.json({
                enabled: user?.twoFactorEnabled || false
            });
        } catch (dbError) {
            console.warn('Database not available, returning mock 2FA status:', dbError);
            // Mock: return false by default, or true if we want to test 2FA flow
            return NextResponse.json({
                enabled: false,
                warning: 'Using mock 2FA status (DB unavailable).'
            });
        }
    } catch (error) {
        console.error('2FA status fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch 2FA status' }, { status: 500 });
    }
}
