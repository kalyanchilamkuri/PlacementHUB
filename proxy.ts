import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next 16 renamed middleware to proxy. This is an optimistic redirect only —
 * it bounces visitors with no session cookie so they do not see a flash of an
 * empty app shell. Real authorization happens in lib/dal.ts.
 */
export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token');

  if (hasSession) return NextResponse.next();

  const url = new URL('/login', request.url);
  if (request.nextUrl.pathname !== '/') {
    url.searchParams.set('from', request.nextUrl.pathname);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/applications/:path*',
    '/calendar/:path*',
    '/drives/:path*',
    '/profile/:path*',
  ],
};
