import type { Match, Player } from "@/types/match";
import {
  computeBonusWeightedDoublesWinRateWeights,
  defaultBonusWeightedDoublesConfig,
  type BonusWeightedDoublesConfig,
} from "@/lib/doubles-winrate-weighting";

export { defaultBonusWeightedDoublesConfig };
export type { BonusWeightedDoublesConfig };

export type PlayerWinRateTotals = {
  rawMatches: number;
  rawWins: number;
  effectiveMatches: number;
  effectiveWins: number;
};

export type ComputeWinRateTotalsOptions = {
  bonusWeightedDoubles?: Partial<BonusWeightedDoublesConfig>;
};

const toName = (player: Player | undefined): string | null => {
  const name = player?.name?.trim();
  return name ? name : null;
};

const isDoublesMatch = (m: Match): boolean =>
  m.team1.players.length === 2 && m.team2.players.length === 2;

export function computePlayerWinRateTotals(
  matches: Match[],
  options: ComputeWinRateTotalsOptions = {},
): Record<string, PlayerWinRateTotals> {
  const cfg: BonusWeightedDoublesConfig = {
    ...defaultBonusWeightedDoublesConfig,
    ...(options.bonusWeightedDoubles ?? {}),
  };

  const totals: Record<string, PlayerWinRateTotals> = {};

  const ensure = (name: string) => {
    if (!totals[name]) {
      totals[name] = {
        rawMatches: 0,
        rawWins: 0,
        effectiveMatches: 0,
        effectiveWins: 0,
      };
    }
    return totals[name];
  };

  for (const m of matches) {
    const winner = m.winner;

    const t1IsWin = winner === "team1";
    const t2IsWin = winner === "team2";
    const countOutcome = t1IsWin || t2IsWin;

    const t1Names = m.team1.players.map(toName);
    const t2Names = m.team2.players.map(toName);

    if (countOutcome) {
      for (const n of t1Names) {
        if (!n) continue;
        const t = ensure(n);
        t.rawMatches += 1;
        if (t1IsWin) t.rawWins += 1;
      }
      for (const n of t2Names) {
        if (!n) continue;
        const t = ensure(n);
        t.rawMatches += 1;
        if (t2IsWin) t.rawWins += 1;
      }
    }

    if (!countOutcome) continue;

const useBonusWeighting = cfg.enabled && isDoublesMatch(m);

    if (useBonusWeighting) {
      if (cfg.strictMode) {
        // Strict mode: threshold-based penalty/boost (from Mode Comparison Page)
        const totalPoints = m.team1.score + m.team2.score;
        const threshold = Math.round(0.25 * totalPoints); // 25% threshold

        const g1 = m.team1.players.reduce(
          (sum, p) =>
            sum + (p?.bonusPoints && p.bonusPoints < 0 ? Math.abs(p.bonusPoints) : 0),
          0,
        );
        const g2 = m.team2.players.reduce(
          (sum, p) =>
            sum + (p?.bonusPoints && p.bonusPoints < 0 ? Math.abs(p.bonusPoints) : 0),
          0,
        );
        const diff = Math.abs(g1 - g2);

        let t1w: [number, number] = [1, 1];
        let t2w: [number, number] = [1, 1];

        if (diff > threshold) {
          if (g1 > g2) {
            // Team1 is "worse" (more giveaways), gets boost in strict mode
            t1w = t1IsWin ? [2, 2] : [0, 0];
            t2w = t2IsWin ? [0, 0] : [2, 2];
          } else {
            // Team2 is "worse"
            t2w = t2IsWin ? [2, 2] : [0, 0];
            t1w = t1IsWin ? [0, 0] : [2, 2];
          }
        }

        const t1Wins = t1IsWin ? t1w : [0, 0];
        const t2Wins = t2IsWin ? t2w : [0, 0];

        const players = [
          { name: t1Names[0], wMatch: t1w[0], wWin: t1Wins[0] },
          { name: t1Names[1], wMatch: t1w[1], wWin: t1Wins[1] },
          { name: t2Names[0], wMatch: t2w[0], wWin: t2Wins[0] },
          { name: t2Names[1], wMatch: t2w[1], wWin: t2Wins[1] },
        ];

        for (const p of players) {
          if (!p.name) continue;
          const t = ensure(p.name);
          t.effectiveMatches += p.wMatch;
          t.effectiveWins += p.wWin;
        }
      } else {
        // Fair mode: piecewise intra-team weighting
        const t1Weights = computeBonusWeightedDoublesWinRateWeights(m.team1, cfg);
        const t2Weights = computeBonusWeightedDoublesWinRateWeights(m.team2, cfg);

        // Use different distributions for wins vs losses:
        // - Wins: credit the player who gave away more points.
        // - Losses: blame the player who gave away fewer points.
        const [t1w1, t1w2] = t1IsWin
          ? t1Weights.winWeights
          : t1Weights.lossWeights;
        const [t2w1, t2w2] = t2IsWin
          ? t2Weights.winWeights
          : t2Weights.lossWeights;

        const t1EffectiveWins = t1IsWin ? [t1w1, t1w2] : [0, 0];
        const t2EffectiveWins = t2IsWin ? [t2w1, t2w2] : [0, 0];

        const t1Players: Array<[string | null, number, number]> = [
          [t1Names[0] ?? null, t1w1, t1EffectiveWins[0]],
          [t1Names[1] ?? null, t1w2, t1EffectiveWins[1]],
        ];
        const t2Players: Array<[string | null, number, number]> = [
          [t2Names[0] ?? null, t2w1, t2EffectiveWins[0]],
          [t2Names[1] ?? null, t2w2, t2EffectiveWins[1]],
        ];

        for (const [name, wMatch, wWin] of [...t1Players, ...t2Players]) {
          if (!name) continue;
          const t = ensure(name);
          t.effectiveMatches += wMatch;
          t.effectiveWins += wWin;
        }
      }

      continue;
    }

    for (const n of t1Names) {
      if (!n) continue;
      const t = ensure(n);
      t.effectiveMatches += 1;
      if (t1IsWin) t.effectiveWins += 1;
    }
    for (const n of t2Names) {
      if (!n) continue;
      const t = ensure(n);
      t.effectiveMatches += 1;
      if (t2IsWin) t.effectiveWins += 1;
    }
  }

  return totals;
}

