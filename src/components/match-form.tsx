"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Plus, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formSettingsKey, useFormSettings } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { Match } from "@/types/match";

const BONUS_PREFERENCE_STORAGE_KEY = "badminton:bonus-enabled";

const ease = [0.4, 0, 0.2, 1] as const; 
const fadeT = { duration: 0.55, ease } as const;
const CSS_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const COL_Template = `grid-template-columns 0.55s ${CSS_EASE}, gap 0.55s ${CSS_EASE}`;
const ROW_Template = `grid-template-rows 0.55s ${CSS_EASE}`;

function PlayerAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  required,
  className,
  players,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  players: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPlayers = players.filter((p) =>
    p.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          const filteredValue = e.target.value.replace(/[^a-zA-Z\s]/g, "");
          onChange(filteredValue);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        className={className}
        autoComplete="off"
      />
      
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-background border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <button
                type="button"
                key={player}
                className="block w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onMouseDown={(e) => {
                  // Use onMouseDown to trigger BEFORE the input's onBlur event fires
                  e.preventDefault(); 
                  onChange(player);
                  setIsOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(player);
                    setIsOpen(false);
                  }
                }}
              >
                {player}
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-muted-foreground text-center italic">
              No existing players found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ----------------------------------

/**
 * One labelled player input plus its optional bonus box.
/** The bonus input itself, so animated and static call sites share it. */
function BonusInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="w-24">
      <Label htmlFor={id} className="font-semibold text-[13px]">
        Bonus
      </Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="mt-1 focus-visible:ring-0"
      />
    </div>
  );
}

/**
 * One labelled player input plus its bonus box.
 *
 * The team grid renders this three times (P1, P2-top, P2-expanded); each copy
 * differs only in ids and whether the bonus animates open, so the markup lives
 * here once instead of three near-identical blocks.
 *
 * `animateBonus` drives the reveal. It is a real layout change - the player
 * field has to reflow and the input must not be squashed by a scale - so the
 * geometry comes from `className` and Motion's `layout` prop projects the
 * before/after with a transform rather than animating `width`.
 */
function PlayerField({
  id,
  label,
  value,
  onChange,
  players,
  required,
  bonus,
  animateBonus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  players: string[];
  required?: boolean;
  bonus: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    /** Whether the reveal animates; the expanded row uses a plain column. */
    visible: boolean;
    transition: object;
  };
  animateBonus: boolean;
}) {
  const input = (
    <BonusInput
      id={bonus.id}
      value={bonus.value}
      onChange={bonus.onChange}
    />
  );

  return (
    <div className="flex items-end min-w-0">
      <div className="flex-1 min-w-0 relative">
        <Label htmlFor={id} className="font-semibold text-[13px]">
          {label}
        </Label>
        <PlayerAutocomplete
          id={id}
          value={value}
          onChange={onChange}
          placeholder="Enter name"
          required={required}
          className="mt-1 focus-visible:ring-0"
          players={players}
        />
      </div>

      {animateBonus ? (
        <m.div
          layout="position"
          initial={false}
          animate={{ opacity: bonus.visible ? 1 : 0 }}
          transition={bonus.transition}
          className={cn(
            "shrink-0 overflow-hidden",
            bonus.visible ? "w-24 ml-2" : "w-0 ml-0",
          )}
        >
          {input}
        </m.div>
      ) : (
        <div className="shrink-0 overflow-hidden w-24 ml-2">{input}</div>
      )}
    </div>
  );
}

/**
 * Player 2's top-row cell.
 *
 * Same inputs as the collapsible row, but this cell fades and blurs out when the
 * form switches to its compact layout instead of collapsing.
 */
