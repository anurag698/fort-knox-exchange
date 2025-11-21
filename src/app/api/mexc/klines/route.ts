// Next.js API Route: /api/mexc/klines
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '1m';
    const limit = searchParams.get('limit') || '100';

    // Map frontend intervals to MEXC API format
    const intervalMap: Record<string, string> = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '30m': '30m',
        '1H': '60m',
        '4H': '4h',
        '1D': '1d',
    };

    const mexcInterval = intervalMap[interval] || '1m';

    if (!symbol) {
        return NextResponse.json(
            { error: 'Symbol parameter is required' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(
            `https://api.mexc.com/api/v3/klines?symbol=${symbol}&interval=${mexcInterval}&limit=${limit}`
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch from MEXC' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('MEXC API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
