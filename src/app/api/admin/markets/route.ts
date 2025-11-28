import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/markets - List all markets
export async function GET() {
    try {
        const markets = await prisma.market.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            markets,
            total: markets.length,
        });
    } catch (error) {
        // Fallback to mock data if database is not configured
        const mockMarkets = [
            {
                id: 'BTC-USDT',
                baseAsset: 'BTC',
                quoteAsset: 'USDT',
                minQuantity: 0.0001,
                maxQuantity: 1000,
                minPrice: 1,
                maxPrice: 1000000,
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'ETH-USDT',
                baseAsset: 'ETH',
                quoteAsset: 'USDT',
                minQuantity: 0.001,
                maxQuantity: 10000,
                minPrice: 0.1,
                maxPrice: 100000,
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        return NextResponse.json({
            markets: mockMarkets,
            total: mockMarkets.length,
            warning: 'Using mock data - database not configured',
        });
    }
}

// POST /api/admin/markets - Create new market/token listing
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            baseAsset,
            quoteAsset,
            minQuantity,
            maxQuantity,
            minPrice,
            maxPrice,
            status = 'ACTIVE',
        } = body;

        // Validate required fields
        if (!baseAsset || !quoteAsset) {
            return NextResponse.json(
                { error: 'Base asset and quote asset are required' },
                { status: 400 }
            );
        }

        const marketId = `${baseAsset}-${quoteAsset}`;

        const market = await prisma.market.create({
            data: {
                id: marketId,
                baseAsset,
                quoteAsset,
                minQuantity: minQuantity || 0.0001,
                maxQuantity: maxQuantity || 1000000,
                minPrice: minPrice || 0.0001,
                maxPrice: maxPrice || 1000000,
                status,
            },
        });

        return NextResponse.json({ success: true, market });
    } catch (error: any) {
        console.error('Market creation error:', error);

        // If database is not configured, return mock response
        if (error?.code === 'P1001' || error?.code === 'P2002') {
            return NextResponse.json({
                success: false,
                error: 'Database not configured or market already exists',
                mock: true,
            });
        }

        return NextResponse.json(
            { error: 'Failed to create market' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/markets - Delete a market
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const marketId = searchParams.get('marketId');

        if (!marketId) {
            return NextResponse.json(
                { error: 'Market ID is required' },
                { status: 400 }
            );
        }

        await prisma.market.delete({
            where: { id: marketId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Market deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete market' },
            { status: 500 }
        );
    }
}
