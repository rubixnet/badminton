import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import HomeClient from "./HomeClient";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

interface PageProps {
    params: Promise<{ groupid: string }>;
}

export default async function Page({ params }: PageProps) {
    const { groupid } = await params;
    const cookieStore = await cookies();
    const token = (await cookieStore).get('session')?.value;

    if (!token) {
        redirect('/login');
    }

    let user;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        user = { id: payload.userId as string };
    } catch (err) {
        console.error('[AUTH] JWT Verification failed:', err);
        redirect('/login');
    }

    const profile = await fetchQuery(api.users.getProfile, { workosId: user.id });

    if (!profile || !profile.isOnboarded || !profile.groupId) {
        console.log('[HOME] User not fully onboarded, redirecting to onboarding');
        redirect('/onboarding');
    }

    if (profile.groupId !== groupid) {
        console.warn(`[SECURITY] Unauthorized access attempt by ${user.id} to group ${groupid}`);
        redirect(`/home/${profile.groupId}`);
    }

    const group = await fetchQuery(api.group.getById, { groupId: profile.groupId });

    if (!group) {
        console.error(`[ERROR] Group ${profile.groupId} not found in database.`);
        redirect('/onboarding');
    }

    return <HomeClient user={profile} group={group} />;
}