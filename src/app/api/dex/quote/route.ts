
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { dexService } from '@/lib/dex/dex.service';

const quoteSchema = z.object({
  chainId: z.coerce.number().int().positive(),
  fromTokenAddress: z.string(),
  toTokenAddress: z.string(),
  amount: z.string().regex(/^\d+$/), // amount in wei
  slippage: z.coerce.number().optional().default(1),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const validation = quoteSchema.safeParse({
    chainId: searchParams.get('chainId'),
    fromTokenAddress: searchParams.get('fromTokenAddress'),
    toTokenAddress: searchParams.get('toTokenAddress'),
    amount: searchParams.get('amount'),
    slippage: searchParams.get('slippage'),
  });

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  // Handle USDT to USDT case directly
  if (validation.data.fromTokenAddress === validation.data.toTokenAddress) {
    const amount = validation.data.amount;
    const tokenInfo = {
        address: validation.data.fromTokenAddress,
        symbol: 'USDT', // Assuming, this should be fetched for correctness
        name: 'Tether',
        decimals: 6, // USDT usually has 6 decimals
        logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png'
    };
    return NextResponse.json({
        fromToken: tokenInfo,
        toToken: tokenInfo,
        fromTokenAmount: amount,
        toTokenAmount: amount,
        estimatedGas: "0"
    });
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
