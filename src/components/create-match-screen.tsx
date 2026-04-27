"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { MatchForm } from "@/components/match-form";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMobile } from "@/hooks/use-mobile";
import type { Match } from "@/types/match";

const CREATE_MATCH_EVENT = "badminton:match-created";
const EXIT_DURATION_MS = 280;

interface CreateMatchScreenProps {
  overlay?: boolean;
  user: { _id: string; name: string };
  group: { _id: string };
}

function getWinner(match: Match) {
  if (match.team1.score > match.team2.score) {
    return "team1" as const;
  }

  return "team2" as const;
}

function createLocalMatch(match: Match): Match {
  return {
    ...match,
    id: match.id || `local_${Date.now()}`,
    winner: match.winner ?? getWinner(match),
  };
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

export function CreateMatchScreen({ overlay = false, user, group }: CreateMatchScreenProps) {
  const router = useRouter();
  const isMobile = useMobile();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  const closeScreen = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      return;
    }

    setOpen(false);

    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;

      if (overlay && window.history.length > 1) {
        router.back();
        return;
      }

      router.replace("/");
    }, EXIT_DURATION_MS);
  }, [overlay, router]);

  useEffect(() => {
    setMounted(true);
    setOpen(true);

    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mounted && !isMobile) {
      router.replace("/");
    }
  }, [mounted, isMobile, router]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && open) {
      closeScreen();
    }
  };

  const handleMatchCreated = async (submittedMatch: Match) => {
  const fallbackMatch = createLocalMatch(submittedMatch);

  try {
    const response = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...submittedMatch,
        groupId: group._id,
        userId: user._id,   
        userName: user.name,  
      }),
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

  if (!mounted || !isMobile) {
    return null;
  }

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      dismissible
      disablePreventScroll={false}
      handleOnly={false}
      repositionInputs={false}
    >
      <DrawerContent className="[&>div:first-child]:hidden data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:h-dvh data-[vaul-drawer-direction=bottom]:max-h-dvh data-[vaul-drawer-direction=bottom]:rounded-t-[28px] data-[vaul-drawer-direction=bottom]:border-t-0 flex overflow-hidden bg-background shadow-2xl">
        <DrawerTitle className="sr-only">Create match</DrawerTitle>
        <DrawerDescription className="sr-only">
          Full-screen sheet for entering a badminton match.
        </DrawerDescription>

        <div className="sticky top-0 z-10 px-4 pb-2 backdrop-blur">
          <div className="relative flex min-h-10 items-center justify-center">
            <div className="h-2 w-24 rounded-full bg-muted" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 mt-2 shrink-0 -translate-y-1/2"
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
    </Drawer>
  );
}

export { CREATE_MATCH_EVENT };
