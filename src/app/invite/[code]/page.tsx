"use client";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
    params: Promise<{ code: string }>;
    searchParams: Promise<{ via?: string }>;
}

export default async function InvitePage({ params, searchParams }: PageProps) {
    const { code } = await params;
    const { via } = await searchParams;

    const inviteData = await fetchQuery(api.group.getInviteInfo, {
        inviteCode: code,
        inviterId: via,
    });

    if (!inviteData) {
        return (
            <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-sm w-full text-center space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-xl font-medium tracking-tight">Expired Invitation</h1>
                            <p className="text-sm text-muted-foreground leading-relaxed font-normal">
                                This link is no longer active. Reach out to your group admin for a new invite.
                            </p>
                        </div>
                        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-md border-border/50")}>
                            Return to Homepage
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
            <main className="flex-1 flex flex-col items-center justify-center">
                <section className="w-full max-w-xl px-6 py-20 text-center space-y-10">
                    {/* Minimal Avatar/Identity Section */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                            {inviteData.inviterName?.[0]?.toUpperCase()}
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Personal Invite</p>
                            <p className="text-base text-muted-foreground font-normal">
                                <span className="text-foreground font-medium">{inviteData.inviterName}</span> has invited you to join
                            </p>
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-foreground leading-tight">
                        {inviteData.groupName}
                    </h1>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                        <Link
                            href={`/login?invite=${code}&via=${via || ""}`}
                            className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto h-12 px-8 rounded-md text-sm font-medium shadow-none group")}
                        >
                            Accept & Join
                            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>

                        <Link
                            href="/"
                            className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto h-12 px-8 rounded-md text-sm font-medium border-border/50 bg-transparent")}
                        >
                            Learn More
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="bg-background w-full pb-12 mt-auto">
                <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
                    <div className="w-24 h-px bg-border/40 mb-8" />

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 w-full max-w-lg">
                        <Link href="/" className="text-[10px] font-bold text-foreground/40 tracking-widest uppercase hover:text-primary transition-colors">
                            Badminton Tracker
                        </Link>
                        <div className="flex items-center gap-8 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}