
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { dexService } from '@/lib/dex/dex.service';

const buildTxSchema = z.object({
  chainId: z.coerce.number().int().positive(),
  src: z.string(),
  dst: z.string(),
  amount: z.string().regex(/^\d+$/), // amount in wei
  from: z.string(),
  slippage: z.coerce.number().optional().default(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = buildTxSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const txData = await dexService.buildSwapTransaction(validation.data);
    return NextResponse.json(txData);
  } catch (error) {
    const e = error as Error;
    console.error(`Build TX API Error:`, e.message);
    // Handle JSON parsing errors or other unexpected errors
    if (e.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to build transaction', message: e.message }, { status: 500 });
  }
}
