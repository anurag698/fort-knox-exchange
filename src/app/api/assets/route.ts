
import { NextResponse } from 'next/server';
import { queryItems, cosmosClient } from '@/lib/azure/cosmos';
import { Asset } from '@/lib/types';

// Mock data for when Cosmos DB is not configured  
const MOCK_ASSETS: any[] = [
    { id: 'BTC', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ETH', symbol: 'ETH', name: 'Ethereum' },
    { id: 'SOL', symbol: 'SOL', name: 'Solana' },
    { id: 'BNB', symbol: 'BNB', name: 'BNB' },
    { id: 'DOGE', symbol: 'DOGE', name: 'Dogecoin' },
    { id: 'USDT', symbol: 'USDT', name: 'Tether' },
];

export async function GET() {
    try {
        // If Cosmos DB is not configured, return mock data
        if (!cosmosClient) {
            console.log('[assets API] Using mock data (Cosmos DB not configured)');
            return NextResponse.json(MOCK_ASSETS);
        }

        const query = 'SELECT * FROM c ORDER BY c.name ASC';
        const assets = await queryItems<Asset>('assets', query);
        return NextResponse.json(assets);
    } catch (error: any) {
        console.error('Error fetching assets:', error);
        // Return mock data on error as fallback
        console.log('[assets API] Returning mock data due to error');
        return NextResponse.json(MOCK_ASSETS);
    }
}
