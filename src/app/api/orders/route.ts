import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/orders - Get user orders
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        try {
            const where: any = { userId };

            if (status) {
                // Handle multiple statuses (e.g., "OPEN,PARTIAL")
                const statuses = status.split(',');
                where.status = { in: statuses };
            }

            const orders = await prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: 100,
            });

            return NextResponse.json({ orders });
        } catch (dbError) {
            console.warn('Database not available, returning empty orders:', dbError);
            return NextResponse.json({
                orders: [],
                warning: 'Database not configured. Configure DATABASE_URL for real data.',
            });
        }
    } catch (error) {
        console.error('Orders fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// DELETE /api/orders?orderId=... - Cancel an order
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        try {
            const order = await prisma.order.update({
                where: { id: orderId },
                data: { status: 'CANCELED' },
            });

            return NextResponse.json({ success: true, order });
        } catch (dbError) {
            console.warn('Database not available, mock cancel:', dbError);
            return NextResponse.json({
                success: true,
                message: 'Order canceled (mock)',
                warning: 'Database not configured',
            });
        }
    } catch (error) {
        console.error('Order cancel error:', error);
        return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }
}
