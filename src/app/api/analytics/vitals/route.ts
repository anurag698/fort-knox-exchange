import { NextResponse } from 'next/server';

// Simple endpoint to receive Web Vitals data
export async function POST(request: Request) {
    try {
        const metrics = await request.json();

        // In production, you would:
        // 1. Send to your analytics service (Google Analytics, Vercel Analytics, etc.)
        // 2. Store in a database
        // 3. Create alerts for poor performance

        // For now, just log
        console.log('[Web Vitals]', {
            name: metrics.name,
            value: metrics.value,
            rating: metrics.rating,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Web Vitals error:', error);
        return NextResponse.json({ error: 'Failed to log metrics' }, { status: 500 });
    }
}
