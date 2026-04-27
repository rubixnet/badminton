import { WorkOS } from '@workos-inc/node';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { fetchQuery, fetchMutation } from 'convex/nextjs'; 
import { api } from "../../../../../convex/_generated/api";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); 

  if (!code) return NextResponse.redirect(new URL('/login', req.url));

  try {
    const response = await workos.userManagement.authenticateWithCode({
      clientId: process.env.WORKOS_CLIENT_ID!,
      code,
    });

    const workosUser = response.user;
    
    let profile = await fetchQuery(api.users.getProfile, { workosId: workosUser.id });

    if (!profile) {
      profile = await fetchMutation(api.users.createProfile, {
        workosId: workosUser.id,
        email: workosUser.email,
        isOnboarded: false, 
      });
    }
    const token = await new SignJWT({ userId: workosUser.id, email: workosUser.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('60d')
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60,
    });

    const onboardingUrl = new URL('/onboarding', req.url);
    
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        if (decoded.invite) onboardingUrl.searchParams.set("invite", decoded.invite);
        if (decoded.via) onboardingUrl.searchParams.set("via", decoded.via);
      } catch (e) { console.error("State decode error", e); }
    }

    if (!profile?.isOnboarded || !profile?.groupId) {
      return NextResponse.redirect(onboardingUrl);
    }

    return NextResponse.redirect(new URL(`/home/${profile.groupId}`, req.url));

  } catch (error) {
    console.error("Auth Callback Error:", error);
    return NextResponse.redirect(new URL('/login?error=auth_failed', req.url));
  }
}