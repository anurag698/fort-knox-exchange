import { NextResponse } from 'next/server';
import { submitKYC } from '@/services/kyc/kyc-service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, email, data } = body;

        if (!userId || !email || !data) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Basic validation
        if (!data.fullName || !data.idNumber || !data.documents?.front || !data.documents?.selfie) {
            return NextResponse.json(
                { error: 'Missing required KYC data' },
                { status: 400 }
            );
        }

        const user = await submitKYC(userId, email, data);

        return NextResponse.json({
            status: 'success',
            message: 'KYC submitted successfully',
            user
        });
    } catch (error: any) {
        console.error('KYC submission error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to submit KYC' },
            { status: 500 }
        );
    }
}
