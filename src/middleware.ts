import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isPublicAuthPage = pathname === '/' || pathname === '/login' || pathname.startsWith('/invite');

  if (!token) return NextResponse.next();

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const groupId = payload.groupId as string | undefined;

    console.log({
        message: "Middleware Check",
        pathname,
        hasGroupId: !!groupId,
        isPublicAuthPage
    });

    if (groupId && isPublicAuthPage) {
      return NextResponse.redirect(new URL(`/home/${groupId}`, request.url));
    }
  } catch (err) {
    console.error("JWT Error:", err);
    const response = NextResponse.next();
    response.cookies.delete('session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};