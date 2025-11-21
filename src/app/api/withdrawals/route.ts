
import { NextResponse } from 'next/server';
import { queryItems } from '@/lib/azure/cosmos';
import { Withdrawal } from '@/lib/types';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        let query = 'SELECT * FROM c';
        const parameters: any[] = [];
        const conditions: string[] = [];

        if (userId) {
            conditions.push('c.userId = @userId');
            parameters.push({ name: '@userId', value: userId });
        }

        if (status) {
            conditions.push('c.status = @status');
            parameters.push({ name: '@status', value: status });
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY c.createdAt DESC';

        const withdrawals = await queryItems<Withdrawal>('withdrawals', query, parameters);

        return NextResponse.json(withdrawals);
    } catch (error: any) {
        console.error('Error fetching withdrawals:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch withdrawals' },
            { status: 500 }
        );
    }
}
