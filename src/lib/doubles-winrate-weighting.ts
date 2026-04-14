import type { Player, Team } from "@/types/match";

export type DoublesWinRateWeightPoint = {
  /**
   * The larger "giveaway share" for a doubles team.
   *
   * Example: if players give away 14 and 7 points, shares are 66.6% and 33.3%,
   * so `maxShare` is ~0.666.
   */
  maxShare: number;

  /**
   * The adjusted (more opinionated) larger share used for win-rate impact.
   * This is where you encode rules like:
   * - 60/40 => 50/50
   * - 70/30 => 65/35
   * - 80/20 => 90/10
   * - 90/10 => 100/0
   */
  adjustedMaxShare: number;
};

export type BonusWeightedDoublesConfig = {
  enabled: boolean;
  strictMode: boolean;

  /**
   * Piecewise mapping of `maxShare -> adjustedMaxShare`.
   *
   * Requirements:
   * - Sorted by `maxShare` ascending
   * - Values are expected in the range [0.5, 1]
   * - Should include a point at 0.5 and a point at 1
   */
  points: DoublesWinRateWeightPoint[];
};

export const defaultBonusWeightedDoublesConfig: BonusWeightedDoublesConfig = {
  enabled: true,
  strictMode: false,
  points: [
    // "Normal" play zone: treat up to 60/40 as equal responsibility.
    { maxShare: 0.5, adjustedMaxShare: 0.5 },
    { maxShare: 0.6, adjustedMaxShare: 0.5 },

    // Moderate imbalance.
    { maxShare: 0.7, adjustedMaxShare: 0.65 },

    // Strong imbalance.
    { maxShare: 0.8, adjustedMaxShare: 0.9 },

    // Extreme: one player gave away almost everything.
    { maxShare: 0.9, adjustedMaxShare: 1 },
    { maxShare: 1, adjustedMaxShare: 1 },
  ],
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const negativeGiveaway = (player: Player | undefined): number => {
  const v = player?.bonusPoints ?? 0;
  return v < 0 ? Math.abs(v) : 0;
};

const sortPoints = (points: DoublesWinRateWeightPoint[]) =>
  [...points].sort((a, b) => a.maxShare - b.maxShare);

const isValidPoint = (p: DoublesWinRateWeightPoint) =>
  Number.isFinite(p.maxShare) && Number.isFinite(p.adjustedMaxShare);

const adjustedMaxShareFromPoints = (
  maxShare: number,
  points: DoublesWinRateWeightPoint[],
): number => {
  const clampedMaxShare = clamp(maxShare, 0.5, 1);

  const usablePoints = sortPoints(points).filter(isValidPoint);
  if (usablePoints.length < 2) return clampedMaxShare;

  // Ensure we can interpolate even if someone deletes endpoints.
  const first = usablePoints[0];
  const last = usablePoints[usablePoints.length - 1];
  if (clampedMaxShare <= first.maxShare) {
    return clamp(first.adjustedMaxShare, 0.5, 1);
  }
  if (clampedMaxShare >= last.maxShare) {
    return clamp(last.adjustedMaxShare, 0.5, 1);
  }

  for (let i = 0; i < usablePoints.length - 1; i++) {
    const a = usablePoints[i];
    const b = usablePoints[i + 1];

    if (clampedMaxShare > b.maxShare) continue;

    const span = b.maxShare - a.maxShare;
    if (span <= 0) return clamp(b.adjustedMaxShare, 0.5, 1);

    const t = (clampedMaxShare - a.maxShare) / span;
    const adjusted =
      a.adjustedMaxShare + t * (b.adjustedMaxShare - a.adjustedMaxShare);
    return clamp(adjusted, 0.5, 1);
  }

  return clampedMaxShare;
};

export type TeamDoublesWinRateWeights = {
  /**
   * Weights sum to 2 for doubles (so the match counts as "one match" per team).
   *
   * On a win, each player gets `effectiveWins += weight` and `effectiveMatches += weight`.
   * On a loss, each player gets `effectiveMatches += weight` and `effectiveWins += 0`.
   *
   * NOTE: This is the "loss/blame" weighting. For wins, prefer `winWeights`.
   */
  playerWeights: [number, number];

  /**
   * Weights used when the team WON.
   *
   * These are aligned to the adjusted giveaway shares, so the player who
   * gave away more points gets more credit.
   */
  winWeights: [number, number];

  /**
   * Weights used when the team LOST.
   *
   * These are the inverse of the adjusted giveaway shares, so the player who
   * gave away more points takes less blame.
   */
  lossWeights: [number, number];

  /** Raw giveaway shares (based only on negative bonus points). */
  giveawayShares: [number, number];

  /** Adjusted giveaway shares after applying the piecewise mapping. */
  adjustedShares: [number, number];

  /** Adjusted CREDIT shares (inverse of adjustedShares). */
  adjustedCreditShares: [number, number];
};

/**
 * Computes how much a doubles match should "count" for each player when
 * calculating win-rate, based on each player's negative bonus points.
 */
export function computeBonusWeightedDoublesWinRateWeights(
  team: Team,
  config: BonusWeightedDoublesConfig = defaultBonusWeightedDoublesConfig,
): TeamDoublesWinRateWeights {
  const p1 = team.players[0];
  const p2 = team.players[1];

  const g1 = negativeGiveaway(p1);
  const g2 = negativeGiveaway(p2);
  const total = g1 + g2;

  if (!config.enabled || total <= 0) {
    return {
      playerWeights: [1, 1],
      winWeights: [1, 1],
      lossWeights: [1, 1],
      giveawayShares: [0.5, 0.5],
      adjustedShares: [0.5, 0.5],
      adjustedCreditShares: [0.5, 0.5],
    };
  }

  const share1 = g1 / total;
  const share2 = g2 / total;

  const p1IsHigher = share1 >= share2;
  const maxShare = p1IsHigher ? share1 : share2;
  const adjustedMaxShare = adjustedMaxShareFromPoints(maxShare, config.points);

  const adjustedHigh = adjustedMaxShare;
  const adjustedLow = 1 - adjustedMaxShare;

  const adjustedShares: [number, number] = p1IsHigher
    ? [adjustedHigh, adjustedLow]
    : [adjustedLow, adjustedHigh];

  // Loss (blame) weights and win (credit) weights depend on strictMode
  const adjustedCreditShares: [number, number] = [
    clamp(1 - adjustedShares[0], 0, 1),
    clamp(1 - adjustedShares[1], 0, 1),
  ];
  let lossWeights: [number, number];
  let winWeights: [number, number];

  if (config.strictMode) {
    // Strict mode: more negative bonus points get boost
    lossWeights = [
      adjustedCreditShares[0] * 2,
      adjustedCreditShares[1] * 2,
    ];
    winWeights = [adjustedShares[0] * 2, adjustedShares[1] * 2];
  } else {
    // Fair mode: more negative bonus points get penalty
    lossWeights = [adjustedShares[0] * 2, adjustedShares[1] * 2];
    winWeights = [
      adjustedCreditShares[0] * 2,
      adjustedCreditShares[1] * 2,
    ];
  }

  // Back-compat: `playerWeights` historically meant the per-player match weight.
  // Keep it as the "loss" weighting since that is where the penalty is applied.
  const playerWeights: [number, number] = lossWeights;

  return {
    playerWeights,
    winWeights,
    lossWeights,
    giveawayShares: [share1, share2],
    adjustedShares,
    adjustedCreditShares,
  };
}