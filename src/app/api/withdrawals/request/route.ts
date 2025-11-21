import { NextResponse } from 'next/server';
import { requestWithdrawal } from '@/services/withdrawals/withdrawal-service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, chain, amount, destinationAddress } = body;

        if (!userId || !chain || !amount || !destinationAddress) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const withdrawal = await requestWithdrawal(
            userId,
            chain,
            parseFloat(amount),
            destinationAddress
        );

        return NextResponse.json({
            status: 'success',
            withdrawal
        });
    } catch (error: any) {
        console.error('Withdrawal request error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to request withdrawal' },
            { status: 500 }
        );
    }
}
