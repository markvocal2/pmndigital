import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  // Authed routes — redirect to /login if no session
  const path = req.nextUrl.pathname;
  if (path.startsWith('/profile') && !req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run on every request except: Next internals, public assets, auth routes
    '/((?!api/auth|api|_next/static|_next/image|favicon.ico|uploads|login|register|$).*)',
    '/profile/:path*',
  ],
};
