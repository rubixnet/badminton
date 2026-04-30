import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const body = (await req.json()) as {
      name?: string;
      clubName?: string;
      inviteCode?: string;
    };

    const name = body.name?.trim();
    const clubName = body.clubName?.trim();
    const inviteCode = body.inviteCode?.trim();
    const userId = payload.userId as string | undefined;
    const email = payload.email as string | undefined;

    if (!userId || !email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!inviteCode && !clubName) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 });
    }

    const result = await fetchMutation(api.users.completeOnboarding, {
      workosId: userId,
      email,
      name,
      clubName: inviteCode ? undefined : clubName,
      inviteCode: inviteCode || undefined,
    });

    const refreshedToken = await new SignJWT({
      userId,
      email,
      groupId: result.groupId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("60d")
      .sign(JWT_SECRET);

    cookieStore.set("session", refreshedToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 60,
    });

    return NextResponse.json({ groupId: result.groupId });
  } catch (error) {
    console.error("Onboarding error:", error);
    const message =
      error instanceof Error ? error.message : "Unable to complete onboarding";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
