import { NextResponse } from 'next/server';

// Extended trade history with more data
const mockTradeHistory = [
    {
        id: '1',
        date: new Date().toISOString(),
        pair: 'BTC/USDT',
        type: 'BUY',
        side: 'MARKET',
        amount: 0.5,
        price: 65000,
        total: 32500,
        fee: 48.75,
        profit: 1500,
        profitPercentage: 4.6,
        status: 'completed',
    },
    {
        id: '2',
        date: new Date(Date.now() - 86400000).toISOString(),
        pair: 'ETH/USDT',
        type: 'SELL',
        side: 'LIMIT',
        amount: 10,
        price: 3500,
        total: 35000,
        fee: 52.5,
        profit: 2500,
        profitPercentage: 7.7,
        status: 'completed',
    },
    {
        id: '3',
        date: new Date(Date.now() - 172800000).toISOString(),
        pair: 'BNB/USDT',
        type: 'BUY',
        side: 'MARKET',
        amount: 50,
        price: 580,
        total: 29000,
        fee: 43.5,
        profit: -500,
        profitPercentage: -1.7,
        status: 'completed',
    },
    {
        id: '4',
        date: new Date(Date.now() - 259200000).toISOString(),
        pair: 'SOL/USDT',
        type: 'SELL',
        side: 'LIMIT',
        amount: 100,
        price: 125,
        total: 12500,
        fee: 18.75,
        profit: 800,
        profitPercentage: 6.8,
        status: 'completed',
    },
    // Add more mock trades...
];

// GET /api/portfolio/history
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'user1';
        const pair = searchParams.get('pair'); // Filter by pair
        const type = searchParams.get('type'); // Filter by type (BUY/SELL)
        const limit = parseInt(searchParams.get('limit') || '50');

        let filtered = [...mockTradeHistory];

        if (pair) {
            filtered = filtered.filter(trade => trade.pair === pair);
        }

        if (type) {
            filtered = filtered.filter(trade => trade.type === type);
        }

        filtered = filtered.slice(0, limit);

        return NextResponse.json({
            success: true,
            trades: filtered,
            total: filtered.length,
        });
    } catch (error) {
        console.error('Trade history fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trade history' },
            { status: 500 }
        );
    }
}