function FadedPlayerTwo({
  teamId,
  compact,
  animated,
  value,
  onChange,
  players,
  bonusValue,
  onBonusChange,
  bonusVisible,
  bonusTransition,
}: {
  teamId: string;
  compact: boolean;
  animated: boolean;
  value: string;
  onChange: (v: string) => void;
  players: string[];
  bonusValue: string;
  onBonusChange: (v: string) => void;
  bonusVisible: boolean;
  bonusTransition: object;
}) {
  return (
    <div
      className="flex items-end min-w-0"
      style={{
        transition: animated
          ? "opacity 0.55s " + CSS_EASE + ", filter 0.55s " + CSS_EASE
          : "none",
        opacity: compact ? 0 : 1,
        filter: compact ? "blur(8px)" : "blur(0px)",
      }}
    >
      <PlayerField
        id={`${teamId}-p2-top`}
        label="Player 2"
        value={value}
        onChange={onChange}
        players={players}
        bonus={{
          id: `${teamId}-p2-bonus-top`,
          value: bonusValue,
          onChange: onBonusChange,
          visible: bonusVisible,
          transition: bonusTransition,
        }}
        animateBonus
      />
    </div>
  );
}

/**
 * Player 2's second row.
 *
 * It is the same pair of inputs as the top row, only revealed by collapsing the
 * grid track instead of fading in - so the reveal is its own component rather
 * than another conditional block inside `TeamSection`.
 */
function CollapsiblePlayerTwo({
  teamId,
  compact,
  animated,
  value,
  onChange,
  players,
  bonusValue,
  onBonusChange,
}: {
  teamId: string;
  compact: boolean;
  animated: boolean;
  value: string;
  onChange: (v: string) => void;
  players: string[];
  bonusValue: string;
  onBonusChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: compact ? "1fr" : "0fr",
        transition: animated ? ROW_Template : "none",
      }}
    >
      {/* Toggle overflow to prevent clipping when fully expanded */}
      <div className={compact ? "overflow-visible" : "overflow-hidden"}>
        <m.div
          initial={false}
          animate={{
            opacity: compact ? 1 : 0,
            filter: compact ? "blur(0px)" : "blur(8px)",
          }}
          transition={
            animated ? { ...fadeT, delay: compact ? 0.28 : 0 } : { duration: 0 }
          }
          className="flex items-end pt-3"
        >
          <PlayerField
            id={`${teamId}-p2`}
            label="Player 2"
            value={value}
            onChange={onChange}
            players={players}
            bonus={{
              id: `${teamId}-p2-bonus`,
              value: bonusValue,
              onChange: onBonusChange,
              visible: true,
              transition: fadeT,
            }}
            animateBonus={false}
          />
        </m.div>
      </div>
    </div>
  );
}

