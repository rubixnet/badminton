import { WorkOS } from '@workos-inc/node';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from "../../../../../convex/_generated/api";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

function decodeAuthState(state: string | null) {
  if (!state) return null;

  try {
    return JSON.parse(Buffer.from(state, 'base64').toString()) as {
      invite?: string;
      via?: string;
    };
  } catch (error) {
    console.error("State decode error", error);
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const decodedState = decodeAuthState(state);

  if (!code) return NextResponse.redirect(new URL('/login', req.url));

  try {
    const response = await workos.userManagement.authenticateWithCode({
      clientId: process.env.WORKOS_CLIENT_ID!,
      code,
    });

    const workosUser = response.user;
    const workosUserWithName = workosUser as typeof workosUser & {
      firstName?: string | null;
      lastName?: string | null;
    };
    const fallbackName = workosUser.email.split("@")[0] || "Player";
    const displayName =
      [workosUserWithName.firstName, workosUserWithName.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || fallbackName;

    let profile = await fetchQuery(api.users.getProfile, { workosId: workosUser.id });

    if (!profile) {
      profile = await fetchMutation(api.users.createProfile, {
        workosId: workosUser.id,
        email: workosUser.email,
        isOnboarded: false,
      });
    }

    if (decodedState?.invite) {
      await fetchMutation(api.users.finalizeUser, {
        workosId: workosUser.id,
        name: profile?.name || displayName,
        email: workosUser.email,
        inviteCode: decodedState.invite,
      });

      profile = await fetchQuery(api.users.getProfile, { workosId: workosUser.id });
    }

    const token = await new SignJWT({
      userId: workosUser.id,
      email: workosUser.email,
      groupId: profile?.groupId 
    })
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

    if (decodedState) {
      if (decodedState.invite) onboardingUrl.searchParams.set("invite", decodedState.invite);
      if (decodedState.via) onboardingUrl.searchParams.set("via", decodedState.via);
    }

    if (!profile?.groupId) {
      return NextResponse.redirect(onboardingUrl);
    }

    return NextResponse.redirect(new URL(`/home/${profile.groupId}`, req.url));

  } catch (error) {
    console.error("Auth Callback Error:", error);
    return NextResponse.redirect(new URL('/login?error=auth_failed', req.url));
  }
}
