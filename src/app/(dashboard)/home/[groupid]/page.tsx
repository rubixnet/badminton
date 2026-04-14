import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import HomeClient from "./HomeClient";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function Page() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
        redirect('/login');
    }

    let user;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        user = { id: payload.userId as string };
    } catch (err) {
        redirect('/login');
    }

    const profile = await fetchQuery(api.users.getProfile, { workosId: user.id });
    if (!profile || !profile.isOnboarded || !profile.groupId) {
        console.log('[HOME] User not fully onboarded, redirecting to onboarding');
        redirect('/onboarding');
    }
    if (profile?.groupId !== groupId) {
        redirect(`/home/${profile.groupId}`);
    }
    const group = await fetchQuery(api.group.getById, { groupId: profile.groupId });
    return <HomeClient user={profile} group={group} />;
}