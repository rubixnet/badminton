import { useMemo } from "react";

import type { Match } from "@/types/match";
import {
  computePlayerWinRateTotals,
  computeRawWinRatePercent,
  computeWinRateOverTime,
  computeWinRatePercent,
} from "@/lib/win-rate";

export type DateRangeOption =
  | "today"
  | "yesterday"
  | "7d"
  | "15d"
  | "this-month"
  | "last-month"
  | "30d"
  | "60d"
  | "365d"
  | "all"
  | "custom";

/**
 * Every number the analytics page renders.
 *
 * The whole derivation is a pure function of (matches, range, strictMode), so
 * it lives in its own module instead of inline in the page body. The page then
 * reads as "render these cards" rather than a 600-line calculation the reader
 * has to scroll past before reaching any markup.
 */
export function useAnalyticsStats({
  matches,
  timePeriod,
  strictMode,
  customDateRange,
}: {
  matches: Match[];
  timePeriod: DateRangeOption;
  strictMode: boolean;
  customDateRange: { from?: Date; to?: Date };
}) {
  return useMemo(() => {
  if (!matches.length) return null;

  // 1. Filter by Time Period
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Get start and end dates for the current period
  const getDateRange = (
    period: DateRangeOption,
  ): { start: Date | null; end: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (period === "custom") {
      if (customDateRange.from && customDateRange.to) {
        const start = new Date(customDateRange.from);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customDateRange.to);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      return { start: null, end };
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (period === "today") {
      return { start, end };
    }
    if (period === "yesterday") {
      start.setDate(start.getDate() - 1);
      const yesterdayEnd = new Date(start);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { start, end: yesterdayEnd };
    }
    if (period === "7d") {
      start.setDate(start.getDate() - 7);
      return { start, end };
    }
    if (period === "15d") {
      start.setDate(start.getDate() - 15);
      return { start, end };
    }
    if (period === "this-month") {
      start.setDate(1);
      return { start, end };
    }
    if (period === "last-month") {
      start.setDate(1);
      start.setMonth(start.getMonth() - 1);
      end.setMonth(end.getMonth() - 1);
      end.setDate(0); // Last day of previous month
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (period === "30d") {
      start.setDate(start.getDate() - 30);
      return { start, end };
    }
    if (period === "60d") {
      start.setDate(start.getDate() - 60);
      return { start, end };
    }
    if (period === "365d") {
      start.setDate(start.getDate() - 365);
      return { start, end };
    }
    // "all"
    return { start: null, end };
  };

  // Calculate period days for comparison
  const getPeriodDays = (period: DateRangeOption): number => {
    if (period === "today") return 1;
    if (period === "yesterday") return 1;
    if (period === "7d") return 7;
    if (period === "15d") return 15;
    if (period === "this-month" || period === "last-month") return 30;
    if (period === "30d") return 30;
    if (period === "60d") return 60;
    if (period === "365d") return 365;
    if (period === "custom" && customDateRange.from && customDateRange.to) {
      const diffTime =
        customDateRange.to.getTime() - customDateRange.from.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0; // 'all' has no comparison
  };

  const periodDays = getPeriodDays(timePeriod);
  const dateRange = getDateRange(timePeriod);

  const filteredMatches = matches.filter((m) => {
    if (!dateRange.start) return true; // "all" time
    const matchDate = new Date(m.createdAt);
    return matchDate >= dateRange.start && matchDate <= dateRange.end;
  });

  // Previous period matches for comparison
  const previousPeriodMatches =
    timePeriod !== "all" && dateRange.start
      ? matches.filter((m) => {
        const matchDate = new Date(m.createdAt);
        const periodLength = periodDays * 24 * 60 * 60 * 1000;
        const prevStart = new Date(dateRange.start!.getTime() - periodLength);
        const prevEnd = new Date(dateRange.start!.getTime() - 1);
        return matchDate >= prevStart && matchDate <= prevEnd;
      })
      : [];

  // 2. Helper to calculate stats for a subset
  const calculateSubsetStats = (
    subset: Match[],
    previousSubset: Match[] = [],
    strictMode: boolean = false,
  ) => {
    const playerStats: Record<
      string,
      {
        wins: number;
        losses: number;
        points: number;
        matches: number;
        bonusPoints: number;
      }
    > = {};

    const currentWinRateTotals = computePlayerWinRateTotals(subset, {
      bonusWeightedDoubles: { strictMode },
    });
    const previousWinRateTotals = computePlayerWinRateTotals(previousSubset, {
      bonusWeightedDoubles: { strictMode },
    });

    const update = (
      name: string,
      isWinner: boolean,
      points: number,
      bonus: number,
    ) => {
      if (!name) return;
      const n = name.trim();
      if (!playerStats[n])
        playerStats[n] = {
          wins: 0,
          losses: 0,
          points: 0,
          matches: 0,
          bonusPoints: 0,
        };
      playerStats[n].matches++;
      playerStats[n].points += points;
      playerStats[n].bonusPoints += bonus;
      if (isWinner) playerStats[n].wins++;
      else playerStats[n].losses++;
    };

    subset.forEach((m) => {
      const isT1 = m.winner === "team1";
      const isT2 = m.winner === "team2";
      const processed = new Set<string>();

      m.team1.players.forEach((p) => {
        if (!p.name) return;
        const n = p.name.trim();
        if (processed.has(n)) return;
        processed.add(n);
        update(
          n,
          isT1,
          m.team1.score + (p.bonusPoints || 0),
          p.bonusPoints || 0,
        );
      });

      m.team2.players.forEach((p) => {
        if (!p.name) return;
        const n = p.name.trim();
        if (processed.has(n)) return;
        processed.add(n);
        update(
          n,
          isT2,
          m.team2.score + (p.bonusPoints || 0),
          p.bonusPoints || 0,
        );
      });
    });

    const players = Object.keys(playerStats);

    const winRates = players
      .map((name) => {
        const s = playerStats[name];
        const currentTotals = currentWinRateTotals[name];
        const currentWinRate = currentTotals
          ? computeWinRatePercent(currentTotals, 3)
          : 0;
        const rawWinRate = currentTotals
          ? computeRawWinRatePercent(currentTotals, 3)
          : 0;
        const playImpact = parseFloat(
          (currentWinRate - rawWinRate).toFixed(1),
        );

        const prevTotals = previousWinRateTotals[name];
        let prevWinRate = 0;
        let change = 0;
        if (prevTotals && prevTotals.rawMatches >= 1) {
          prevWinRate = computeWinRatePercent(prevTotals, 1);
          if (s.matches >= 3) {
            change = parseFloat((currentWinRate - prevWinRate).toFixed(1));
          }
        }

        return {
          name,
          value: currentWinRate,
          wins: s.wins,
          matches: s.matches,
          losses: s.losses,
          rawWinRate,
          playImpact,
          prevWinRate,
          prevMatches: prevTotals?.rawMatches || 0,
          change,
        };
      })
      .filter((p) => p.matches >= 3)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

      const avgPoints = players
      .map((name) => {
        const s = playerStats[name];
        return {
          name,
          value:
            s.matches >= 3
              ? parseFloat((s.points / s.matches).toFixed(1))
              : 0,
          matches: s.matches,
          totalPoints: s.points,
        };
      })
      .filter((p) => p.matches >= 3)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const mostWins = players
      .map((name) => ({
        name,
        value: playerStats[name].wins,
        matches: playerStats[name].matches,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const mostPoints = players
      .map((name) => ({
        name,
        value: playerStats[name].points,
        matches: playerStats[name].matches,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const dailyBonusPoints: any[] = [];
    const dateMap: Record<string, Record<string, number>> = {};
    subset.forEach((m) => {
      const date = m.createdAt.split("T")[0];
      m.team1.players.forEach((p) => {
        if (p.name && p.bonusPoints && p.bonusPoints !== 0) {
          if (!dateMap[date]) dateMap[date] = {};
          const n = p.name.trim();
          dateMap[date][n] = (dateMap[date][n] || 0) + p.bonusPoints;
        }
      });
      m.team2.players.forEach((p) => {
        if (p.name && p.bonusPoints && p.bonusPoints !== 0) {
          if (!dateMap[date]) dateMap[date] = {};
          const n = p.name.trim();
          dateMap[date][n] = (dateMap[date][n] || 0) + p.bonusPoints;
        }
      });
    });
    Object.entries(dateMap).forEach(([date, players]) => {
      const entry: any = { date };
      Object.assign(entry, players);
      dailyBonusPoints.push(entry);
    });
    dailyBonusPoints.sort((a, b) => a.date.localeCompare(b.date));

    const bonusPlayersSet = new Set<string>();
    Object.values(dateMap).forEach((day) =>
      Object.keys(day).forEach((p) => bonusPlayersSet.add(p)),
    );
    const bonusPlayers = Array.from(bonusPlayersSet).sort(
      (a, b) =>
        Math.abs(playerStats[b].bonusPoints) -
        Math.abs(playerStats[a].bonusPoints),
    );

    const top5 = mostWins.slice(0, 5).map((p) => p.name);

    const winRateOverTime = computeWinRateOverTime(subset, top5);

    const impactOverTime: Array<{ date: string;[key: string]: any }> = [];
    const impactByDate: Record<string, Record<string, { impact: number; count: number }>> = {};

    const sortedMatches = [...subset].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const playerMatchHistory: Record<string, Match[]> = {};

    sortedMatches.forEach((match) => {
      const date = match.createdAt.split("T")[0];

      [...match.team1.players, ...match.team2.players].forEach((p) => {
        if (!p.name) return;
        const name = p.name.trim();
        if (!playerMatchHistory[name]) playerMatchHistory[name] = [];
        playerMatchHistory[name].push(match);

        const totals = computePlayerWinRateTotals(playerMatchHistory[name]);
        if (totals[name] && totals[name].rawMatches >= 3) {
          const winRate = computeWinRatePercent(totals[name], 3);
          const rawWinRate = computeRawWinRatePercent(totals[name], 3);
          const impact = parseFloat((winRate - rawWinRate).toFixed(1));

          if (!impactByDate[date]) impactByDate[date] = {};
          if (!impactByDate[date][name]) {
            impactByDate[date][name] = { impact: 0, count: 0 };
          }
          impactByDate[date][name].impact = impact;
          impactByDate[date][name].count++;
        }
      });
    });

    Object.entries(impactByDate).forEach(([date, players]) => {
      const entry: any = { date };
      Object.entries(players).forEach(([name, data]) => {
        entry[name] = data.impact;
      });
      impactOverTime.push(entry);
    });
    impactOverTime.sort((a, b) => a.date.localeCompare(b.date));

    const impactPlayersSet = new Set<string>();
    Object.values(impactByDate).forEach((day) =>
      Object.keys(day).forEach((p) => impactPlayersSet.add(p)),
    );
    const impactPlayers = Array.from(impactPlayersSet).sort(
      (a, b) => {
        const aLastImpact = winRates.find((wr) => wr.name === a)?.playImpact || 0;
        const bLastImpact = winRates.find((wr) => wr.name === b)?.playImpact || 0;
        return Math.abs(bLastImpact) - Math.abs(aLastImpact);
      },
    );

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const activityByDay = daysOfWeek.map((day) => ({ day, matches: 0 }));
    subset.forEach((m) => {
      const d = new Date(m.createdAt);
      activityByDay[d.getDay()].matches++;
    });

    const matchesByDate: Record<string, number> = {};
    subset.forEach((m) => {
      const date = m.createdAt.split("T")[0];
      matchesByDate[date] = (matchesByDate[date] || 0) + 1;
    });

    return {
      winRates,
      avgPoints,
      mostWins,
      mostPoints,
      dailyBonusPoints,
      bonusPlayers,
      winRateOverTime,
      impactOverTime,
      impactPlayers,
      activityByDay,
      matchesByDate: Object.entries(matchesByDate).map(([date, count]) => ({
        date,
        count,
      })),
      totalMatches: subset.length,
      topPlayers: top5,
    };
  };

  const singlesMatches = filteredMatches.filter(
    (m) => m.team1.players.length + m.team2.players.length <= 3,
  );
  const doublesMatches = filteredMatches.filter(
    (m) => m.team1.players.length + m.team2.players.length === 4,
  );

  const prevSinglesMatches = previousPeriodMatches.filter(
    (m) => m.team1.players.length + m.team2.players.length <= 3,
  );
  const prevDoublesMatches = previousPeriodMatches.filter(
    (m) => m.team1.players.length + m.team2.players.length === 4,
  );

  const calculateDuoStats = (subset: Match[]) => {
    const duoStats: Record<
      string,
      {
        wins: number;
        losses: number;
        points: number;
        matches: number;
        player1: string;
        player2: string;
      }
    > = {};

    const getDuoKey = (p1: string, p2: string) => {
      const sorted = [p1.trim(), p2.trim()].sort();
      return `${sorted[0]} & ${sorted[1]}`;
    };

    const getShortDuoKey = (p1: string, p2: string) => {
      const sorted = [
        p1.trim()[0]?.toUpperCase() || "",
        p2.trim()[0]?.toUpperCase() || "",
      ].sort();
      return `${sorted[0]}${sorted[1]}`;
    };

    subset.forEach((m) => {
      if (m.team1.players.length === 2 && m.team2.players.length === 2) {
        const t1p1 = m.team1.players[0]?.name || "";
        const t1p2 = m.team1.players[1]?.name || "";
        const t2p1 = m.team2.players[0]?.name || "";
        const t2p2 = m.team2.players[1]?.name || "";

        if (t1p1 && t1p2) {
          const key = getDuoKey(t1p1, t1p2);
          if (!duoStats[key]) {
            const [player1, player2] = [t1p1.trim(), t1p2.trim()].sort();
            duoStats[key] = {
              wins: 0,
              losses: 0,
              points: 0,
              matches: 0,
              player1,
              player2,
            };
          }
          duoStats[key].matches++;
          duoStats[key].points += m.team1.score;
          if (m.winner === "team1") duoStats[key].wins++;
          else if (m.winner === "team2") duoStats[key].losses++;
        }

        if (t2p1 && t2p2) {
          const key = getDuoKey(t2p1, t2p2);
          if (!duoStats[key]) {
            const [player1, player2] = [t2p1.trim(), t2p2.trim()].sort();
            duoStats[key] = {
              wins: 0,
              losses: 0,
              points: 0,
              matches: 0,
              player1,
              player2,
            };
          }
          duoStats[key].matches++;
          duoStats[key].points += m.team2.score;
          if (m.winner === "team2") duoStats[key].wins++;
          else if (m.winner === "team1") duoStats[key].losses++;
        }
      }
    });

    const duos = Object.keys(duoStats);

    const duoWinRates = duos
      .map((key) => {
        const s = duoStats[key];
        const shortKey = getShortDuoKey(s.player1, s.player2);
        return {
          name: key,
          shortName: shortKey,
          value:
            s.matches >= 2
              ? parseFloat(((s.wins / s.matches) * 100).toFixed(1))
              : 0,
          wins: s.wins,
          matches: s.matches,
          losses: s.losses,
          player1: s.player1,
          player2: s.player2,
        };
      })
      .filter((d) => d.matches >= 2)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const duoAvgPoints = duos
      .map((key) => {
        const s = duoStats[key];
        const shortKey = getShortDuoKey(s.player1, s.player2);
        return {
          name: key,
          shortName: shortKey,
          value:
            s.matches >= 2
              ? parseFloat((s.points / s.matches).toFixed(1))
              : 0,
          matches: s.matches,
          totalPoints: s.points,
          player1: s.player1,
          player2: s.player2,
        };
      })
      .filter((d) => d.matches >= 2)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const duoMostWins = duos
      .map((key) => {
        const s = duoStats[key];
        const shortKey = getShortDuoKey(s.player1, s.player2);
        return {
          name: key,
          shortName: shortKey,
          value: s.wins,
          matches: s.matches,
          player1: s.player1,
          player2: s.player2,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const duoMostPoints = duos
      .map((key) => {
        const s = duoStats[key];
        const shortKey = getShortDuoKey(s.player1, s.player2);
        return {
          name: key,
          shortName: shortKey,
          value: s.points,
          matches: s.matches,
          player1: s.player1,
          player2: s.player2,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const duoMostMatches = duos
      .map((key) => {
        const s = duoStats[key];
        const shortKey = getShortDuoKey(s.player1, s.player2);
        return {
          name: key,
          shortName: shortKey,
          value: s.matches,
          wins: s.wins,
          player1: s.player1,
          player2: s.player2,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const topDuo = duoMostWins[0] || null;

    return {
      duoWinRates,
      duoAvgPoints,
      duoMostWins,
      duoMostPoints,
      duoMostMatches,
      topDuo,
      totalDuos: duos.length,
    };
  };

  const duoData = calculateDuoStats(doublesMatches);

  const todayMatches = matches.filter((m) =>
    m.createdAt.startsWith(todayStr),
  );
  const dailyStats: Record<string, number> = {};
  todayMatches.forEach((m) => {
    if (m.winner === "team1")
      m.team1.players.forEach(
        (p) => (dailyStats[p.name] = (dailyStats[p.name] || 0) + 1),
      );
    if (m.winner === "team2")
      m.team2.players.forEach(
        (p) => (dailyStats[p.name] = (dailyStats[p.name] || 0) + 1),
      );
  });
  let playerOfTheDay = null;
  let maxDailyWins = 0;
  Object.entries(dailyStats).forEach(([name, wins]) => {
    if (wins > maxDailyWins) {
      maxDailyWins = wins;
      playerOfTheDay = name;
    }
  });

  return {
    singles: calculateSubsetStats(singlesMatches, prevSinglesMatches, strictMode),
    doubles: calculateSubsetStats(doublesMatches, prevDoublesMatches, strictMode),
    duos: duoData,
    playerOfTheDay,
    totalMatches: matches.length, 
    totalSinglesAllTime: matches.filter(
      (m) => m.team1.players.length + m.team2.players.length <= 3,
    ).length,
    totalDoublesAllTime: matches.filter(
      (m) => m.team1.players.length + m.team2.players.length === 4,
    ).length,
  };
  }, [matches, timePeriod, strictMode, customDateRange]);
}
