
import { NextResponse } from 'next/server';
import { queryItems } from '@/lib/azure/cosmos';
import { UserProfile } from '@/lib/types';

export async function GET() {
    try {
        const query = 'SELECT * FROM c ORDER BY c.createdAt DESC';
        const users = await queryItems<UserProfile>('users', query);
        return NextResponse.json(users);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
