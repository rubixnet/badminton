import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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

    return NextResponse.json({
      userId: payload.userId,
      email: payload.email,
      groupId: payload.groupId,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
