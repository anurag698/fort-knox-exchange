
import { NextResponse } from 'next/server';
import { queryItems } from '@/lib/azure/cosmos';
import { Deposit } from '@/lib/types';

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

        const deposits = await queryItems<Deposit>('deposits', query, parameters);

        return NextResponse.json(deposits);
    } catch (error: any) {
        console.error('Error fetching deposits:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch deposits' },
            { status: 500 }
        );
    }
}
