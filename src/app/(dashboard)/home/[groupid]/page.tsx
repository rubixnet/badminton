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

    const group = await fetchQuery(api.group.getGroupById, { groupId: groupid as any });

    if (!group) {
        redirect('/login?error=group_not_found');
    }

    let profile = null;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            const userProfile = await fetchQuery(api.users.getProfile, { workosId: payload.userId as string });
            
            if (userProfile && userProfile.groupId === groupid) {
                profile = userProfile;
            }
        } catch (err) {
            console.error('[AUTH] Invalid session token');
        }
    }

    if (!profile) {
        const inviteQuery = !group.isPublic && group.inviteCode ? `?invite=${group.inviteCode}` : '';
        redirect(`/login${inviteQuery}`);
    }

    return <HomeClient user={profile} group={group} />;
}