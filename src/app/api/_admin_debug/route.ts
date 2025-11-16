
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const out: any = {
    env_exists: {
      FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      NODE_ENV: process.env.NODE_ENV || null,
    },
    parsed_project_id: null,
    parsed_client_email: null,
    parsed_error: null,
    token_check_ok: false,
    token_error: null,
    token_details: null,
  };

  // quick parse of SA JSON if present
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        out.parsed_project_id = parsed.project_id || null;
        out.parsed_client_email = parsed.client_email || null;
      } catch (e: any) {
        out.parsed_error = 'FIREBASE_SERVICE_ACCOUNT_JSON parse error: ' + (e && e.message ? e.message : String(e));
      }
    }
  } catch (e: any) {
    out.parsed_error = e && e.message ? e.message : String(e);
  }

  // Try to obtain an access token using google-auth-library
  try {
    const { GoogleAuth } = await import('google-auth-library');
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      out.token_error = 'skipping token check because no FIREBASE_SERVICE_ACCOUNT_JSON';
    } else {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      const auth = new GoogleAuth({ credentials: parsed, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
      const client = await auth.getClient();
      const token = await client.getAccessToken();
      out.token_check_ok = !!token;
      if(token && token.token) {
        out.token_details = { token_length: token.token.length, expires_in: token.res?.data?.expires_in || null };
      }
    }
  } catch (e: any) {
    out.token_error = e && e.message ? e.message : String(e);
  }

  return NextResponse.json(out);
}
