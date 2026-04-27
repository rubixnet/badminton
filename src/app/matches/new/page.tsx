import { CreateMatchScreen } from "@/components/create-match-screen";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function NewMatchPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) redirect("/login");

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const workosId = payload.userId as string;

    const profile = await fetchQuery(api.users.getProfile, { workosId });

    if (!profile || !profile.groupId) {
      redirect("/onboarding");
    }

    const group = await fetchQuery(api.group.getById, { groupId: profile.groupId });

    if (!group) {
      redirect("/");
    }

    return (
      <CreateMatchScreen
        user={{ _id: profile._id }}
        group={{ _id: group._id }}
        overlay={true}
      />
    );
  } catch (error) {
    console.error("NewMatchPage Auth Error:", error);
    redirect("/login");
  }
}