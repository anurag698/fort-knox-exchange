
import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

// List of protected paths that require authentication
const protectedPaths = ['/trade', '/settings', '/admin', '/ledger'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;

  // Initialize Firebase Admin
  getFirebaseAdmin();
  const auth = getAuth();

  let decodedToken = null;
  if (sessionCookie) {
    try {
      decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    } catch (error) {
      // Session cookie is invalid. Clear it.
      const response = NextResponse.redirect(new URL('/auth', request.url));
      response.cookies.delete('__session');
      return response;
    }
  }

  const isAuthPage = pathname === '/auth';
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  // If user is authenticated
  if (decodedToken) {
    // If they visit the auth page, redirect to the trade page
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/trade', request.url));
    }
  } 
  // If user is not authenticated
  else {
    // And tries to access a protected page, redirect to auth page
    if (isProtected) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/trade/:path*', '/settings/:path*', '/admin/:path*', '/ledger/:path*', '/auth'],
};
