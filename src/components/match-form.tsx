"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Plus, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/types/match";

const BONUS_PREFERENCE_STORAGE_KEY = "badminton:bonus-enabled";

const layoutTransition = {
  type: "spring",
  stiffness: 250,
  damping: 28,
  mass: 0.9,
} as const;

const sectionSwapTransition = {
  duration: 0.34,
  ease: [0.22, 1, 0.36, 1],
} as const;

const bonusFieldTransition = {
  duration: 0.28,
  ease: [0.32, 0.72, 0, 1],
} as const;

interface AnimatedPlayerRowProps {
  label: string;
  playerId: string;
  playerValue: string;
  onPlayerChange: (value: string) => void;
  bonusId: string;
  bonusValue: string;
  onBonusChange: (value: string) => void;
  required?: boolean;
  showBonus: boolean;
  animateBonusField?: boolean;
}

function AnimatedPlayerRow({
  label,
  playerId,
  playerValue,
  onPlayerChange,
  bonusId,
  bonusValue,
  onBonusChange,
  required = false,
  showBonus,
  animateBonusField = true,
}: AnimatedPlayerRowProps) {
  return (
    <div className="flex items-end gap-2">
      <motion.div
        layout
        transition={layoutTransition}
        className={showBonus ? "flex-[0.65]" : "flex-1"}
      >
        <Label htmlFor={playerId} className="font-semibold text-[13px]">
          {label}
        </Label>
        <Input
          id={playerId}
          value={playerValue}
          onChange={(e) =>
            /^[a-zA-Z\s]*$/.test(e.target.value) && onPlayerChange(e.target.value)
          }
          placeholder="Enter name"
          required={required}
          className="mt-1 focus-visible:ring-0"
        />
      </motion.div>

      {animateBonusField ? (
        <AnimatePresence initial={false}>
          {showBonus && (
            <motion.div
              key={bonusId}
              className="flex-[0.35] shrink-0 origin-top-right"
              initial={{
                opacity: 0,
                filter: "blur(10px)",
                clipPath: "inset(0 0 0 100% round 12px)",
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                filter: "blur(0px)",
                clipPath: "inset(0 0 0 0 round 12px)",
                scale: 1,
              }}
              exit={{
                opacity: 0,
                filter: "blur(10px)",
                clipPath: "inset(0 0 0 100% round 12px)",
                scale: 0.98,
              }}
              transition={bonusFieldTransition}
            >
              <Label htmlFor={bonusId} className="font-semibold text-[13px]">
                Bonus
              </Label>
              <Input
                id={bonusId}
                type="number"
                value={bonusValue}
                onChange={(e) => onBonusChange(e.target.value)}
                placeholder="0"
                className="mt-1 focus-visible:ring-0"
              />
            </motion.div>
          )}
        </AnimatePresence>
      ) : showBonus ? (
        <div className="flex-[0.35] shrink-0">
          <Label htmlFor={bonusId} className="font-semibold text-[13px]">
            Bonus
          </Label>
          <Input
            id={bonusId}
            type="number"
            value={bonusValue}
            onChange={(e) => onBonusChange(e.target.value)}
            placeholder="0"
            className="mt-1 focus-visible:ring-0"
          />
        </div>
      ) : null}
    </div>
  );
}

interface MatchFormProps {
  onSubmit: (match: any) => void;
  initialData?: Match;
  onCancel?: () => void;
}


