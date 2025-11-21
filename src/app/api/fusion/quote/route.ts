import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fusionPlusService } from '@/lib/1inch/fusion-plus.service';

const quoteSchema = z.object({
    fromToken: z.string(),
    toToken: z.string(),
    fromChain: z.coerce.number().int().positive(),
    toChain: z.coerce.number().int().positive(),
    amount: z.string().regex(/^\d+$/),
    walletAddress: z.string().optional(),
    enableEstimate: z.coerce.boolean().optional(),
});

/**
 * GET /api/fusion/quote
 * Get a cross-chain swap quote from Fusion+
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const validation = quoteSchema.safeParse({
            fromToken: searchParams.get('fromToken'),
            toToken: searchParams.get('toToken'),
            fromChain: searchParams.get('fromChain'),
            toChain: searchParams.get('toChain'),
            amount: searchParams.get('amount'),
            walletAddress: searchParams.get('walletAddress'),
            enableEstimate: searchParams.get('enableEstimate'),
        });

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid parameters', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const quote = await fusionPlusService.getQuote(validation.data);

        return NextResponse.json(quote);
    } catch (error) {
        console.error('Fusion+ quote error:', error);
        return NextResponse.json(
            { error: 'Failed to get Fusion+ quote', message: (error as Error).message },
            { status: 500 }
        );
    }
}
