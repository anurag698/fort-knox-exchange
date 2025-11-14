
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';

function getFirebaseAdmin() {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }

    const appName = 'firebase-admin-app-for-session';
    
    if (!getApps().some(existingApp => existingApp.name === appName)) {
        return initializeApp({
            credential: {
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: JSON.parse(serviceAccount).client_email,
                privateKey: JSON.parse(serviceAccount).private_key.replace(/\\n/g, '\n'),
            },
        }, appName);
    } else {
        return getApp(appName);
    }
}

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }
  
  getFirebaseAdmin();
  const auth = getAuth();

  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(token, { expiresIn });

    const options = {
      name: '__session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };
    cookies().set(options);

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Session cookie creation failed:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  cookies().delete('__session');
  return NextResponse.json({ status: 'success' });
}
