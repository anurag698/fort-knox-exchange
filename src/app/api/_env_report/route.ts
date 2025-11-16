
// src/app/api/_env_report/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const report = {
    NODE_ENV: process.env.NODE_ENV || null,
    NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
    ETH_XPUB_present: !!process.env.ETH_XPUB,
    ETH_XPUB_len: process.env.ETH_XPUB ? process.env.ETH_XPUB.length : 0,
    ETH_NETWORK_RPC_present: !!process.env.ETH_NETWORK_RPC,
    FIREBASE_SERVICE_ACCOUNT_JSON_present: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    FIREBASE_SERVICE_ACCOUNT_JSON_len: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON.length : 0,
    GOOGLE_APPLICATION_CREDENTIALS_present: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
  };
  console.info('[env-report]', JSON.stringify(report));
  return NextResponse.json({ ok: true, report }, { status: 200 });
}