export function computeWinRatePercent(
  totals: PlayerWinRateTotals,
  minMatches: number,
): number {
  if (totals.rawMatches < minMatches) return 0;
  if (totals.effectiveMatches <= 0) return 0;
  return Number(
    ((totals.effectiveWins / totals.effectiveMatches) * 100).toFixed(1),
  );
}

export function computeRawWinRatePercent(
  totals: PlayerWinRateTotals,
  minMatches: number,
): number {
  if (totals.rawMatches < minMatches) return 0;
  if (totals.rawMatches <= 0) return 0;
  return Number(((totals.rawWins / totals.rawMatches) * 100).toFixed(1));
}

type MutableTotals = Record<string, PlayerWinRateTotals>;

const ensureTotals = (
  totals: MutableTotals,
  name: string,
): PlayerWinRateTotals => {
  if (!totals[name]) {
    totals[name] = {
      rawMatches: 0,
      rawWins: 0,
      effectiveMatches: 0,
      effectiveWins: 0,
    };
  }
  return totals[name];
};

const applyMatchToTotals = (
  totals: MutableTotals,
  match: Match,
  cfg: BonusWeightedDoublesConfig,
) => {
  const winner = match.winner;
  const t1IsWin = winner === "team1";
  const t2IsWin = winner === "team2";
  const countOutcome = t1IsWin || t2IsWin;
  if (!countOutcome) return;

  const t1Names = match.team1.players.map(toName);
  const t2Names = match.team2.players.map(toName);

  for (const n of t1Names) {
    if (!n) continue;
    const t = ensureTotals(totals, n);
    t.rawMatches += 1;
    if (t1IsWin) t.rawWins += 1;
  }
  for (const n of t2Names) {
    if (!n) continue;
    const t = ensureTotals(totals, n);
    t.rawMatches += 1;
    if (t2IsWin) t.rawWins += 1;
  }

const useBonusWeighting = cfg.enabled && isDoublesMatch(match);

  if (useBonusWeighting) {
    if (cfg.strictMode) {
      // Strict mode: threshold-based penalty/boost (from Mode Comparison Page)
      const totalPoints = match.team1.score + match.team2.score;
      const threshold = Math.round(0.25 * totalPoints); // 25% threshold

      const g1 = match.team1.players.reduce(
        (sum, p) =>
          sum + (p?.bonusPoints && p.bonusPoints < 0 ? Math.abs(p.bonusPoints) : 0),
        0,
      );
      const g2 = match.team2.players.reduce(
        (sum, p) =>
          sum + (p?.bonusPoints && p.bonusPoints < 0 ? Math.abs(p.bonusPoints) : 0),
        0,
      );
      const diff = Math.abs(g1 - g2);

      let t1w: [number, number] = [1, 1];
      let t2w: [number, number] = [1, 1];

      if (diff > threshold) {
        if (g1 > g2) {
          // Team1 is "worse" (more giveaways), gets boost in strict mode
          t1w = t1IsWin ? [2, 2] : [0, 0];
          t2w = t2IsWin ? [0, 0] : [2, 2];
        } else {
          // Team2 is "worse"
          t2w = t2IsWin ? [2, 2] : [0, 0];
          t1w = t1IsWin ? [0, 0] : [2, 2];
        }
      }

      const t1Wins = t1IsWin ? t1w : [0, 0];
      const t2Wins = t2IsWin ? t2w : [0, 0];

      const players = [
        { name: t1Names[0], wMatch: t1w[0], wWin: t1Wins[0] },
        { name: t1Names[1], wMatch: t1w[1], wWin: t1Wins[1] },
        { name: t2Names[0], wMatch: t2w[0], wWin: t2Wins[0] },
        { name: t2Names[1], wMatch: t2w[1], wWin: t2Wins[1] },
      ];

      for (const p of players) {
        if (!p.name) continue;
        const t = ensureTotals(totals, p.name);
        t.effectiveMatches += p.wMatch;
        t.effectiveWins += p.wWin;
      }
    } else {
      // Fair mode: piecewise intra-team weighting
      const t1Weights = computeBonusWeightedDoublesWinRateWeights(
        match.team1,
        cfg,
      );
      const t2Weights = computeBonusWeightedDoublesWinRateWeights(
        match.team2,
        cfg,
      );

      const [t1w1, t1w2] = t1IsWin
        ? t1Weights.winWeights
        : t1Weights.lossWeights;
      const [t2w1, t2w2] = t2IsWin
        ? t2Weights.winWeights
        : t2Weights.lossWeights;

      const t1EffectiveWins = t1IsWin ? [t1w1, t1w2] : [0, 0];
      const t2EffectiveWins = t2IsWin ? [t2w1, t2w2] : [0, 0];

      const t1Players: Array<[string | null, number, number]> = [
        [t1Names[0] ?? null, t1w1, t1EffectiveWins[0]],
        [t1Names[1] ?? null, t1w2, t1EffectiveWins[1]],
      ];
      const t2Players: Array<[string | null, number, number]> = [
        [t2Names[0] ?? null, t2w1, t2EffectiveWins[0]],
        [t2Names[1] ?? null, t2w2, t2EffectiveWins[1]],
      ];

      for (const [name, wMatch, wWin] of [...t1Players, ...t2Players]) {
        if (!name) continue;
        const t = ensureTotals(totals, name);
        t.effectiveMatches += wMatch;
        t.effectiveWins += wWin;
      }
    }

    return;
  }

  for (const n of t1Names) {
    if (!n) continue;
    const t = ensureTotals(totals, n);
    t.effectiveMatches += 1;
    if (t1IsWin) t.effectiveWins += 1;
  }
  for (const n of t2Names) {
    if (!n) continue;
    const t = ensureTotals(totals, n);
    t.effectiveMatches += 1;
    if (t2IsWin) t.effectiveWins += 1;
  }
};

