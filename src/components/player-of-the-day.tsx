"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trophy, ChevronDown } from "lucide-react";
import confetti from "canvas-confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlayerOfTheDayProps {
  playerName: string | null;
}

export function PlayerOfTheDay({ playerName }: PlayerOfTheDayProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const todayKey = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [revealed, setRevealed] = useState(() => {
    if (typeof window === "undefined") return false;
    const storedDate = localStorage.getItem("badminton_potd_revealed_date");
    return storedDate === todayKey;
  });

  // Persist reveal state
  useEffect(() => {
    if (revealed) {
      localStorage.setItem("badminton_potd_revealed_date", todayKey);
    }
  }, [revealed, todayKey]);

  const launchConfetti = useCallback(() => {
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
    const starColors = ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"];

    // Side cannons - continuous burst for 2.5 seconds
    const end = Date.now() + 2500;
    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        startVelocity: 70,
        origin: { x: 0, y: 0.7 },
        colors: colors,
        zIndex: 99999,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        startVelocity: 70,
        origin: { x: 1, y: 0.7 },
        colors: colors,
        zIndex: 99999,
      });
      requestAnimationFrame(frame);
    };
    frame();

    // Stars burst from top - multiple waves
    const starDefaults = {
      spread: 360,
      ticks: 80,
      gravity: 0.4,
      decay: 0.94,
      startVelocity: 35,
      colors: starColors,
      zIndex: 99999,
    };

    const shootStars = () => {
      confetti({
        ...starDefaults,
        particleCount: 50,
        scalar: 1.4,
        shapes: ["star"],
        origin: { x: 0.5, y: 0.25 },
      });
      confetti({
        ...starDefaults,
        particleCount: 15,
        scalar: 0.9,
        shapes: ["circle"],
        origin: { x: 0.5, y: 0.25 },
      });
    };

    // Multiple star bursts
    setTimeout(shootStars, 0);
    setTimeout(shootStars, 200);
    setTimeout(shootStars, 400);
    setTimeout(shootStars, 800);

    // Extra big center burst
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        startVelocity: 55,
        gravity: 0.7,
        scalar: 1.2,
        ticks: 150,
        origin: { x: 0.5, y: 0.5 },
        colors: [...colors, ...starColors],
        zIndex: 99999,
      });
    }, 300);
  }, []);

  // Launch confetti when dialog opens after reveal
  useEffect(() => {
    if (dialogOpen && revealed) {
      launchConfetti();
    }
  }, [dialogOpen, revealed, launchConfetti]);

  const handleCardClick = () => {
    if (!revealed) {
      setConfirmOpen(true);
      return;
    }
    setDialogOpen(true);
  };

  const handleConfirmReveal = () => {
    setRevealed(true);
    setDialogOpen(true);
    setConfirmOpen(false);
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <Card
          role="button"
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick();
            }
          }}
          className="bg-linear-to-r from-primary/10 via-background to-background border-primary/20 cursor-pointer hover:border-primary/50 transition-all group"
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Player of the Day</h3>
                <p className="text-muted-foreground text-sm group-hover:text-primary transition-colors">
                  {revealed
                    ? playerName
                      ? `🏆 ${playerName}`
                      : "No matches played today yet"
                    : "Click to reveal today's champion"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="group-hover:translate-x-1 transition-transform"
            >
              {revealed ? "Details" : "Reveal"}
              <ChevronDown className="ml-2 h-4 w-4 -rotate-90" />
            </Button>
          </CardContent>
        </Card>

        <DialogContent
          className="sm:max-w-md text-center"
          style={{ zIndex: 99990 }}
        >
          <DialogHeader>
            <DialogTitle className="text-center flex flex-col items-center gap-2">
              <Trophy className="h-8 w-8 text-primary mb-2" />
              Player of the Day
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="scale-150 transform py-4">
              <div className="text-4xl font-black text-primary tracking-tight">
                {playerName || ""}
              </div>
            </div>
            <p className="text-muted-foreground">
              {playerName
                ? "Most wins achieved today!"
                : "No matches played today yet."}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent style={{ zIndex: 99990 }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Reveal Player of the Day?</AlertDialogTitle>
            <AlertDialogDescription>
              This reveal is one-time for today. Once confirmed, you cannot hide
              or re-run the reveal again until tomorrow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReveal}>
              Yes, reveal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
