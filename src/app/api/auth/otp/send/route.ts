import { WorkOS } from '@workos-inc/node';
import { NextResponse } from 'next/server';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await workos.userManagement.createUser({
      email,
      password,
    });

    await workos.userManagement.sendVerificationEmail({
      userId: user.id,
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    if (error.status === 400) {
      const isEmailTaken = error.errors?.some((e: any) => e.code === 'email_not_available');
      return NextResponse.json(
        { error: isEmailTaken ? "This email is already registered. Try signing in." : error.errors?.[0]?.message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to initialize signup." }, { status: 500 });
  }
}