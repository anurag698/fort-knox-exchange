
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { dexService } from '@/lib/dex/dex.service';
import type { OneInchQuoteResponse } from '@/lib/dex/dex.types';

const quoteSchema = z.object({
  chainId: z.coerce.number().int().positive(),
  fromTokenAddress: z.string(),
  toTokenAddress: z.string(),
  amount: z.string().regex(/^\d+$/), // amount in wei
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const validation = quoteSchema.safeParse({
    chainId: searchParams.get('chainId'),
    fromTokenAddress: searchParams.get('fromTokenAddress'),
    toTokenAddress: searchParams.get('toTokenAddress'),
    amount: searchParams.get('amount'),
  });

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }
  
  if (validation.data.fromTokenAddress.toLowerCase() === validation.data.toTokenAddress.toLowerCase()) {
    const amount = validation.data.amount;
    const tokenInfo = {
        address: validation.data.fromTokenAddress,
        symbol: 'USDT',
        name: 'Tether',
        decimals: 6,
        logoURI: `https://tokens.1inch.io/${validation.data.fromTokenAddress.toLowerCase()}.png`,
        tags: []
    };
    const mockResponse: OneInchQuoteResponse = {
        fromToken: tokenInfo,
        toToken: tokenInfo,
        toAmount: amount,
        gas: 0,
    }
    return NextResponse.json(mockResponse);
  }


  try {
    const quote = await dexService.getQuote(validation.data);
    return NextResponse.json(quote);
  } catch (error) {
    const e = error as Error;
    console.error(`Quote API Error for ${searchParams.toString()}:`, e.message);
    return NextResponse.json({ error: 'Failed to get quote', message: e.message }, { status: 500 });
  }
}
