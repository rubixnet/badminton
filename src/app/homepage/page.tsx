import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    PlayCircle,
    Sparkles,
    Target,
    Trophy,
    Users2,
    Zap
} from "lucide-react";

const features = [
    {
        icon: BarChart3,
        title: "Smart Match Insights",
        description: "See trends across opponents, formats, and scorelines without manual sheets."
    },
    {
        icon: Users2,
        title: "Friends in One Space",
        description: "Track games with your group and keep everyone synced on recent matches."
    },
    {
        icon: Target,
        title: "Easy Score Logging",
        description: "Capture scores quickly for singles and doubles with a clean flow."
    },
    {
        icon: Trophy,
        title: "Progress You Can Feel",
        description: "Follow consistency and momentum over weeks, not just one-off wins."
    },
    {
        icon: Zap,
        title: "Fast by Design",
        description: "Minimal steps, clear structure, and no clutter while entering match data."
    }
];

const friends = ["ME", "F1", "F2", "F3", "F4"];

const Page = () => {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <section className="border-b border-border px-4 py-16 md:py-24">
                <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
                    <div className="space-y-6">
                        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                            Your badminton command center.
                        </h1>
                        <p className="max-w-xl text-lg text-muted-foreground">
                            Track every match, keep your squad aligned, and improve week by week with a cleaner workflow.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button size="lg" className="rounded-full px-8">
                                Try it out
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-full px-8">
                                <PlayCircle className="mr-2 h-4 w-4" />
                                See quick demo
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Used by me and 4 of my friends.</p>
                    </div>

                    <Card className="rounded-3xl border border-border bg-muted/30 p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Tonight&apos;s queue</p>
                                <Badge variant="outline" className="rounded-full">Live</Badge>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3">
                                    <div>
                                        <p className="font-medium">Me + F1</p>
                                        <p className="text-sm text-muted-foreground">vs F2 + F3</p>
                                    </div>
                                    <p className="text-sm font-medium">21-17</p>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3">
                                    <div>
                                        <p className="font-medium">Me + F4</p>
                                        <p className="text-sm text-muted-foreground">vs F1 + F2</p>
                                    </div>
                                    <p className="text-sm font-medium">19-21</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Smart summaries after each match
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            <section className="border-b border-border px-4 py-14 md:py-20">
                <div className="mx-auto grid max-w-6xl items-center gap-20 lg:grid-cols-2">
                    <Card className="rounded-3xl border border-border bg-muted/20 p-6">
                        <div className="space-y-4">
                            <p className="text-sm font-medium">Performance snapshot</p>
                            <div className="space-y-3">
                                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                                    <p className="text-sm text-muted-foreground">Consistency trend</p>
                                    <div className="mt-2 h-2 rounded-full bg-muted">
                                        <div className="h-2 w-2/3 rounded-full bg-primary" />
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                                    <p className="text-sm text-muted-foreground">Doubles chemistry</p>
                                    <div className="mt-2 h-2 rounded-full bg-muted">
                                        <div className="h-2 w-3/4 rounded-full bg-primary" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4 ">
                        <h2 className="text-3xl font-semibold text-balance tracking-tight md:text-4xl">
                            Right amount of detail, zero noise.
                        </h2>
                        <p className="text-muted-foreground text-balance">
                            Keep the useful parts visible: scores, partner combinations, and repeat performance patterns.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Fast match logging</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Clean history browsing</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Clear weekly momentum</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="border-b border-border px-4 py-14 md:py-20">
                <div className="mx-auto grid max-w-6xl items-center gap-20 lg:grid-cols-2">
                    <div className="order-2 space-y-4 lg:order-1">
                        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                            Built for your real squad flow.
                        </h2>
                        <p className="text-muted-foreground">
                            Alternate roles, switch partners, and keep everyone in the same loop with simple updates.
                        </p>
                    </div>

                    <Card className="order-1 rounded-3xl border border-border bg-muted/20 p-6 lg:order-2">
                        <div className="space-y-3">
                            <p className="text-sm font-medium">Team activity</p>
                            <div className="space-y-2">
                                <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm">F1 joined tonight&apos;s match queue</div>
                                <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm">F3 updated last game score</div>
                                <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm">You completed weekly session notes</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            <section className="border-b border-border px-4 py-14 md:py-20">
                <div className="mx-auto max-w-6xl space-y-8">
                    <div className="space-y-3 text-center">
                        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything essential, styled better.</h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <Card key={feature.title} className="rounded-3xl border border-border bg-muted/20 p-6">
                                    <div className="space-y-3">
                                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-primary">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="border-b border-border px-4 py-14 md:py-20">
                <div className="mx-auto max-w-6xl">
                    <Card className="rounded-3xl border border-border bg-muted/20 p-6 md:p-8">
                        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                            <div className="space-y-4">
                                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Used by me and 4 friends.</h2>
                                <div className="flex items-center gap-2">
                                    {friends.map((friend) => (
                                        <div
                                            key={friend}
                                            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold"
                                        >
                                            {friend}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                                <Button size="lg" className="rounded-full px-8">
                                    Try it out
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button size="lg" variant="outline" className="rounded-full px-8">
                                    Login
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            <footer className="px-4 pb-0 pt-10">
                <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 border-b border-border pb-8 sm:flex-row sm:items-center">
                    <p className="text-sm text-muted-foreground">Badminton Hub</p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link>
                        <Link href="/login" className="transition-colors hover:text-foreground">Login</Link>
                        <Link href="/about" className="transition-colors hover:text-foreground">About</Link>
                    </div>
                </div>

                <div className="mx-auto mt-6 h-24 max-w-6xl overflow-hidden">
                    <p className="translate-y-8 select-none text-center text-[18vw] font-semibold leading-none tracking-tight text-muted-foreground/25">
                        BADMINTON
                    </p>
                </div>
            </footer>
        </main>
    );
};

export default Page;
