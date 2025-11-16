
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const out: any = {
    env_exists: {
      FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      NODE_ENV: process.env.NODE_ENV || null,
      ETH_XPUB: !!process.env.ETH_XPUB,
      BTC_XPUB: !!process.env.BTC_XPUB,
      ETH_NETWORK_RPC: !!process.env.ETH_NETWORK_RPC,
      NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
    },
    firebase_admin_init: {
      success: false,
      error: null,
      projectId: null,
    }
  };

  try {
    const admin = getFirebaseAdmin();
    out.firebase_admin_init.success = true;
    out.firebase_admin_init.projectId = admin.app.options.projectId || null;
  } catch (e: any) {
    out.firebase_admin_init.error = e.message || String(e);
  }

  return NextResponse.json(out);
}
