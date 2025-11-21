
import { NextResponse } from 'next/server';
import { queryItems } from '@/lib/azure/cosmos';
import { LedgerEntry } from '@/lib/types';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        const query = 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC';
        const parameters = [{ name: '@userId', value: userId }];

        const ledgerEntries = await queryItems<LedgerEntry>('ledger', query, parameters);

        return NextResponse.json(ledgerEntries);
    } catch (error: any) {
        console.error('Error fetching ledger:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch ledger' },
            { status: 500 }
        );
    }
}
