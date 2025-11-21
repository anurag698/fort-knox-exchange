import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/azure/cosmos';

export async function GET() {
    try {
        console.log('Initializing Cosmos DB...');
        await initializeDatabase();

        return NextResponse.json({
            status: 'success',
            message: 'Cosmos DB initialized successfully',
            database: 'fortknox',
            containers: [
                'users',
                'balances',
                'orders',
                'trades',
                'markets',
                'market_data'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Cosmos DB initialization error:', error);
        return NextResponse.json(
            {
                status: 'error',
                error: error.message,
                details: error.stack
            },
            { status: 500 }
        );
    }
}
