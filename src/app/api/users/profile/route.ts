import { NextResponse } from 'next/server';
import { getItemById } from '@/lib/azure/cosmos';
import type { UserProfile } from '@/lib/types';

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

        const profile = await getItemById<UserProfile>('users', userId, userId);

        if (!profile) {
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(profile);
    } catch (error: any) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch user profile' },
            { status: 500 }
        );
    }
}
