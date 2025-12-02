import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        // Validate input
        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Name, email and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                emailVerified: false,
            },
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            user: userWithoutPassword,
            message: 'Account created successfully'
        }, { status: 201 });

    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
        );
    }
}
