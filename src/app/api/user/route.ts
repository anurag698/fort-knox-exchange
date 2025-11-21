
import { NextResponse } from 'next/server';
import { getItemById } from '@/lib/azure/cosmos';
import { UserProfile } from '@/lib/types';

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

        const user = await getItemById<UserProfile>('users', userId, userId);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch user' },
            { status: 500 }
        );
    }
}
