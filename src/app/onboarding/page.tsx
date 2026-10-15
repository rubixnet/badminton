import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { OnboardingForm } from "./onboarding-form";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

interface PageProps {
  searchParams: Promise<{ invite?: string }>;
}

/**
 * The session lookup and both redirects happen on the server so the browser
 * never has to fetch `/api/auth/me` just to find out where to send the user.
 */
export default async function OnboardingPage({ searchParams }: PageProps) {
  const { invite } = await searchParams;
  const token = (await cookies()).get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  let groupId: string | undefined;
  let sessionIsValid = false;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const profile = await fetchQuery(api.users.getProfile, {
      workosId: payload.userId as string,
    });
    sessionIsValid = Boolean(profile);
    groupId = profile?.groupId?.toString();
  } catch (error) {
    console.error("[AUTH] Invalid session token during onboarding", error);
  }

  if (sessionIsValid && groupId) {
    redirect(`/home/${groupId}`);
  }

  if (!sessionIsValid) {
    redirect("/login?logout=session_invalid");
  }

  return <OnboardingForm inviteCode={invite ?? null} />;
}
