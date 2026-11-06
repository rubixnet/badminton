import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export async function getMatchSession() {
  const token = (await cookies()).get("session")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return typeof payload.userId === "string" ? payload : null;
  } catch {
    return null;
  }
}

export async function getReadableMatchGroup(groupId: string | null) {
  if (!groupId || !/^[a-z0-9]{32}$/.test(groupId)) {
    return NextResponse.json({ error: "A valid groupId is required." }, { status: 400 });
  }
  const group = await fetchQuery(api.group.getGroupById, { groupId: groupId as Id<"groups"> });
  if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });
  if (!group.isPublic) {
    const session = await getMatchSession();
    if (!session || typeof session.userId !== "string") {
      return NextResponse.json({ error: "Sign in to view this group's scores." }, { status: 401 });
    }
    const profile = await fetchQuery(api.users.getProfile, { workosId: session.userId });
    if (profile?.groupId !== group._id) {
      return NextResponse.json({ error: "These scores are restricted to club members." }, { status: 403 });
    }
  }
  return group;
}
