"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Building2, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite")?.trim() || "";
  const isJoiningInvite = Boolean(inviteCode);
  const [name, setName] = useState("");
  const [clubName, setClubName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(name.trim() && (isJoiningInvite || clubName.trim()));
  }, [clubName, isJoiningInvite, name]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          clubName,
          inviteCode: inviteCode || undefined,
        }),
      });

      const data = (await response.json()) as {
        groupId?: string;
        error?: string;
      };

      if (!response.ok || !data.groupId) {
        throw new Error(data.error || "Unable to complete setup");
      }

      localStorage.setItem("badminton_onboarded", "true");
      router.replace(`/home/${data.groupId}`);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to complete setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between border-b border-border/50 px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Badminton Tracker</span>
          </div>

          <div className="my-16 max-w-md space-y-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
              Setup
            </p>
            <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
              {isJoiningInvite ? "Join your club." : "Create your club."}
            </h1>
            <p className="text-base leading-7 text-muted-foreground">
              Add your player name and connect this account to the group where
              your matches, members, and analytics will live.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            You can invite more players from group settings after setup.
          </p>
        </section>

        <section className="flex items-center px-6 py-10 sm:px-10 lg:px-16">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-medium tracking-tight">Your details</h2>
              <p className="text-sm text-muted-foreground">
                This is what other players will see in match history.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="h-12 pl-10"
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              </div>

              <div className={cn("space-y-2", isJoiningInvite && "opacity-60")}>
                <Label htmlFor="clubName">
                  {isJoiningInvite ? "Club name" : "Club or group name"}
                </Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="clubName"
                    value={isJoiningInvite ? "From your invite link" : clubName}
                    onChange={(event) => setClubName(event.target.value)}
                    placeholder="e.g. Sunday Smash Club"
                    className="h-12 pl-10"
                    disabled={isJoiningInvite}
                  />
                </div>
                {isJoiningInvite && (
                  <p className="text-xs text-muted-foreground">
                    Your invite link decides which club you join.
                  </p>
                )}
              </div>
            </div>

            {error && (
              <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={!canSubmit || isSubmitting}
              className="h-12 w-full rounded-md"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 size-4" />
              )}
              {isJoiningInvite ? "Join Club" : "Create Club"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingForm />
    </Suspense>
  );
}
