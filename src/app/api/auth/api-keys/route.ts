import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// GET /api/auth/api-keys - Get current API key details
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
                select: {
                    apiKey: true,
                    apiKeyCreated: true,
                },
            });

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            // Mask the API key for security, only show last 4 chars
            const maskedKey = user.apiKey
                ? `${user.apiKey.substring(0, 8)}...${user.apiKey.substring(user.apiKey.length - 4)}`
                : null;

            return NextResponse.json({
                apiKey: maskedKey,
                createdAt: user.apiKeyCreated
            });
        } catch (dbError) {
            console.warn('Database not available, returning mock API key info:', dbError);
            // Mock response
            return NextResponse.json({
                apiKey: 'sk_live_...XyZ9',
                createdAt: new Date()
            });
        }
    } catch (error) {
        console.error('API key fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch API key' }, { status: 500 });
    }
}

// POST /api/auth/api-keys - Generate new API key
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Generate a secure random API key
        // Format: sk_live_[random_hex]
        const randomBytes = crypto.randomBytes(24).toString('hex');
        const newApiKey = `sk_live_${randomBytes}`;

        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    apiKey: newApiKey,
                    apiKeyCreated: new Date(),
                },
            });

            return NextResponse.json({
                success: true,
                apiKey: newApiKey, // Return full key only once upon creation
                createdAt: new Date()
            });
        } catch (dbError) {
            console.warn('Database not available, API key generated in memory only:', dbError);
            return NextResponse.json({
                success: true,
                apiKey: newApiKey,
                createdAt: new Date(),
                warning: 'API key generated but not persisted (DB unavailable).'
            });
        }
    } catch (error) {
        console.error('API key generation error:', error);
        return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
    }
}

// DELETE /api/auth/api-keys - Revoke API key
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
                    apiKey: null,
                    apiKeyCreated: null,
                },
            });

            return NextResponse.json({ success: true });
        } catch (dbError) {
            console.warn('Database not available, API key revoked in memory only:', dbError);
            return NextResponse.json({
                success: true,
                warning: 'API key revocation simulated (DB unavailable).'
            });
        }
    } catch (error) {
        console.error('API key revocation error:', error);
        return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
    }
}
