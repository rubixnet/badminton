import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/home';

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/home',
    '/login',
    '/signup',
    '/dashboard',
    '/admin',
    '/analytics',
    '/onboarding',
    '/invite/:path*',
    '/matches/:path*',
  ],
};