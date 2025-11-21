import { NextResponse } from 'next/server';
import { queryItems, upsertItem, deleteItem } from '@/lib/azure/cosmos';
import type { PriceAlert } from '@/lib/types';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const marketId = searchParams.get('marketId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        let query = 'SELECT * FROM c WHERE c.userId = @userId';
        const parameters: any[] = [{ name: '@userId', value: userId }];

        if (marketId) {
            query += ' AND c.marketId = @marketId';
            parameters.push({ name: '@marketId', value: marketId });
        }

        query += ' ORDER BY c.createdAt DESC';

        const alerts = await queryItems<PriceAlert>('price_alerts', query, parameters);

        return NextResponse.json(alerts);
    } catch (error: any) {
        console.error('Error fetching price alerts:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch price alerts' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, marketId, condition, price } = body;

        if (!userId || !marketId || !condition || price === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const alert: PriceAlert = {
            id: `${userId}-${marketId}-${Date.now()}`,
            userId,
            marketId,
            condition,
            price: Number(price),
            enabled: true,
            createdAt: new Date().toISOString(),
            lastTriggeredAt: null,
        };

        await upsertItem('price_alerts', alert, userId);

        return NextResponse.json(alert);
    } catch (error: any) {
        console.error('Error creating price alert:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create price alert' },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, userId, enabled } = body;

        if (!id || !userId || enabled === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const alert = await upsertItem<PriceAlert>('price_alerts', { id, enabled }, userId);

        return NextResponse.json(alert);
    } catch (error: any) {
        console.error('Error updating price alert:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update price alert' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const userId = searchParams.get('userId');

        if (!id || !userId) {
            return NextResponse.json(
                { error: 'id and userId are required' },
                { status: 400 }
            );
        }

        await deleteItem('price_alerts', id, userId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting price alert:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete price alert' },
            { status: 500 }
        );
    }
}
