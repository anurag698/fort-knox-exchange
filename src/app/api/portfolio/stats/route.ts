import { NextResponse } from 'next/server';

export interface PortfolioStats {
    totalValue: number;
    totalProfit: number;
    totalProfitPercentage: number;
    totalTrades: number;
    winRate: number;
    bestAsset: {
        symbol: string;
        profit: number;
        profitPercentage: number;
    };
    worstAsset: {
        symbol: string;
        loss: number;
        lossPercentage: number;
    };
}

export interface AssetAllocation {
    symbol: string;
    value: number;
    percentage: number;
    profit: number;
}

export interface PerformanceData {
    date: string;
    value: number;
    profit: number;
}

export interface TradeHistory {
    id: string;
    date: string;
    pair: string;
    type: 'BUY' | 'SELL';
    side: 'MARKET' | 'LIMIT';
    amount: number;
    price: number;
    total: number;
    fee: number;
    profit?: number;
    profitPercentage?: number;
}

// Mock portfolio data
const mockPortfolioStats: PortfolioStats = {
    totalValue: 125430.50,
    totalProfit: 25430.50,
    totalProfitPercentage: 25.4,
    totalTrades: 342,
    winRate: 68.5,
    bestAsset: {
        symbol: 'BTC',
        profit: 15200,
        profitPercentage: 42.3,
    },
    worstAsset: {
        symbol: 'DOGE',
        loss: -1250,
        lossPercentage: -8.2,
    },
};

const mockAssetAllocation: AssetAllocation[] = [
    { symbol: 'BTC', value: 65000, percentage: 51.8, profit: 15200 },
    { symbol: 'ETH', value: 35000, percentage: 27.9, profit: 8500 },
    { symbol: 'USDT', value: 20000, percentage: 15.9, profit: 0 },
    { symbol: 'BNB', value: 5430.50, percentage: 4.3, profit: 1730.50 },
];

const mockPerformanceData: PerformanceData[] = [
    { date: '2024-10-01', value: 100000, profit: 0 },
    { date: '2024-10-08', value: 102500, profit: 2500 },
    { date: '2024-10-15', value: 108000, profit: 8000 },
    { date: '2024-10-22', value: 115500, profit: 15500 },
    { date: '2024-10-29', value: 121000, profit: 21000 },
    { date: '2024-11-05', value: 125430.50, profit: 25430.50 },
];

const mockTradeHistory: TradeHistory[] = [
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
    },
];

// GET /api/portfolio/stats
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'user1';
        const timeframe = searchParams.get('timeframe') || '7d'; // 1d, 7d, 30d, all

        return NextResponse.json({
            success: true,
            stats: mockPortfolioStats,
            allocation: mockAssetAllocation,
            performance: mockPerformanceData,
            recentTrades: mockTradeHistory.slice(0, 5),
        });
    } catch (error) {
        console.error('Portfolio stats fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch portfolio stats' },
            { status: 500 }
        );
    }
}
