import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { fetchQuery } from 'convex/nextjs';
import { api } from '../../../../../convex/_generated/api';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as {
      userId: string;
      email: string;
      groupId?: string;
    };

    const profile = await fetchQuery(api.users.getProfile, {
      workosId: payload.userId,
    });

    if (!profile) {
      const response = NextResponse.json({ error: "Profile not found" }, { status: 401 });
      response.cookies.delete("session");
      return response;
    }

    const groupId = profile.groupId?.toString();
    const response = NextResponse.json({
      userId: payload.userId,
      email: profile.email || payload.email,
      name: profile.name,
      isOnboarded: profile.isOnboarded,
      groupId,
    });

    if (groupId && payload.groupId !== groupId) {
      const refreshedToken = await new SignJWT({
        userId: payload.userId,
        email: profile.email || payload.email,
        groupId,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('60d')
        .sign(JWT_SECRET);

      response.cookies.set('session', refreshedToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 60,
      });
    }

    return response;
  } catch (error) {
    const response = NextResponse.json({ error: "Invalid session" }, { status: 401 });
    response.cookies.delete("session");
    return response;
  }
}
