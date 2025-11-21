// Next.js API Route: Proxy for MEXC 24hr ticker
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    try {
        const response = await fetch(
            `https://api.mexc.com/api/v3/ticker/24hr?symbol=${symbol}`,
            { cache: 'no-store' }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'MEXC API error' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('MEXC ticker error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch ticker' },
            { status: 500 }
        );
    }
}
