import { WorkOS } from '@workos-inc/node';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json();

    const response = await workos.userManagement.verifyEmail({
      userId,
      code,
    });

    if (response.user) {
      const token = await new SignJWT({ 
        userId: response.user.id, 
        email: response.user.email 
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

      return NextResponse.json({ success: true, url: '/onboarding' });
    }

    return NextResponse.json({ error: "Invalid verification code." }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Verification failed. The code may be expired." },
      { status: 500 }
    );
  }
}