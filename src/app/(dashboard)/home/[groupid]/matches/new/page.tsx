import { CreateMatchScreen } from "@/components/create-match-screen";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../../convex/_generated/api";

interface PageProps {
  params: Promise<{
    groupid: string;
  }>;
}

export default async function NewGroupMatchPage({ params }: PageProps) {
  const { groupid } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  let workosId: string;

  try {
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify(token, JWT_SECRET);
    workosId = payload.userId as string;
  } catch (error) {
    console.error("New group match auth error:", error);
    return null;
  }

  const profile = await fetchQuery(api.users.getProfile, { workosId });

  if (!profile || profile.groupId?.toString() !== groupid) {
    return null;
  }

  const group = await fetchQuery(api.group.getById, {
    groupId: profile.groupId,
  });

  if (!group) {
    return null;
  }

  return (
    <CreateMatchScreen
      overlay
      user={{ _id: profile._id, name: profile.name }}
      group={{ _id: group._id }}
    />
  );
}
