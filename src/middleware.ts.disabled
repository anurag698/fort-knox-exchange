
import { NextResponse, type NextRequest } from 'next/server';

// List of protected paths that require authentication
const protectedPaths = ['/trade', '/settings', '/admin', '/ledger'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;

  const isAuthPage = pathname === '/auth';
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  // If user has a session cookie
  if (sessionCookie) {
    // If they visit the auth page, redirect to the trade page
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/trade', request.url));
    }
  } 
  // If user does not have a session cookie
  else {
    // And tries to access a protected page, redirect to auth page
    if (isProtected) {
      const url = new URL('/auth', request.url);
      url.searchParams.set('next', pathname); // Optionally pass the original path
      return NextResponse.redirect(url);
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/trade/:path*', '/settings/:path*', '/admin/:path*', '/ledger/:path*', '/auth'],
};
