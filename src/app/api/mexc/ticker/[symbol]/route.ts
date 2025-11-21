// Next.js API Route: /api/mexc/ticker/[symbol]
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;

    try {
        const response = await fetch(
            `https://api.mexc.com/api/v3/ticker/24hr?symbol=${symbol}`
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
