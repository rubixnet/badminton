import { WorkOS } from '@workos-inc/node';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { fetchQuery } from 'convex/nextjs';
import { api } from "../../../../../convex/_generated/api";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const response = await workos.userManagement.authenticateWithCode({
      clientId: process.env.WORKOS_CLIENT_ID!,
      code,
    });

    const workosUser = response.user;

    const token = await new SignJWT({
      userId: workosUser.id,
      email: workosUser.email
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    const profile = await fetchQuery(api.users.getProfile, { workosId: workosUser.id });

    if (!profile?.isOnboarded || !profile.groupId) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    return NextResponse.redirect(new URL(`/home/${profile.groupId}`, req.url));

  } catch (error) {
    console.error("Auth Callback Error:", error);
    return NextResponse.redirect(new URL('/login?error=auth_failed', req.url));
  }
}