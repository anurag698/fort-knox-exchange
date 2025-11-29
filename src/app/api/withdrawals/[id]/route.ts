
import { NextResponse } from 'next/server';
import { getItemById } from '@/lib/azure/cosmos';
import { Withdrawal } from '@/lib/types';
import { NextRequest } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Withdrawal ID is required' },
                { status: 400 }
            );
        }

        const withdrawal = await getItemById<Withdrawal>('withdrawals', id, id);

        if (!withdrawal) {
            return NextResponse.json(
                { error: 'Withdrawal not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(withdrawal);
    } catch (error: any) {
        console.error('Error fetching withdrawal:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch withdrawal' },
            { status: 500 }
        );
    }
}
