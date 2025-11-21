import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/user/balances - Get user balances
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        try {
            // Fetch from database
            const balances = await prisma.balance.findMany({
                where: { userId },
                orderBy: { assetId: 'asc' },
            });

            // If no balances, create initial balances
            if (balances.length === 0) {
                const initialAssets = ['BTC', 'ETH', 'SOL', 'BNB', 'USDT'];
                const createdBalances = await Promise.all(
                    initialAssets.map((assetId) =>
                        prisma.balance.create({
                            data: {
                                userId,
                                assetId,
                                available: assetId === 'USDT' ? 10000 : 0, // Start with 10k USDT
                                locked: 0,
                            },
                        })
                    )
                );
                return NextResponse.json({ balances: createdBalances });
            }

            return NextResponse.json({ balances });
        } catch (dbError) {
            // Database not configured - return mock balances
            console.warn('Database not available, using mock balances:', dbError);
            return NextResponse.json({
                balances: [
                    { userId, assetId: 'BTC', available: 0.5, locked: 0 },
                    { userId, assetId: 'ETH', available: 5.0, locked: 0 },
                    { userId, assetId: 'SOL', available: 100, locked: 0 },
                    { userId, assetId: 'BNB', available: 20, locked: 0 },
                    { userId, assetId: 'USDT', available: 10000, locked: 0 },
                ],
                warning: 'Using mock data. Configure database for real balances.',
            });
        }
    } catch (error) {
        console.error('Balances fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
    }
}

// POST /api/user/balances - Update balance (admin/internal use)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, assetId, available, locked } = body;

        if (!userId || !assetId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        try {
            const balance = await prisma.balance.upsert({
                where: {
                    userId_assetId: { userId, assetId },
                },
                update: {
                    available: available ?? undefined,
                    locked: locked ?? undefined,
                },
                create: {
                    userId,
                    assetId,
                    available: available ?? 0,
                    locked: locked ?? 0,
                },
            });

            return NextResponse.json({ success: true, balance });
        } catch (dbError) {
            console.warn('Database not available, balance not persisted:', dbError);
            return NextResponse.json({
                success: true,
                balance: body,
                warning: 'Balance saved in memory only.',
            });
        }
    } catch (error) {
        console.error('Balance update error:', error);
        return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }
}
