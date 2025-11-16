
import { NextResponse } from 'next/server';

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
    parsed_project_id: null,
    parsed_error: null,
  };

  // quick parse of SA JSON if present
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        out.parsed_project_id = parsed.project_id || null;
      } catch (e: any) {
        out.parsed_error = 'FIREBASE_SERVICE_ACCOUNT_JSON parse error: ' + (e && e.message ? e.message : String(e));
      }
    }
  } catch (e: any) {
    out.parsed_error = e && e.message ? e.message : String(e);
  }

  return NextResponse.json(out);
}
