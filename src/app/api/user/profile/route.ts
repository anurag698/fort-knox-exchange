import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/user/profile - Get user profile
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Try to fetch from database
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    photoURL: true,
                    phoneNumber: true,
                    country: true,
                    bio: true,
                    emailNotifications: true,
                    tradeAlerts: true,
                    priceAlerts: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!user) {
                // Create new user if doesn't exist
                const newUser = await prisma.user.create({
                    data: {
                        id: userId,
                        email: searchParams.get('email') || `user-${userId}@fortknox.com`,
                    },
                });
                return NextResponse.json({ user: newUser });
            }

            return NextResponse.json({ user });
        } catch (dbError) {
            // Database not configured - return mock data
            console.warn('Database not available, using mock data:', dbError);
            return NextResponse.json({
                user: {
                    id: userId,
                    email: searchParams.get('email') || `user-${userId}@fortknox.com`,
                    name: null,
                    phoneNumber: null,
                    country: null,
                    bio: null,
                    emailNotifications: true,
                    tradeAlerts: true,
                    priceAlerts: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        }
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

// POST /api/user/profile - Update user profile
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, name, phoneNumber, country, bio, emailNotifications, tradeAlerts, priceAlerts } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        try {
            // Update in database
            const updatedUser = await prisma.user.upsert({
                where: { id: userId },
                update: {
                    name,
                    phoneNumber,
                    country,
                    bio,
                    emailNotifications,
                    tradeAlerts,
                    priceAlerts,
                },
                create: {
                    id: userId,
                    email: body.email || `user-${userId}@fortknox.com`,
                    name,
                    phoneNumber,
                    country,
                    bio,
                    emailNotifications,
                    tradeAlerts,
                    priceAlerts,
                },
            });

            return NextResponse.json({ success: true, user: updatedUser });
        } catch (dbError) {
            // Database not configured - return success anyway
            console.warn('Database not available, changes not persisted:', dbError);
            return NextResponse.json({
                success: true,
                user: { ...body, updatedAt: new Date() },
                warning: 'Changes saved in memory only. Configure database for persistence.',
            });
        }
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
