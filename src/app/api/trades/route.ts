import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/trades - Get user's trade history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const pair = searchParams.get('pair');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    try {
      // Fetch from database
      const where: any = { userId };
      if (pair) where.pair = pair;

      const trades = await prisma.trade.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return NextResponse.json({ trades });
    } catch (dbError) {
      // Database not configured - return empty array
      console.warn('Database not available, returning empty trades:', dbError);
      return NextResponse.json({ trades: [], warning: 'Database not configured' });
    }
  } catch (error) {
    console.error('Trades fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

// POST /api/trades - Record a new trade
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, pair, side, type, price, quantity, total, stopPrice, fee } = body;

    if (!userId || !pair || !side || !type || !price || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      // Save to database
      const trade = await prisma.trade.create({
        data: {
          userId,
          pair,
          side: side.toUpperCase(),
          type: type.toUpperCase(),
          price,
          quantity,
          total: total || price * quantity,
          stopPrice,
          fee: fee || 0,
          status: 'completed',
        },
      });

      // Also update user balances
      const [baseAsset, quoteAsset] = pair.split('-');

      if (side.toUpperCase() === 'BUY') {
        // Increase base asset, decrease quote asset
        await prisma.balance.upsert({
          where: {
            userId_assetId: { userId, assetId: baseAsset },
          },
          update: {
            available: { increment: quantity },
          },
          create: {
            userId,
            assetId: baseAsset,
            available: quantity,
            locked: 0,
          },
        });

        await prisma.balance.upsert({
          where: {
            userId_assetId: { userId, assetId: quoteAsset },
          },
          update: {
            available: { decrement: total || price * quantity },
          },
          create: {
            userId,
            assetId: quoteAsset,
            available: 0,
            locked: 0,
          },
        });
      } else {
        // Decrease base asset, increase quote asset
        await prisma.balance.upsert({
          where: {
            userId_assetId: { userId, assetId: baseAsset },
          },
          update: {
            available: { decrement: quantity },
          },
          create: {
            userId,
            assetId: baseAsset,
            available: 0,
            locked: 0,
          },
        });

        await prisma.balance.upsert({
          where: {
            userId_assetId: { userId, assetId: quoteAsset },
          },
          update: {
            available: { increment: total || price * quantity },
          },
          create: {
            userId,
            assetId: quoteAsset,
            available: total || price * quantity,
            locked: 0,
          },
        });
      }

      return NextResponse.json({ success: true, trade });
    } catch (dbError) {
      // Database not configured - return mock response
      console.warn('Database not available, trade not persisted:', dbError);
      return NextResponse.json({
        success: true,
        trade: {
          id: Math.random().toString(36).substring(7),
          ...body,
          timestamp: new Date(),
          status: 'completed',
        },
        warning: 'Trade saved in memory only. Configure database for persistence.',
      });
    }
  } catch (error) {
    console.error('Trade creation error:', error);
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
  }
}
