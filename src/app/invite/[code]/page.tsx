import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function InvitePage({
    params,
    searchParams
}: {
    params: { code: string },
    searchParams: { via?: string }
}) {
    const inviteData = await fetchQuery(api.group.getInviteInfo, {
        inviteCode: params.code,
        inviterId: searchParams.via
    })

    if (!inviteData) return <div className="p-20 text-center">Invalid invite link.</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
            <div className="max-w-md w-full p-10 bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 text-center space-y-8">
                <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow-lg">
                        {inviteData.inviterName[0]}
                    </div>
                    <p className="text-zinc-500 font-medium">
                        <span className="text-zinc-900 font-bold">{inviteData.inviterName}</span> invited you to
                    </p>
                </div>

                <h1 className="text-4xl font-black text-zinc-900 leading-tight">
                    {inviteData.groupName}
                </h1>


                <Button  variant="main">
                    <Link href={`/api/auth/signup?invite=${params.code}&via=${searchParams.via}`}>
                        Join & Get Started
                    </Link>
                </Button>
            </div>
        </div>
    );
}