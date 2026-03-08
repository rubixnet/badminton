"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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


const ease = [0.4, 0, 0.2, 1] as const;   // material standard — smooth in+out
const fadeT = { duration: 0.55, ease } as const;
const CSS_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const COL_Template = `grid-template-columns 0.55s ${CSS_EASE}, gap 0.55s ${CSS_EASE}`;
const ROW_Template = `grid-template-rows 0.55s ${CSS_EASE}`;


function TeamSection({
  teamId,
  compact,
  bonusEnabled,
  animated,
  p1, p1Bonus, p2, p2Bonus, score,
  onP1, onP1Bonus, onP2, onP2Bonus, onScore,
  p1Required,
}: {
  teamId: string;
  compact: boolean;
  bonusEnabled: boolean;
  animated: boolean;
  p1: string; p1Bonus: string; p2: string; p2Bonus: string; score: string;
  onP1: (v: string) => void; onP1Bonus: (v: string) => void;
  onP2: (v: string) => void; onP2Bonus: (v: string) => void;
  onScore: (v: string) => void;
  p1Required?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateColumns: compact ? "1fr 0fr" : "1fr 1fr",
          gap: compact ? "0px" : "12px",
          transition: animated ? COL_Template : "none",
        }}
      >
        <div className="flex items-end min-w-0">
          <div className="flex-1 min-w-0">
            <Label htmlFor={`${teamId}-p1`} className="font-semibold text-[13px]">Player 1</Label>
            <Input
              id={`${teamId}-p1`}
              value={p1}
              onChange={(e) => /^[a-zA-Z\s]*$/.test(e.target.value) && onP1(e.target.value)}
              placeholder="Enter name"
              required={p1Required}
              className="mt-1 focus-visible:ring-0"
            />
          </div>
          <motion.div
            initial={false}
            animate={{ width: bonusEnabled ? 96 : 0, marginLeft: bonusEnabled ? 8 : 0, opacity: bonusEnabled ? 1 : 0 }}
            transition={animated ? fadeT : { duration: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-24">
              <Label htmlFor={`${teamId}-p1-bonus`} className="font-semibold text-[13px]">Bonus</Label>
              <Input id={`${teamId}-p1-bonus`} type="number" value={p1Bonus} onChange={(e) => onP1Bonus(e.target.value)} placeholder="0" className="mt-1 focus-visible:ring-0" />
            </div>
          </motion.div>
        </div>

        <div className="flex items-end min-w-0" style={{ transition: animated ? "opacity 0.55s " + CSS_EASE + ", filter 0.55s " + CSS_EASE : "none", opacity: compact ? 0 : 1, filter: compact ? "blur(8px)" : "blur(0px)" }}>
          <div className="flex-1 min-w-0">
            <Label htmlFor={`${teamId}-p2-top`} className="font-semibold text-[13px]">Player 2</Label>
            <Input
              id={`${teamId}-p2-top`}
              value={p2}
              onChange={(e) => /^[a-zA-Z\s]*$/.test(e.target.value) && onP2(e.target.value)}
              placeholder="Enter name"
              className="mt-1 focus-visible:ring-0"
            />
          </div>
          <motion.div
            initial={false}
            animate={{ width: bonusEnabled && !compact ? 96 : 0, marginLeft: bonusEnabled && !compact ? 8 : 0, opacity: bonusEnabled && !compact ? 1 : 0 }}
            transition={animated ? fadeT : { duration: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-24">
              <Label htmlFor={`${teamId}-p2-bonus-top`} className="font-semibold text-[13px]">Bonus</Label>
              <Input id={`${teamId}-p2-bonus-top`} type="number" value={p2Bonus} onChange={(e) => onP2Bonus(e.target.value)} placeholder="0" className="mt-1 focus-visible:ring-0" />
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateRows: compact ? "1fr" : "0fr", transition: animated ? ROW_Template : "none" }}>
        <div className="overflow-hidden">
          {/* pt-3 inside overflow-hidden so the gap collapses with the row */}
          <motion.div
            initial={false}
            animate={{ opacity: compact ? 1 : 0, filter: compact ? "blur(0px)" : "blur(8px)" }}
            transition={animated ? { ...fadeT, delay: compact ? 0.28 : 0 } : { duration: 0 }}
            className="flex items-end pt-3"
          >
            <div className="flex-1 min-w-0">
              <Label htmlFor={`${teamId}-p2`} className="font-semibold text-[13px]">Player 2</Label>
              <Input
                id={`${teamId}-p2`}
                value={p2}
                onChange={(e) => /^[a-zA-Z\s]*$/.test(e.target.value) && onP2(e.target.value)}
                placeholder="Enter name"
                className="mt-1 focus-visible:ring-0"
              />
            </div>
            <div className="w-24 shrink-0 ml-2">
              <Label htmlFor={`${teamId}-p2-bonus`} className="font-semibold text-[13px]">Bonus</Label>
              <Input id={`${teamId}-p2-bonus`} type="number" value={p2Bonus} onChange={(e) => onP2Bonus(e.target.value)} placeholder="0" className="mt-1 focus-visible:ring-0" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-3 w-[calc(50%-6px)]">
        <Label htmlFor={`${teamId}-score`} className="font-semibold text-[13px]">Final Score</Label>
        <Input
          id={`${teamId}-score`}
          type="number"
          min="0"
          value={score}
          onChange={(e) => /^\d*$/.test(e.target.value) && onScore(e.target.value)}
          placeholder="0"
          required
          className="mt-1 focus-visible:ring-0"
        />
      </div>
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
  // Read localStorage synchronously so the first render already has the correct
  // bonus state — prevents the layout from animating on open.
  const [bonusEnabled, setBonusEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(BONUS_PREFERENCE_STORAGE_KEY);
    return stored === "true";
  });
  // Transitions are suppressed until after first mount so the layout renders
  // in its already-correct state without playing any startup animation.
  const [animated, setAnimated] = useState(false);
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

  // Enable transitions only on the first user toggle (not on mount/API load)
  const handleBonusToggle = (enabled: boolean) => {
    if (!animated) setAnimated(true);
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

      <TeamSection
        teamId="team1"
        compact={compactBonusLayout}
        bonusEnabled={bonusEnabled}
        animated={animated}
        p1={team1Player1} p1Bonus={team1Player1Bonus}
        p2={team1Player2} p2Bonus={team1Player2Bonus}
        score={team1Score}
        onP1={setTeam1Player1} onP1Bonus={setTeam1Player1Bonus}
        onP2={setTeam1Player2} onP2Bonus={setTeam1Player2Bonus}
        onScore={setTeam1Score}
        p1Required
      />

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg uppercase tracking-wide">Team 2</h3>
      </div>

      <TeamSection
        teamId="team2"
        compact={compactBonusLayout}
        bonusEnabled={bonusEnabled}
        animated={animated}
        p1={team2Player1} p1Bonus={team2Player1Bonus}
        p2={team2Player2} p2Bonus={team2Player2Bonus}
        score={team2Score}
        onP1={setTeam2Player1} onP1Bonus={setTeam2Player1Bonus}
        onP2={setTeam2Player2} onP2Bonus={setTeam2Player2Bonus}
        onScore={setTeam2Score}
        p1Required
      />

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
