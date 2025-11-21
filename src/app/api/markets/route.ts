
import { NextResponse } from 'next/server';
import { queryItems, cosmosClient } from '@/lib/azure/cosmos';
import { Market } from '@/lib/types';

// Mock data for when Cosmos DB is not configured
const MOCK_MARKETS: any[] = [
    { id: 'BTC-USDT', baseAssetId: 'BTC', quoteAssetId: 'USDT' },
    { id: 'ETH-USDT', baseAssetId: 'ETH', quoteAssetId: 'USDT' },
    { id: 'SOL-USDT', baseAssetId: 'SOL', quoteAssetId: 'USDT' },
    { id: 'BNB-USDT', baseAssetId: 'BNB', quoteAssetId: 'USDT' },
    { id: 'DOGE-USDT', baseAssetId: 'DOGE', quoteAssetId: 'USDT' },
];

export async function GET() {
    try {
        // If Cosmos DB is not configured, return mock data
        if (!cosmosClient) {
            console.log('[markets API] Using mock data (Cosmos DB not configured)');
            return NextResponse.json(MOCK_MARKETS);
        }

        const query = 'SELECT * FROM c ORDER BY c.id ASC';
        const markets = await queryItems<Market>('markets', query);
        return NextResponse.json(markets);
    } catch (error: any) {
        console.error('Error fetching markets:', error);
        // Return mock data on error as fallback
        console.log('[markets API] Returning mock data due to error');
        return NextResponse.json(MOCK_MARKETS);
    }
}
