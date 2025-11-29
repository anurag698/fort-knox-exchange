import { NextResponse, NextRequest } from 'next/server';
import { cancelWithdrawal } from '@/services/withdrawals/withdrawal-service';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await req.json();
        const { userId } = body;
        const { id } = await params;

        if (!userId || !id) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const withdrawal = await cancelWithdrawal(id, userId);

        return NextResponse.json({
            status: 'success',
            withdrawal
        });
    } catch (error: any) {
        console.error('Cancel withdrawal error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to cancel withdrawal' },
            { status: 500 }
        );
    }
}