function TeamSection({
  teamId,
  compact,
  bonusEnabled,
  animated,
  playerList,
  p1,
  p1Bonus,
  p2,
  p2Bonus,
  score,
  onP1,
  onP1Bonus,
  onP2,
  onP2Bonus,
  onScore,
  p1Required,
}: {
  teamId: string;
  compact: boolean;
  bonusEnabled: boolean;
  animated: boolean;
  playerList: string[];
  p1: string;
  p1Bonus: string;
  p2: string;
  p2Bonus: string;
  score: string;
  onP1: (v: string) => void;
  onP1Bonus: (v: string) => void;
  onP2: (v: string) => void;
  onP2Bonus: (v: string) => void;
  onScore: (v: string) => void;
  p1Required?: boolean;
}) {
  const bonusTransition = animated ? fadeT : { duration: 0 };
  const p2Visible = bonusEnabled && !compact;

  return (
    <div className="flex flex-col">
      <div
        className="grid" // Removed overflow-hidden so the dropdown can overlay
        style={{
          gridTemplateColumns: compact ? "1fr 0fr" : "1fr 1fr",
          gap: compact ? "0px" : "12px",
          transition: animated ? COL_Template : "none",
        }}
      >
        <PlayerField
          id={`${teamId}-p1`}
          label="Player 1"
          value={p1}
          onChange={onP1}
          players={playerList}
          required={p1Required}
          bonus={{
            id: `${teamId}-p1-bonus`,
            value: p1Bonus,
            onChange: onP1Bonus,
            visible: bonusEnabled,
            transition: bonusTransition,
          }}
          animateBonus
        />

        <FadedPlayerTwo
          teamId={teamId}
          compact={compact}
          animated={animated}
          value={p2}
          onChange={onP2}
          players={playerList}
          bonusValue={p2Bonus}
          onBonusChange={onP2Bonus}
          bonusVisible={p2Visible}
          bonusTransition={bonusTransition}
        />
      </div>

      <CollapsiblePlayerTwo
        teamId={teamId}
        compact={compact}
        animated={animated}
        value={p2}
        onChange={onP2}
        players={playerList}
        bonusValue={p2Bonus}
        onBonusChange={onP2Bonus}
      />

      <div className="mt-3 w-[calc(50%-6px)]">
        <Label htmlFor={`${teamId}-score`} className="font-semibold text-[13px]">
          Final Score
        </Label>
        <Input
          id={`${teamId}-score`}
          type="number"
          min="0"
          value={score}
          onChange={(e) => {
            const filteredValue = e.target.value.replace(/[^\d]/g, "");
            onScore(filteredValue);
          }}
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

type CheckpointDraft = {
  id: string;
  team1Score: string;
  team2Score: string;
  note: string;
};

type CheckpointField = "team1Score" | "team2Score" | "note";

/**
 * Add/remove/update over the checkpoint drafts.
 *
 * Keeping this in its own hook means `MatchForm` only holds the list, not the
 * three mutators that go with it.
 */
function useCheckpoints(initial?: Match["checkpoints"]) {
  const [checkpoints, setCheckpoints] = useState<CheckpointDraft[]>(() =>
    (initial ?? []).map((cp) => ({
      id: `checkpoint-${crypto.randomUUID()}`,
      team1Score: cp.team1Score.toString(),
      team2Score: cp.team2Score.toString(),
      note: cp.note ?? "",
    })),
  );

  const addCheckpoint = useCallback(() => {
    setCheckpoints((prev) => [
      ...prev,
      {
        id: `checkpoint-${crypto.randomUUID()}`,
        team1Score: "",
        team2Score: "",
        note: "",
      },
    ]);
  }, []);

  const removeCheckpoint = useCallback((index: number) => {
    setCheckpoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateCheckpoint = useCallback(
    (index: number, field: CheckpointField, value: string) => {
      setCheckpoints((prev) =>
        prev.map((cp, i) => (i === index ? { ...cp, [field]: value } : cp)),
      );
    },
    [],
  );

  return { checkpoints, addCheckpoint, removeCheckpoint, updateCheckpoint };
}

/** The checkpoint list editor: add/remove buttons plus one card per checkpoint. */
function CheckpointEditor({
  checkpoints,
  onAdd,
  onRemove,
  onChange,
}: {
  checkpoints: CheckpointDraft[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: CheckpointField, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg uppercase tracking-wide">
          Checkpoints{" "}
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {checkpoints.map((checkpoint, index) => (
        <div key={checkpoint.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase">
              Checkpoint {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove checkpoint ${index + 1}`}
              className="h-8 w-8"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor={`cp${checkpoint.id}-team1`}
                className="font-semibold"
              >
                Team 1 Score
              </Label>
              <Input
                id={`cp${checkpoint.id}-team1`}
                type="number"
                min="0"
                value={checkpoint.team1Score}
                onChange={(e) =>
                  onChange(index, "team1Score", e.target.value)
                }
                placeholder="0"
                className="mt-1 focus-visible:ring-0"
              />
            </div>
            <div>
              <Label
                htmlFor={`cp${checkpoint.id}-team2`}
                className="font-semibold"
              >
                Team 2 Score
              </Label>
              <Input
                id={`cp${checkpoint.id}-team2`}
                type="number"
                min="0"
                value={checkpoint.team2Score}
                onChange={(e) =>
                  onChange(index, "team2Score", e.target.value)
                }
                placeholder="0"
                className="mt-1 focus-visible:ring-0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`cp${checkpoint.id}-note`} className="font-semibold">
              Note
            </Label>
            <Textarea
              id={`cp${checkpoint.id}-note`}
              value={checkpoint.note}
              onChange={(e) => onChange(index, "note", e.target.value)}
              placeholder="e.g., 'End of first set'"
              rows={2}
              className="mt-1"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MatchForm({ onSubmit, initialData, onCancel }: MatchFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isSmallScreen = useMediaQuery("max-sm");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bonusEnabled, setBonusEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(BONUS_PREFERENCE_STORAGE_KEY);
    return stored === "true";
  });
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

  const {
    checkpoints,
    addCheckpoint,
    removeCheckpoint,
    updateCheckpoint,
  } = useCheckpoints(initialData?.checkpoints);

  const compactBonusLayout = isSmallScreen && bonusEnabled;

  useEffect(() => {
    const stored = localStorage.getItem("badminton_matches");
    if (stored) {
      try {
        const matches = JSON.parse(stored);
        const players = new Set<string>();
        matches.forEach((match: Match) => {
          match.team1.players.forEach(
            (player) => player.name && players.add(player.name.trim())
          );
          match.team2.players.forEach(
            (player) => player.name && players.add(player.name.trim())
          );
        });
        setPlayerList(Array.from(players).sort());
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const settingsQuery = useFormSettings({ enabled: !initialData });
  const remoteBonusEnabled = settingsQuery.data?.bonusEnabled;

  useEffect(() => {
    if (typeof remoteBonusEnabled !== "boolean") return;
    setBonusEnabled(remoteBonusEnabled);
    localStorage.setItem(BONUS_PREFERENCE_STORAGE_KEY, String(remoteBonusEnabled));
  }, [remoteBonusEnabled]);

  useEffect(() => {
    if (initialData) {
      setTeam1Player1(initialData.team1.players[0]?.name || "");
      setTeam1Player2(initialData.team1.players[1]?.name || "");
      setTeam1Player1Bonus(
        initialData.team1.players[0]?.bonusPoints?.toString() || ""
      );
      setTeam1Player2Bonus(
        initialData.team1.players[1]?.bonusPoints?.toString() || ""
      );
      setTeam1Score(initialData.team1.score.toString());

      setTeam2Player1(initialData.team2.players[0]?.name || "");
      setTeam2Player2(initialData.team2.players[1]?.name || "");
      setTeam2Player1Bonus(
        initialData.team2.players[0]?.bonusPoints?.toString() || ""
      );
      setTeam2Player2Bonus(
        initialData.team2.players[1]?.bonusPoints?.toString() || ""
      );
      setTeam2Score(initialData.team2.score.toString());

      const hasBonus = [
        initialData.team1.players[0]?.bonusPoints,
        initialData.team1.players[1]?.bonusPoints,
        initialData.team2.players[0]?.bonusPoints,
        initialData.team2.players[1]?.bonusPoints,
      ].some((points) => points && points > 0);
      setBonusEnabled(hasBonus);

    }
  }, [initialData]);

  const handleBonusToggle = (enabled: boolean) => {
    if (!animated) setAnimated(true);
    setBonusEnabled(enabled);
    localStorage.setItem(BONUS_PREFERENCE_STORAGE_KEY, String(enabled));
    queryClient.setQueryData(formSettingsKey, { bonusEnabled: enabled });

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
        name.trim()
      );
      const team2Players = [team2Player1, team2Player2].filter((name) =>
        name.trim()
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
    } catch {
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
        playerList={playerList}
        p1={team1Player1}
        p1Bonus={team1Player1Bonus}
        p2={team1Player2}
        p2Bonus={team1Player2Bonus}
        score={team1Score}
        onP1={setTeam1Player1}
        onP1Bonus={setTeam1Player1Bonus}
        onP2={setTeam1Player2}
        onP2Bonus={setTeam1Player2Bonus}
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
        playerList={playerList}
        p1={team2Player1}
        p1Bonus={team2Player1Bonus}
        p2={team2Player2}
        p2Bonus={team2Player2Bonus}
        score={team2Score}
        onP1={setTeam2Player1}
        onP1Bonus={setTeam2Player1Bonus}
        onP2={setTeam2Player2}
        onP2Bonus={setTeam2Player2Bonus}
        onScore={setTeam2Score}
        p1Required
      />

      <CheckpointEditor
        checkpoints={checkpoints}
        onAdd={addCheckpoint}
        onRemove={removeCheckpoint}
        onChange={updateCheckpoint}
      />

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