export function MatchForm({ onSubmit, initialData, onCancel }: MatchFormProps) {
  const { toast } = useToast();
  const isSmallScreen = useMediaQuery("max-sm");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bonusEnabled, setBonusEnabled] = useState(false);
  const [playerList, setPlayerList] = useState<string[]>([]);

  const [team1Player1, setTeam1Player1] = useState("");
  const [team1Player2, setTeam1Player2] = useState("");
  const [team1Player1Bonus, setTeam1Player1Bonus] = useState("");
  const [team1Player2Bonus, setTeam1Player2Bonus] = useState("");
  const [team1Score, setTeam1Score] = useState("");

  const [team2Player1, setTeam2Player1] = useState("");
  const [team2Player2, setTeam2Player2] = useState("");
  const [team2Player1Bonus, setTeam2Player1Bonus] = useState("");
  const [team2Player2Bonus, setTeam2Player2Bonus] = useState("");
  const [team2Score, setTeam2Score] = useState("");

  const [checkpoints, setCheckpoints] = useState<
    Array<{ team1Score: string; team2Score: string; note: string }>
  >([]);

  const compactBonusLayout = isSmallScreen && bonusEnabled;

  useEffect(() => {
    // Load existing players from localStorage
    const stored = localStorage.getItem("badminton_matches");
    if (stored) {
      try {
        const matches = JSON.parse(stored);
        const players = new Set<string>();
        matches.forEach((match: Match) => {
          match.team1.players.forEach(
            (player) => player.name && players.add(player.name.trim()),
          );
          match.team2.players.forEach(
            (player) => player.name && players.add(player.name.trim()),
          );
        });
        setPlayerList(Array.from(players).sort());
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      return;
    }

    const storedPreference = localStorage.getItem(BONUS_PREFERENCE_STORAGE_KEY);
    if (storedPreference !== null) {
      setBonusEnabled(storedPreference === "true");
    }

    let cancelled = false;

    const loadBonusPreference = async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const settings = (await response.json()) as { bonusEnabled?: boolean };

        if (!cancelled && typeof settings.bonusEnabled === "boolean") {
          setBonusEnabled(settings.bonusEnabled);
          localStorage.setItem(
            BONUS_PREFERENCE_STORAGE_KEY,
            String(settings.bonusEnabled),
          );
        }
      } catch (error) {
        console.error("Failed to load bonus preference:", error);
      }
    };

    void loadBonusPreference();

    return () => {
      cancelled = true;
    };
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      setTeam1Player1(initialData.team1.players[0]?.name || "");
      setTeam1Player2(initialData.team1.players[1]?.name || "");
      setTeam1Player1Bonus(
        initialData.team1.players[0]?.bonusPoints?.toString() || "",
      );
      setTeam1Player2Bonus(
        initialData.team1.players[1]?.bonusPoints?.toString() || "",
      );
      setTeam1Score(initialData.team1.score.toString());

      setTeam2Player1(initialData.team2.players[0]?.name || "");
      setTeam2Player2(initialData.team2.players[1]?.name || "");
      setTeam2Player1Bonus(
        initialData.team2.players[0]?.bonusPoints?.toString() || "",
      );
      setTeam2Player2Bonus(
        initialData.team2.players[1]?.bonusPoints?.toString() || "",
      );
      setTeam2Score(initialData.team2.score.toString());

      // Set bonus enabled if any player has bonus points
      const hasBonus = [
        initialData.team1.players[0]?.bonusPoints,
        initialData.team1.players[1]?.bonusPoints,
        initialData.team2.players[0]?.bonusPoints,
        initialData.team2.players[1]?.bonusPoints,
      ].some((points) => points && points > 0);
      setBonusEnabled(hasBonus);

      if (initialData.checkpoints) {
        setCheckpoints(
          initialData.checkpoints.map((cp) => ({
            team1Score: cp.team1Score.toString(),
            team2Score: cp.team2Score.toString(),
            note: cp.note ?? "",
          })),
        );
      }
    }
  }, [initialData]);

  const addCheckpoint = () => {
    setCheckpoints([
      ...checkpoints,
      { team1Score: "", team2Score: "", note: "" },
    ]);
  };

  const removeCheckpoint = (index: number) => {
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  const updateCheckpoint = (
    index: number,
    field: "team1Score" | "team2Score" | "note",
    value: string,
  ) => {
    const updated = [...checkpoints];
    updated[index][field] = value;
    setCheckpoints(updated);
  };

  const handleBonusToggle = (enabled: boolean) => {
    setBonusEnabled(enabled);
    localStorage.setItem(BONUS_PREFERENCE_STORAGE_KEY, String(enabled));

    void fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bonusEnabled: enabled }),
    }).catch((error) => {
      console.error("Failed to persist bonus preference:", error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const team1Players = [team1Player1, team1Player2].filter((name) =>
        name.trim(),
      );
      const team2Players = [team2Player1, team2Player2].filter((name) =>
        name.trim(),
      );

      if (team1Players.length === 0 || team2Players.length === 0) {
        toast({
          title: "Error",
          description: "Each team must have at least one player.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const matchData = {
        team1: {
          players: [team1Player1, team1Player2]
            .filter((name) => name.trim())
            .map((name, index) => ({
              name,
              bonusPoints: bonusEnabled
                ? index === 0
                  ? team1Player1Bonus
                    ? parseInt(team1Player1Bonus)
                    : 0
                  : team1Player2Bonus
                    ? parseInt(team1Player2Bonus)
                    : 0
                : 0,
            })),
          score: parseInt(team1Score),
        },
        team2: {
          players: [team2Player1, team2Player2]
            .filter((name) => name.trim())
            .map((name, index) => ({
              name,
              bonusPoints: bonusEnabled
                ? index === 0
                  ? team2Player1Bonus
                    ? parseInt(team2Player1Bonus)
                    : 0
                  : team2Player2Bonus
                    ? parseInt(team2Player2Bonus)
                    : 0
                : 0,
            })),
          score: parseInt(team2Score),
        },
        checkpoints: checkpoints
          .filter((cp) => cp.team1Score && cp.team2Score)
          .map((cp) => ({
            team1Score: parseInt(cp.team1Score),
            team2Score: parseInt(cp.team2Score),
            note: cp.note,
            timestamp: new Date().toISOString(),
          })),
        createdAt: initialData?.createdAt || new Date().toISOString(),
      };

      await onSubmit(matchData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process match data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg uppercase tracking-wide">Team 1</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="bonus-toggle" className="text-sm">
            Bonus Points
          </Label>
          <Checkbox
            id="bonus-toggle"
            checked={bonusEnabled}
            onCheckedChange={(checked) => handleBonusToggle(checked === true)}
          />
        </div>
      </div>
      <motion.div layout transition={layoutTransition} className="overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {compactBonusLayout ? (
            <motion.div
              key="team1-stacked"
              layout
              initial={{ opacity: 0, y: 24, scale: 0.985, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -14, scale: 0.985, filter: "blur(10px)" }}
              transition={sectionSwapTransition}
              className="space-y-4"
            >
              <AnimatedPlayerRow
                label="Player 1"
                playerId="team1-player1"
                playerValue={team1Player1}
                onPlayerChange={setTeam1Player1}
                bonusId="team1-player1-bonus"
                bonusValue={team1Player1Bonus}
                onBonusChange={setTeam1Player1Bonus}
                required
                showBonus
                animateBonusField={false}
              />
              <AnimatedPlayerRow
                label="Player 2"
                playerId="team1-player2"
                playerValue={team1Player2}
                onPlayerChange={setTeam1Player2}
                bonusId="team1-player2-bonus"
                bonusValue={team1Player2Bonus}
                onBonusChange={setTeam1Player2Bonus}
                showBonus
                animateBonusField={false}
              />
            </motion.div>
          ) : (
            <motion.div
              key="team1-grid"
              layout
              initial={{ opacity: 0, y: 10, scale: 0.995, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, scale: 0.995, filter: "blur(6px)" }}
              transition={sectionSwapTransition}
              className="grid grid-cols-2 gap-4"
            >
              <AnimatedPlayerRow
                label="Player 1"
                playerId="team1-player1"
                playerValue={team1Player1}
                onPlayerChange={setTeam1Player1}
                bonusId="team1-player1-bonus"
                bonusValue={team1Player1Bonus}
                onBonusChange={setTeam1Player1Bonus}
                required
                showBonus={bonusEnabled}
              />
              <AnimatedPlayerRow
                label="Player 2"
                playerId="team1-player2"
                playerValue={team1Player2}
                onPlayerChange={setTeam1Player2}
                bonusId="team1-player2-bonus"
                bonusValue={team1Player2Bonus}
                onBonusChange={setTeam1Player2Bonus}
                showBonus={bonusEnabled}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          layout="position"
          transition={layoutTransition}
          className={compactBonusLayout ? "mt-5 w-1/2 pr-2" : "mt-4 w-1/2 pr-2"}
        >
          <Label htmlFor="team1-score" className="font-semibold text-[13px]">
            Final Score
          </Label>
          <Input
            id="team1-score"
            type="number"
            min="0"
            value={team1Score}
            onChange={(e) =>
              /^\d*$/.test(e.target.value) && setTeam1Score(e.target.value)
            }
            placeholder="0"
            required
            className="mt-1 focus-visible:ring-0"
          />
        </motion.div>
      </motion.div>

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg uppercase tracking-wide">Team 2</h3>
      </div>
      <motion.div layout transition={layoutTransition} className="overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {compactBonusLayout ? (
            <motion.div
              key="team2-stacked"
              layout
              initial={{ opacity: 0, y: 24, scale: 0.985, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -14, scale: 0.985, filter: "blur(10px)" }}
              transition={sectionSwapTransition}
              className="space-y-4"
            >
              <AnimatedPlayerRow
                label="Player 1"
                playerId="team2-player1"
                playerValue={team2Player1}
                onPlayerChange={setTeam2Player1}
                bonusId="team2-player1-bonus"
                bonusValue={team2Player1Bonus}
                onBonusChange={setTeam2Player1Bonus}
                required
                showBonus
                animateBonusField={false}
              />
              <AnimatedPlayerRow
                label="Player 2"
                playerId="team2-player2"
                playerValue={team2Player2}
                onPlayerChange={setTeam2Player2}
                bonusId="team2-player2-bonus"
                bonusValue={team2Player2Bonus}
                onBonusChange={setTeam2Player2Bonus}
                showBonus
                animateBonusField={false}
              />
            </motion.div>
          ) : (
            <motion.div
              key="team2-grid"
              layout
              initial={{ opacity: 0, y: 10, scale: 0.995, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, scale: 0.995, filter: "blur(6px)" }}
              transition={sectionSwapTransition}
              className="grid grid-cols-2 gap-4"
            >
              <AnimatedPlayerRow
                label="Player 1"
                playerId="team2-player1"
                playerValue={team2Player1}
                onPlayerChange={setTeam2Player1}
                bonusId="team2-player1-bonus"
                bonusValue={team2Player1Bonus}
                onBonusChange={setTeam2Player1Bonus}
                required
                showBonus={bonusEnabled}
              />
              <AnimatedPlayerRow
                label="Player 2"
                playerId="team2-player2"
                playerValue={team2Player2}
                onPlayerChange={setTeam2Player2}
                bonusId="team2-player2-bonus"
                bonusValue={team2Player2Bonus}
                onBonusChange={setTeam2Player2Bonus}
                showBonus={bonusEnabled}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          layout="position"
          transition={layoutTransition}
          className={compactBonusLayout ? "mt-5 w-1/2 pr-2" : "mt-4 w-1/2 pr-2"}
        >
          <Label htmlFor="team2-score" className="font-semibold text-[13px]">
            Final Score
          </Label>
          <Input
            id="team2-score"
            type="number"
            min="0"
            value={team2Score}
            onChange={(e) =>
              /^\d*$/.test(e.target.value) && setTeam2Score(e.target.value)
            }
            placeholder="0"
            required
            className="mt-1 focus-visible:ring-0"
          />
        </motion.div>
      </motion.div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg uppercase tracking-wide">
            Checkpoints{" "}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCheckpoint}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        
        
        {checkpoints.map((checkpoint, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase">
                Checkpoint {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeCheckpoint(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`cp${index}-team1`} className="font-semibold">
                  Team 1 Score
                </Label>
                <Input
                  id={`cp${index}-team1`}
                  type="number"
                  min="0"
                  value={checkpoint.team1Score}
                  onChange={(e) =>
                    updateCheckpoint(index, "team1Score", e.target.value)
                  }
                  placeholder="0"
                  className="mt-1 focus-visible:ring-0"
                />
              </div>
              <div>
                <Label htmlFor={`cp${index}-team2`} className="font-semibold">
                  Team 2 Score
                </Label>
                <Input
                  id={`cp${index}-team2`}
                  type="number"
                  min="0"
                  value={checkpoint.team2Score}
                  onChange={(e) =>
                    updateCheckpoint(index, "team2Score", e.target.value)
                  }
                  placeholder="0"
                  className="mt-1 focus-visible:ring-0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`cp${index}-note`} className="font-semibold">
                Note
              </Label>
              <Textarea
                id={`cp${index}-note`}
                value={checkpoint.note}
                onChange={(e) =>
                  updateCheckpoint(index, "note", e.target.value)
                }
                placeholder="e.g., 'End of first set'"
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="h-10 flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Match
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
