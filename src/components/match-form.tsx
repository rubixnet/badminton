"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/types/match";

interface MatchFormProps {
  onSubmit: (match: any) => void;
  initialData?: Match;
  onCancel?: () => void;
}

export function MatchForm({ onSubmit, initialData, onCancel }: MatchFormProps) {
  const { toast } = useToast();
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
            onCheckedChange={(checked) => setBonusEnabled(checked === true)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="team1-player1" className="font-semibold">
              Player 1
            </Label>
            <Input
              id="team1-player1"
              value={team1Player1}
              onChange={(e) =>
                /^[a-zA-Z\s]*$/.test(e.target.value) &&
                setTeam1Player1(e.target.value)
              }
              placeholder="Enter name"
              required
              className="mt-1 focus-visible:ring-0"
            />
          </div>
          {bonusEnabled && (
            <div className="w-16 shrink-0">
              <Label
                htmlFor="team1-player1-bonus"
                className="font-semibold text-xs"
              >
                Bonus
              </Label>
              <Input
                id="team1-player1-bonus"
                type="number"
                value={team1Player1Bonus}
                onChange={(e) => setTeam1Player1Bonus(e.target.value)}
                placeholder="0"
                className="mt-1 focus-visible:ring-0"
              />
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="team1-player2" className="font-semibold">
              Player 2
            </Label>
            <Input
              id="team1-player2"
              value={team1Player2}
              onChange={(e) =>
                /^[a-zA-Z\s]*$/.test(e.target.value) &&
                setTeam1Player2(e.target.value)
              }
              placeholder="Enter name"
              className="mt-1 focus-visible:ring-0"
            />
          </div>
          {bonusEnabled && (
            <div className="w-16 shrink-0">
              <Label
                htmlFor="team1-player2-bonus"
                className="font-semibold text-xs"
              >
                Bonus
              </Label>
              <Input
                id="team1-player2-bonus"
                type="number"
                value={team1Player2Bonus}
                onChange={(e) => setTeam1Player2Bonus(e.target.value)}
                placeholder="0"
                className="mt-1 focus-visible:ring-0"
              />
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="team1-score" className="font-semibold">
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
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg uppercase tracking-wide">Team 2</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="team2-player1" className="font-semibold">
              Player 1
            </Label>
            <Input
              id="team2-player1"
              value={team2Player1}
              onChange={(e) =>
                /^[a-zA-Z\s]*$/.test(e.target.value) &&
                setTeam2Player1(e.target.value)
              }
              placeholder="Enter name"
              required
              className="mt-1 focus-visible:ring-0"
            />
          </div>
          {bonusEnabled && (
            <div className="w-16 shrink-0">
              <Label
                htmlFor="team2-player1-bonus"
                className="font-semibold text-xs"
              >
                Bonus
              </Label>
              <Input
                id="team2-player1-bonus"
                type="number"
                value={team2Player1Bonus}
                onChange={(e) => setTeam2Player1Bonus(e.target.value)}
                placeholder="0"
                className="mt-1 focus-visible:ring-0"
              />
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="team2-player2" className="font-semibold">
              Player 2
            </Label>
            <Input
              id="team2-player2"
              value={team2Player2}
              onChange={(e) =>
                /^[a-zA-Z\s]*$/.test(e.target.value) &&
                setTeam2Player2(e.target.value)
              }
              placeholder="Enter name"
              className="mt-1 focus-visible:ring-0"
            />
          </div>
          {bonusEnabled && (



            <div className="w-16 shrink-0">
              <Label
                htmlFor="team2-player2-bonus"
                className="font-semibold text-xs"
              >
                Bonus
              </Label>
              <Input
                id="team2-player2-bonus"
                type="number"
                value={team2Player2Bonus}
                onChange={(e) => setTeam2Player2Bonus(e.target.value)}
                placeholder="0"
                className="mt-1 focus-visible:ring-0"
              />
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="team2-score" className="font-semibold">
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
        </div>
      </div>

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
