import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { pair, side, price, quantity, total, type, stopPrice } = body;

        // Validate request
        if (!pair || !side || !price || !quantity) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulate success (90% chance) or random failure
        const isSuccess = Math.random() > 0.1;

        if (!isSuccess) {
            return NextResponse.json(
                { error: 'Market volatility too high. Please try again.' },
                { status: 422 }
            );
        }

        const trade = {
            id: Math.random().toString(36).substring(7),
            pair,
            side,
            price,
            quantity,
            total: total || price * quantity,
            type: type || 'LIMIT',
            stopPrice,
            timestamp: Date.now(),
            status: 'completed',
        };

        return NextResponse.json({ success: true, trade });
    } catch (error) {
        console.error('Trade execution error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