export function computeWinRateOverTime(
  matches: Match[],
  players: string[],
  options: ComputeWinRateTotalsOptions = {},
): Array<Record<string, number | string>> {
  const cfg: BonusWeightedDoublesConfig = {
    ...defaultBonusWeightedDoublesConfig,
    ...(options.bonusWeightedDoubles ?? {}),
  };

  const sorted = [...matches]
    .filter((m) => !!m?.createdAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const totals: MutableTotals = {};
  const points: Array<Record<string, number | string>> = [];

  let currentDate: string | null = null;
  for (const m of sorted) {
    const date = m.createdAt.split("T")[0] ?? "";
    if (!date) continue;

    if (currentDate !== date) {
      if (currentDate !== null) {
        const snapshot: Record<string, number | string> = { date: currentDate };
        for (const p of players) {
          const t = totals[p];
          snapshot[p] =
            t && t.effectiveMatches > 0
              ? Number(
                  ((t.effectiveWins / t.effectiveMatches) * 100).toFixed(1),
                )
              : 0;
        }
        points.push(snapshot);
      }
      currentDate = date;
    }

    applyMatchToTotals(totals, m, cfg);
  }

  if (currentDate !== null) {
    const snapshot: Record<string, number | string> = { date: currentDate };
    for (const p of players) {
      const t = totals[p];
      snapshot[p] =
        t && t.effectiveMatches > 0
          ? Number(((t.effectiveWins / t.effectiveMatches) * 100).toFixed(1))
          : 0;
    }
    points.push(snapshot);
  }

  return points;
}