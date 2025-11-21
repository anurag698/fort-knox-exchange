import { NextResponse } from 'next/server';
import { queryItems } from '@/lib/azure/cosmos';

export async function GET() {
    try {
        // Get all balances to find the user
        const query = 'SELECT * FROM c';
        const balances = await queryItems('balances', query);

        return NextResponse.json(balances);
    } catch (error: any) {
        console.error('Error fetching all balances:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
