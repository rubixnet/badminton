"use client"

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { Match } from "@/types/match";
import { MatchForm } from "@/components/match-form";

const CREATE_MATCH_EVENT = "badminton:match-created";
const EXIT_DURATION_MS = 280;

interface CreateMatchScreenProps {
  overlay?: boolean;
}

function getWinner(match: Match) {
  if (match.team1.score > match.team2.score) {
    return "team1" as const;

  }

  else return "team2" as const; // there cannot be a draw
}

function createLocalMatch(match: Match): Match {
  return {
    ...match,
    id: match.id || `local_${Date.now()}`,
    winner: match.winner ?? getWinner(match),
  }
}




function persistMatch(match: Match) {
  const stored = localStorage.getItem("badminton_matches");

  try {
    const parsed = stored ? (JSON.parse(stored) as Match[]) : [];
    const deduped = parsed.filter((item) => item.id !== match.id);
    localStorage.setItem(
      "badminton_matches",
      JSON.stringify([match, ...deduped]),
    );
  } catch {
    localStorage.setItem("badminton_matches", JSON.stringify([match]));
  }

  window.dispatchEvent(
    new CustomEvent<Match>(CREATE_MATCH_EVENT, {
      detail: match,
    }),
  );
}

// asked v0 to crete below fn

export function CreateMatchScreen({
  overlay = false,
}: CreateMatchScreenProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  const closeScreen = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      return;
    }

    setOpen(false);

    closeTimeoutRef.current = window.setTimeout(() => {
      if (overlay) {
        router.back();
        return;
      }

      router.replace("/");
    }, EXIT_DURATION_MS);
  }, [overlay, router]);

  useEffect(() => {
    setOpen(true);

    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      closeScreen();
    }
  };

  const handleMatchCreated = async (submittedMatch: Match) => {
    const fallbackMatch = createLocalMatch(submittedMatch);

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submittedMatch),
      });

      if (response.ok) {
        const savedMatch = (await response.json()) as Match;
        persistMatch(savedMatch);
      } else {
        persistMatch(fallbackMatch);
      }
    } catch (error) {
      console.error("Error saving match:", error);
      persistMatch(fallbackMatch);
    }

    closeScreen();
  };

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      dismissible
      disablePreventScroll={false}
      handleOnly={false}
      repositionInputs={false}
    >
      <DrawerPortal>
        <DrawerOverlay
          className={overlay ? "bg-background/70 backdrop-blur-sm" : "bg-background"}
        />
        <DrawerContent className="[&>div:first-child]:hidden data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:h-dvh data-[vaul-drawer-direction=bottom]:max-h-dvh data-[vaul-drawer-direction=bottom]:rounded-t-[28px] data-[vaul-drawer-direction=bottom]:border-t-0 flex overflow-hidden bg-background shadow-2xl">
          <DrawerTitle className="sr-only">Create match</DrawerTitle>
          <DrawerDescription className="sr-only">
            Full-screen sheet for entering a badminton match.
          </DrawerDescription>

          <div className="supports-backdrop-filter:bg-background/80 sticky top-0 z-10 bg-background/95 px-4 pb-2 pt-2 backdrop-blur">
            <div className="relative flex min-h-10 items-center justify-center">
              <div className="h-1.5 w-14 rounded-full bg-muted" />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 shrink-0 -translate-y-1/2"
                onClick={closeScreen}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
            <MatchForm onSubmit={handleMatchCreated} onCancel={closeScreen} />
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}

export { CREATE_MATCH_EVENT };