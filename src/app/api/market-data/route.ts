import { NextResponse } from 'next/server';
import { queryItems } from '@/lib/azure/cosmos';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const query = 'SELECT * FROM c';
        const marketData = await queryItems('market_data', query);

        // Convert array to object with id as key for easy lookup
        const dataMap = marketData.reduce((acc: any, item: any) => {
            acc[item.id] = item;
            return acc;
        }, {});

        return NextResponse.json(dataMap);
    } catch (error: any) {
        console.error('Error fetching market data:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch market data' },
            { status: 500 }
        );
    }
}
