
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { dexService } from '@/lib/dex/dex.service';

const tokensSchema = z.object({
  chainId: z.coerce.number().int().positive(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const validation = tokensSchema.safeParse({
    chainId: searchParams.get('chainId'),
  });

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  try {
    const tokens = await dexService.getTokens(validation.data.chainId);
    return NextResponse.json(tokens);
  } catch (error) {
    const e = error as Error;
    console.error(`Tokens API Error for chain ${searchParams.get('chainId')}:`, e.message);
    return NextResponse.json({ error: 'Failed to get tokens', message: e.message }, { status: 500 });
  }
}
