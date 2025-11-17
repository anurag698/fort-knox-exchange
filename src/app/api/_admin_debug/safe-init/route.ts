
import { NextResponse } from 'next/server';
import { initSafeClient } from '@/lib/wallet-service';

export async function GET(request: Request) {
  const out: any = {
    env: {
      POLYGON_RPC_URL: !!process.env.POLYGON_RPC_URL,
      SAFE_ADDRESS: !!process.env.SAFE_ADDRESS,
      HOT_WALLET_PRIVATE_KEY: !!process.env.HOT_WALLET_PRIVATE_KEY,
    },
    initialization: {
      success: false,
      error: null,
      signerAddress: null,
    }
  };

  try {
    const { signer } = await initSafeClient();
    const signerAddress = await signer.getAddress();
    
    out.initialization.success = true;
    out.initialization.signerAddress = signerAddress;
    
    return NextResponse.json(out, { status: 200 });

  } catch (e: any) {
    out.initialization.error = e.message || String(e);
    return NextResponse.json(out, { status: 500 });
  }
}
