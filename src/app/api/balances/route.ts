import { NextResponse } from 'next/server';
import { getUserBalances } from '@/lib/azure/cosmos-trading';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json(
            { status: 'error', error: 'UserId is required' },
            { status: 400 }
        );
    }

    try {
        const balances = await getUserBalances(userId);
        return NextResponse.json({
            status: 'success',
            balances
        });
    } catch (error: any) {
        console.error('Failed to fetch balances:', error);
        return NextResponse.json(
            { status: 'error', error: error.message },
            { status: 500 }
        );
    }
}
