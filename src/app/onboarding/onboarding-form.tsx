"use client";

import { FormEvent, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function OnboardingForm({ inviteCode }: { inviteCode: string | null }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const goToGroupStep = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setError(null);
    setStep(2);
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      setStep(1);
      return;
    }

    if (!inviteCode && !groupName.trim()) {
      setError("Please enter a group name");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          clubName: groupName,
          inviteCode: inviteCode || undefined,
        }),
      });

      const data = (await response.json()) as {
        groupId?: string;
        error?: string;
      };

      if (!response.ok || !data.groupId) {
        throw new Error(data.error || "Setup failed. Please try again.");
      }

      localStorage.setItem("badminton_onboarded", "true");
      router.replace(`/home/${data.groupId}`);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Setup failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1) {
      goToGroupStep();
    } else {
      handleComplete();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <m.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Let&apos;s get started</h1>
                <p className="text-muted-foreground">What&apos;s your name?</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <label htmlFor="onboarding-name" className="sr-only">
                  Your name
                </label>
                <input
                  id="onboarding-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoComplete="name"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full h-12 rounded-full font-medium"
                >
                  Next
                </Button>
              </div>
            </m.div>
          ) : (
            <m.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                  {inviteCode ? "Join the group!" : "Create your badminton club"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {inviteCode
                    ? "You've been invited to join a group"
                    : "Set up your group to start tracking matches"}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-6">
                {!inviteCode && (
                  <>
                  <label htmlFor="onboarding-group" className="sr-only">
                    Club name
                  </label>
                  <input
                    id="onboarding-group"
                    type="text"
                    placeholder="Club name (e.g. Smash Kings)"
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  </>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(1);
                    }}
                    variant="outline"
                    className="flex-1 h-12 rounded-full font-medium"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || (!inviteCode && !groupName.trim())}
                    className="flex-1 h-12 rounded-full font-medium bg-primary hover:bg-primary/90"
                  >
                    {submitting
                      ? "Setting up..."
                      : inviteCode
                        ? "Join Now"
                        : "Create Club"}
                  </Button>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Step {step} of 2</p>
        </div>
      </form>
    </div>
  );
}
