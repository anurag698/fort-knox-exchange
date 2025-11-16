// src/app/api/_env_check/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Only reveal boolean presence (not values) for safety
  return NextResponse.json({
    NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
    ETH_XPUB: !!process.env.ETH_XPUB,
    ETH_NETWORK_RPC: !!process.env.ETH_NETWORK_RPC,
    FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    NODE_ENV: process.env.NODE_ENV || null
  }, { status: 200 });
}
