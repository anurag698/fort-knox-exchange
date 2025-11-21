import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, marketId, side, price, quantity, timeInForce = 'GTC' } = body;

        if (!userId || !marketId || !side || !price || !quantity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        try {
            // Create order in database
            const order = await prisma.order.create({
                data: {
                    userId,
                    marketId,
                    side,
                    type: 'LIMIT',
                    price: parseFloat(price),
                    quantity: parseFloat(quantity),
                    timeInForce,
                    status: 'OPEN',
                },
            });

            return NextResponse.json({
                success: true,
                order,
                message: 'Limit order placed successfully'
            });
        } catch (dbError) {
            console.warn('Database not available, using mock order:', dbError);
            // Return mock success
            return NextResponse.json({
                success: true,
                order: {
                    id: `order_${Date.now()}`,
                    userId,
                    marketId,
                    side,
                    type: 'LIMIT',
                    price: parseFloat(price),
                    quantity: parseFloat(quantity),
                    status: 'OPEN',
                    createdAt: new Date(),
                },
                warning: 'Mock order - configure database for real trading',
            });
        }
    } catch (error) {
        console.error('Limit order error:', error);
        return NextResponse.json({ error: 'Failed to place limit order' }, { status: 500 });
    }
}
