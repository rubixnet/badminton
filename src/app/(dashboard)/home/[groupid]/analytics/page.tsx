"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  Medal,
  Filter,
  ChevronDown,
  Target,
  Users,
  User,
  Calculator,
  Handshake,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarIcon,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { PlayerOfTheDay } from "@/components/player-of-the-day";
import { useColorMode } from "@/components/color-mode-provider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { MatchCalendar } from "@/components/match-calendar";
import type { Match } from "@/types/match";
import { cn } from "@/lib/utils";
import {
  computePlayerWinRateTotals,
  computeWinRateOverTime,
  computeWinRatePercent,
  computeRawWinRatePercent,
} from "@/lib/win-rate";

type DateRangeOption =
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

export default function AnalyticsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [strictMode, setStrictMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupid as string;

  const [timePeriod, setTimePeriod] = useState<DateRangeOption>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`badminton_analytics_timeperiod_${groupId}`);
      if (saved) return saved as DateRangeOption;
    }
    return "30d";
  });

  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`badminton_analytics_customdates_${groupId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            from: parsed.from ? new Date(parsed.from) : undefined,
            to: parsed.to ? new Date(parsed.to) : undefined,
          };
        } catch(e) {
          return {};
        }
      }
    }
    return {};
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { getPlayerColor } = useColorMode();

  // Helper to navigate to player profile
  const goToPlayer = (name: string) => {
    router.push(`/home/${groupId}/analytics/player/${encodeURIComponent(name)}`);
  };

  // Get all unique player names
  const allPlayers = useMemo(() => {
    const players = new Set<string>();
    matches.forEach((m) => {
      m.team1.players.forEach((p) => p.name && players.add(p.name.trim()));
      m.team2.players.forEach((p) => p.name && players.add(p.name.trim()));
    });
    return Array.from(players).sort();
  }, [matches]);

  // Persist timePeriod to localStorage
  useEffect(() => {
    if (groupId) {
      localStorage.setItem(`badminton_analytics_timeperiod_${groupId}`, timePeriod);
    }
  }, [timePeriod, groupId]);

  // Persist customDateRange to localStorage
  useEffect(() => {
    if (groupId && (customDateRange.from || customDateRange.to)) {
      localStorage.setItem(
        `badminton_analytics_customdates_${groupId}`,
        JSON.stringify({
          from: customDateRange.from?.toISOString(),
          to: customDateRange.to?.toISOString(),
        }),
      );
    }
  }, [customDateRange, groupId]);

  useEffect(() => {
    if (!groupId) return;

    const fetchStats = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const res = await fetch(`/api/analytics?groupId=${groupId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.matches) {
            setMatches(data.matches);
            setStrictMode(data.strictMode || false);
            localStorage.setItem(
              `badminton_analytics_matches_${groupId}`,
              JSON.stringify({ matches: data.matches, strictMode: data.strictMode }),
            );
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    const init = async () => {
      const stored = localStorage.getItem(`badminton_analytics_matches_${groupId}`);
      let loadedFromCache = false;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.matches) {
            setMatches(parsed.matches);
            setStrictMode(parsed.strictMode || false);
            setLoading(false);
            loadedFromCache = true;
          }
        } catch (e) {
          console.error(e);
        }
      }
      fetchStats(loadedFromCache);
    };
    init();
  }, [groupId]);

  const stats = useMemo(() => {
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

      // Transform to arrays
      const players = Object.keys(playerStats);

      // Win Rates (Min 3 matches) with change from previous period
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

          // Calculate previous period win rate
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

      // Average Points (Min 3 matches)
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

      // Most Wins
      const mostWins = players
        .map((name) => ({
          name,
          value: playerStats[name].wins,
          matches: playerStats[name].matches,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Most Points (Total)
      const mostPoints = players
        .map((name) => ({
          name,
          value: playerStats[name].points,
          matches: playerStats[name].matches,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Daily Bonus Points
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

      // Bonus Players for chart config
      const bonusPlayersSet = new Set<string>();
      Object.values(dateMap).forEach((day) =>
        Object.keys(day).forEach((p) => bonusPlayersSet.add(p)),
      );
      const bonusPlayers = Array.from(bonusPlayersSet).sort(
        (a, b) =>
          Math.abs(playerStats[b].bonusPoints) -
          Math.abs(playerStats[a].bonusPoints),
      );

      // Points Progression
      // Get top 5 players by Wins (to show most relevant players)
      const top5 = mostWins.slice(0, 5).map((p) => p.name);

      const winRateOverTime = computeWinRateOverTime(subset, top5);

      // Impact over time - Calculate daily impact for top players
      const impactOverTime: Array<{ date: string; [key: string]: any }> = [];
      const impactByDate: Record<string, Record<string, { impact: number; count: number }>> = {};
      
      // Group matches by date and calculate cumulative impact for each player
      const sortedMatches = [...subset].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const playerMatchHistory: Record<string, Match[]> = {};
      
      sortedMatches.forEach((match) => {
        const date = match.createdAt.split("T")[0];
        
        // Track match history for each player
        [...match.team1.players, ...match.team2.players].forEach((p) => {
          if (!p.name) return;
          const name = p.name.trim();
          if (!playerMatchHistory[name]) playerMatchHistory[name] = [];
          playerMatchHistory[name].push(match);
          
          // Calculate impact at this point
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
      
      // Convert to chart data format
      Object.entries(impactByDate).forEach(([date, players]) => {
        const entry: any = { date };
        Object.entries(players).forEach(([name, data]) => {
          entry[name] = data.impact;
        });
        impactOverTime.push(entry);
      });
      impactOverTime.sort((a, b) => a.date.localeCompare(b.date));
      
      // Get players who have impact data
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

      // Activity by Day
      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const activityByDay = daysOfWeek.map((day) => ({ day, matches: 0 }));
      subset.forEach((m) => {
        const d = new Date(m.createdAt);
        activityByDay[d.getDay()].matches++;
      });

      // Matches by Date for calendar
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

    // 3. Classify
    const singlesMatches = filteredMatches.filter(
      (m) => m.team1.players.length + m.team2.players.length <= 3,
    );
    const doublesMatches = filteredMatches.filter(
      (m) => m.team1.players.length + m.team2.players.length === 4,
    );

    // Previous period subsets
    const prevSinglesMatches = previousPeriodMatches.filter(
      (m) => m.team1.players.length + m.team2.players.length <= 3,
    );
    const prevDoublesMatches = previousPeriodMatches.filter(
      (m) => m.team1.players.length + m.team2.players.length === 4,
    );

    // 5. Duo Stats (partnerships)
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
        // Only process doubles matches (2 players per team)
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

      // Win Rates (Min 2 matches for duos)
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

      // Average Points (Min 2 matches)
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

      // Most Wins
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

      // Most Points
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

      // Most matches played together
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

      // Top duo (by wins)
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

    // 4. Player of the Day
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
      totalMatches: matches.length, // Total all time
      totalSinglesAllTime: matches.filter(
        (m) => m.team1.players.length + m.team2.players.length <= 3,
      ).length,
      totalDoublesAllTime: matches.filter(
        (m) => m.team1.players.length + m.team2.players.length === 4,
      ).length,
    };
  }, [matches, timePeriod, strictMode, customDateRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background overflow-x-auto">
        <Navbar title="Analytics" />
        <div className="max-w-6xl mx-auto p-2 md:p-6 pt-0 md:pt-2 space-y-4">
          {/* Player of the Day Skeleton */}
          <Card className="bg-linear-to-r from-primary/10 via-background to-background border-primary/20 cursor-pointer hover:border-primary/50 transition-all group mt-6">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full bg-primary/10" />
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-9 w-20" />
            </CardContent>
          </Card>

          {/* Controls Skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
            <Skeleton className="h-10 w-full md:w-[400px]" />
            <Skeleton className="h-10 w-full md:w-[200px]" />
          </div>

          {/* Content Skeleton */}
          <div className="space-y-8">
            {/* Top Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border">
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
              <Card className="border">
                <CardHeader>
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats)
    return <div className="p-8 text-center">No analytics data available</div>;

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const renderContent = (
    data: any,
    title: string,
    totalAllTime: number,
    getPlayerColor: (index: number, isDarkMode: boolean) => string,
  ) => {
    if (!data || data.totalMatches === 0)
      return (
        <div className="py-12 text-center text-muted-foreground">
          No {title.toLowerCase()} matches found in this period.
        </div>
      );

    const chartConfig: any = { points: { label: "Points" } };
    data.topPlayers.forEach((p: string, i: number) => {
      chartConfig[p] = { label: p, color: getPlayerColor(i, isDark) };
    });

    return (
      <div className="space-y-4  animate-in fade-in duration-500">
        {/* Top Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Matches Played
              </CardTitle>
              <Medal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.totalMatches}
                {timePeriod !== "all" && (
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / {totalAllTime}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {timePeriod === "all"
                  ? `Total ${title.toLowerCase()} matches`
                  : `${title} in selected period`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Best Win Rate
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.winRates[0]?.value || 0}%
              </div>
              <p
                className="text-xs text-muted-foreground hover:text-primary cursor-pointer hover:underline"
                onClick={() =>
                  data.winRates[0]?.name && goToPlayer(data.winRates[0].name)
                }
              >
                {data.winRates[0]?.name || "-"} ({data.winRates[0]?.wins || 0}/
                {data.winRates[0]?.matches || 0} won)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Highest Avg Pts
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.avgPoints[0]?.value || 0}
              </div>
              <p
                className="text-xs text-muted-foreground hover:text-primary cursor-pointer hover:underline"
                onClick={() =>
                  data.avgPoints[0]?.name && goToPlayer(data.avgPoints[0].name)
                }
              >
                {data.avgPoints[0]?.name || "-"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Wins</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.mostWins[0]?.value || 0}
              </div>
              <p
                className="text-xs text-muted-foreground hover:text-primary cursor-pointer hover:underline"
                onClick={() =>
                  data.mostWins[0]?.name && goToPlayer(data.mostWins[0].name)
                }
              >
                {data.mostWins[0]?.name || "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 1: Win Rates & Average Points */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Win Rates</CardTitle>
              <CardDescription>
                Win percentage (min 3 matches) • vs previous period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Win %", color: "hsl(var(--primary))" },
                }}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <BarChart
                  data={data.winRates}
                  layout="vertical"
                  margin={{ left: 0, right: 70 }}
                >
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    className="text-xs font-medium"
                  />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      const playImpact = Number(d.playImpact ?? 0);
                      const impactArrow =
                        playImpact > 0 ? "↑" : playImpact < 0 ? "↓" : "→";
                      const impactColor =
                        playImpact > 0
                          ? "text-green-500"
                          : playImpact < 0
                            ? "text-red-500"
                            : "text-muted-foreground";
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                          <p
                            className="font-semibold hover:text-primary cursor-pointer hover:underline"
                            onClick={() => goToPlayer(d.name)}
                          >
                            {d.name} →
                          </p>
                          <p className="text-muted-foreground">
                            Win Rate:{" "}
                            <span className="text-foreground font-medium">
                              {d.value}%
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Play impact:{" "}
                            <span className={`font-medium ${impactColor}`}>
                              {impactArrow} {playImpact > 0 ? "+" : ""}
                              {playImpact}%
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Matches:{" "}
                            <span className="text-foreground font-medium">
                              {d.wins}/{d.matches}
                            </span>{" "}
                            won
                          </p>
                          {d.prevMatches > 0 && (
                            <>
                              <div className="border-t my-1.5" />
                              <p className="text-muted-foreground text-xs">
                                Previous period:{" "}
                                <span className="text-foreground font-medium">
                                  {d.prevWinRate}%
                                </span>{" "}
                                ({d.prevMatches} matches)
                              </p>
                              <p
                                className={`text-xs font-medium ${d.change > 0 ? "text-green-500" : d.change < 0 ? "text-red-500" : "text-muted-foreground"}`}
                              >
                                {d.change > 0 ? "↑" : d.change < 0 ? "↓" : "→"}{" "}
                                {d.change > 0 ? "+" : ""}
                                {d.change}% change
                              </p>
                            </>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            Click name for profile
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={4} barSize={20}>
                    <LabelList
                      content={({ x, y, width, value, index }: any) => {
                        const entry = data.winRates[index];
                        const change = entry?.change || 0;
                        const hasChange = entry?.prevMatches > 0;
                        return (
                          <g>
                            <text
                              x={(x || 0) + (width || 0) + 4}
                              y={(y || 0) + 14}
                              className="fill-foreground text-xs"
                            >
                              {value}%
                            </text>
                            {hasChange && change !== 0 && (
                              <text
                                x={(x || 0) + (width || 0) + 38}
                                y={(y || 0) + 14}
                                className={`text-[10px] ${change > 0 ? "fill-green-500" : "fill-red-500"}`}
                              >
                                {change > 0 ? "↑" : "↓"}
                                {Math.abs(change)}
                              </text>
                            )}
                          </g>
                        );
                      }}
                    />
                    {data.winRates.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          chartConfig[entry.name]?.color ||
                          getPlayerColor(index, isDark)
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Points per Match</CardTitle>
              <CardDescription>
                Total points / Matches played (min 3 matches)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Avg Points", color: "hsl(var(--primary))" },
                }}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <BarChart
                  data={data.avgPoints}
                  layout="vertical"
                  margin={{ left: 0, right: 40 }}
                >
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    className="text-xs font-medium"
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                          <p
                            className="font-semibold hover:text-primary cursor-pointer hover:underline"
                            onClick={() => goToPlayer(d.name)}
                          >
                            {d.name} →
                          </p>
                          <p className="text-muted-foreground">
                            Avg Points:{" "}
                            <span className="text-foreground font-medium">
                              {d.value}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Total:{" "}
                            <span className="text-foreground font-medium">
                              {d.totalPoints}
                            </span>{" "}
                            pts in{" "}
                            <span className="text-foreground font-medium">
                              {d.matches}
                            </span>{" "}
                            matches
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            Click name for profile
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={4} barSize={20}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      className="fill-foreground"
                      fontSize={12}
                    />
                    {data.avgPoints.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          chartConfig[entry.name]?.color ||
                          getPlayerColor(index, isDark)
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Win Rate Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Win Rate Trends</CardTitle>
            <CardDescription>
              Win percentage progression over selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="h-[250px] sm:h-[300px] w-full"
            >
              <LineChart
                data={data.winRateOverTime}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <ChartLegend content={<ChartLegendContent />} />
                {data.topPlayers.map((player: string, index: number) => (
                  <Line
                    key={player}
                    type="monotone"
                    dataKey={player}
                    stroke={
                      chartConfig[player]?.color ||
                      getPlayerColor(index, isDark)
                    }
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Row 3: Impact Over Time */}
        {data.impactOverTime.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Impact Over Time</CardTitle>
              <CardDescription>
                Player impact progression - how much each player's weighted win rate differs from raw win rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={Object.fromEntries(
                  data.impactPlayers.slice(0, 10).map((p: string, i: number) => [
                    p,
                    { label: p, color: getPlayerColor(i, isDark) },
                  ]),
                )}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <LineChart
                  data={data.impactOverTime}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis
                    tickFormatter={(val) => `${val}%`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg text-sm max-w-xs">
                          <p className="font-semibold mb-2">
                            {new Date(label).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <div className="space-y-1">
                            {payload
                              .filter((p: any) => p.value !== undefined && p.value !== null)
                              .map((p: any) => (
                                <div key={p.dataKey} className="flex items-center justify-between gap-3">
                                  <span
                                    className="flex items-center gap-2 hover:text-primary cursor-pointer hover:underline"
                                    onClick={() => goToPlayer(p.dataKey)}
                                  >
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0"
                                      style={{ backgroundColor: p.color }}
                                    />
                                    <span className="text-xs">{p.dataKey}</span>
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {p.value > 0 ? "+" : ""}{p.value}%
                                  </span>
                                </div>
                              ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 italic">
                            Click player name for profile
                          </p>
                        </div>
                      );
                    }}
                  />
                  <ChartLegend content={<ChartLegendContent className="flex-wrap" />} />
                  {data.impactPlayers.slice(0, 10).map((player: string, index: number) => (
                    <Line
                      key={player}
                      type="monotone"
                      dataKey={player}
                      stroke={getPlayerColor(index, isDark)}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Row 4: Match Activity Calendar */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Match Activity</CardTitle>
            <CardDescription>
              Your badminton activity over the past year
            </CardDescription>
          </CardHeader>
          <CardContent className="lg:flex lg:justify-center">
            <MatchCalendar data={data.matchesByDate} />
          </CardContent>
        </Card>

        {/* Row 5: Daily Bonus Points (stacked by player) */}
        {data.dailyBonusPoints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Daily Bonus Points</CardTitle>
              <CardDescription>
                Bonus points awarded each day, stacked by player
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={Object.fromEntries(
                  data.bonusPlayers.map((p: string, i: number) => [
                    p,
                    { label: p, color: getPlayerColor(i, isDark) },
                  ]),
                )}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <BarChart
                  data={data.dailyBonusPoints}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    interval="preserveStartEnd"
                    tick={{ angle: -45, textAnchor: "end" }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                          <p className="font-semibold">
                            {new Date(label).toLocaleDateString()}
                          </p>
                          {payload.map((p: any) => (
                            <p key={p.dataKey} className="font-medium">
                              {p.dataKey}:{" "}
                              <span
                                className={cn(
                                  p.value >= 0
                                    ? "text-green-600 text-md"
                                    : "text-red-600 text-md",
                                  p.value >= 0 ? "+" : "",
                                )}
                              >
                                {p.value >= 0 ? "+" : ""}
                                {p.value}
                              </span>
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  {data.bonusPlayers.map((player: string, index: number) => (
                    <Bar
                      key={player}
                      dataKey={player}
                      stackId="bonus"
                      fill={getPlayerColor(index, isDark)}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Row 4: Totals (Bottom) */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Total Points Gained</CardTitle>
              <CardDescription>Top players by total points</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Points", color: getPlayerColor(2, isDark) },
                }}
                className="h-[200px] sm:h-[250px] w-full"
              >
                <BarChart
                  data={data.mostPoints}
                  layout="vertical"
                  margin={{ left: 0, right: 30 }}
                >
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    className="text-xs"
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                          <p
                            className="font-semibold hover:text-primary cursor-pointer hover:underline"
                            onClick={() => goToPlayer(d.name)}
                          >
                            {d.name} →
                          </p>
                          <p className="text-muted-foreground">
                            Total Points:{" "}
                            <span className="text-foreground font-medium">
                              {d.value}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            From{" "}
                            <span className="text-foreground font-medium">
                              {d.matches}
                            </span>{" "}
                            matches
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            Click name for profile
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={4} barSize={16}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      className="fill-foreground"
                      fontSize={12}
                    />
                    {data.mostPoints.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          chartConfig[entry.name]?.color ||
                          getPlayerColor(index, isDark)
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Wins</CardTitle>
              <CardDescription>Top players by total wins</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Wins", color: getPlayerColor(3, isDark) },
                }}
                className="h-[200px] sm:h-[250px] w-full"
              >
                <BarChart
                  data={data.mostWins}
                  layout="vertical"
                  margin={{ left: 0, right: 30 }}
                >
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    className="text-xs"
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                          <p
                            className="font-semibold hover:text-primary cursor-pointer hover:underline"
                            onClick={() => goToPlayer(d.name)}
                          >
                            {d.name} →
                          </p>
                          <p className="text-muted-foreground">
                            Total Wins:{" "}
                            <span className="text-foreground font-medium">
                              {d.value}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            From{" "}
                            <span className="text-foreground font-medium">
                              {d.matches}
                            </span>{" "}
                            matches
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            Click name for profile
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={4} barSize={16}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      className="fill-foreground"
                      fontSize={12}
                    />
                    {data.mostWins.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          chartConfig[entry.name]?.color ||
                          getPlayerColor(index, isDark)
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderDuoContent = (data: any) => {
    if (!data || data.totalDuos === 0)
      return (
        <div className="py-12 text-center text-muted-foreground">
          No duo partnerships found in this period.
        </div>
      );

    const duoChartConfig: any = { value: { label: "Value" } };
    data.duoWinRates.forEach((d: any, i: number) => {
      duoChartConfig[d.shortName] = {
        label: d.name,
        color: getPlayerColor(i, isDark),
      };
    });

    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        {/* Top Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duos</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalDuos}</div>
              <p className="text-xs text-muted-foreground">
                Unique partnerships
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Best Duo Win Rate
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.duoWinRates[0]?.value || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {data.duoWinRates[0]?.shortName || "-"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Highest Avg Pts
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.duoAvgPoints[0]?.value || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.duoAvgPoints[0]?.shortName || "-"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Most Duo Wins
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.duoMostWins[0]?.value || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.duoMostWins[0]?.shortName || "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 1: Win Rates & Average Points */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Duo Win Rates</CardTitle>
              <CardDescription>
                Win percentage by partnership (min 2 matches)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Win %", color: "hsl(var(--primary))" },
                }}
                className="h-[300px] sm:h-[350px] w-full"
              >
                <BarChart
                  data={data.duoWinRates}
                  layout="vertical"
                  margin={{ left: 0, right: 50 }}
                >
                  <YAxis
                    dataKey="shortName"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    className="text-xs font-medium"
                  />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                          <p className="font-semibold">{d.name}</p>
                          <p className="text-muted-foreground text-xs">
                            <span
                              className="hover:text-primary cursor-pointer hover:underline"
                              onClick={() => goToPlayer(d.player1)}
                            >
                              {d.player1}
                            </span>
                            {" & "}
                            <span
                              className="hover:text-primary cursor-pointer hover:underline"
                              onClick={() => goToPlayer(d.player2)}
                            >
                              {d.player2}
                            </span>
                          </p>
                          <p className="text-muted-foreground mt-1">
                            Win Rate:{" "}
                            <span className="text-foreground font-medium">
                              {d.value}%
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Matches:{" "}
                            <span className="text-foreground font-medium">
                              {d.wins}/{d.matches}
                            </span>{" "}
                            won
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            Click player name for profile
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={4} barSize={18}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(val: any) => `${val}%`}
                      className="fill-foreground"
                      fontSize={11}
                    />
                    {data.duoWinRates.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getPlayerColor(index, isDark)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duo Avg Points per Match</CardTitle>
              <CardDescription>
                Average points by partnership (min 2 matches)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Avg Points", color: "hsl(var(--primary))" },
                }}
                className="h-[300px] sm:h-[350px] w-full"
              >
                <BarChart
                  data={data.duoAvgPoints}
                  layout="vertical"
                  margin={{ left: 0, right: 40 }}
                >
                  <YAxis
                    dataKey="shortName"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    className="text-xs font-medium"
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                          <p className="font-semibold">{d.name}</p>
                          <p className="text-muted-foreground text-xs">
                            <span
                              className="hover:text-primary cursor-pointer hover:underline"
                              onClick={() => goToPlayer(d.player1)}
                            >
                              {d.player1}
                            </span>
                            {" & "}
                            <span
                              className="hover:text-primary cursor-pointer hover:underline"
                              onClick={() => goToPlayer(d.player2)}
                            >
                              {d.player2}
                            </span>
                          </p>
                          <p className="text-muted-foreground mt-1">
                            Avg Points:{" "}
                            <span className="text-foreground font-medium">
                              {d.value}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Total:{" "}
                            <span className="text-foreground font-medium">
                              {d.totalPoints}
                            </span>{" "}
                            pts in{" "}
                            <span className="text-foreground font-medium">
                              {d.matches}
                            </span>{" "}
                            matches
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            Click player name for profile
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={4} barSize={18}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      className="fill-foreground"
                      fontSize={11}
                    />
                    {data.duoAvgPoints.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getPlayerColor(index, isDark)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Most Matches Together & Most Points */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Most Games Together</CardTitle>
              <CardDescription>
                Partnerships with most matches played
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Matches", color: getPlayerColor(4, isDark) },
                }}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <BarChart
                  data={data.duoMostMatches}
                  layout="vertical"
                  margin={{ left: 0, right: 40 }}
                >
                  <YAxis
                    dataKey="shortName"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    className="text-xs font-medium"
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                          <p className="font-semibold">{d.name}</p>
                          <p className="text-muted-foreground text-xs">
                            <span
                              className="hover:text-primary cursor-pointer hover:underline"
                              onClick={() => goToPlayer(d.player1)}
                            >
                              {d.player1}
                            </span>
                            {" & "}
                            <span
                              className="hover:text-primary cursor-pointer hover:underline"
                              onClick={() => goToPlayer(d.player2)}
                            >
                              {d.player2}
                            </span>
                          </p>
                          <p className="text-muted-foreground mt-1">
                            Matches:{" "}
                            <span className="text-foreground font-medium">
                              {d.value}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Wins:{" "}
                            <span className="text-foreground font-medium">
                              {d.wins}
                            </span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            Click player name for profile
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={4} barSize={18}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      className="fill-foreground"
                      fontSize={11}
                    />
                    {data.duoMostMatches.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getPlayerColor(index, isDark)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Duo Points</CardTitle>
              <CardDescription>
                Total points earned by partnerships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Points", color: getPlayerColor(2, isDark) },
                }}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <BarChart
                  data={data.duoMostPoints}
                  layout="vertical"
                  margin={{ left: 0, right: 40 }}
                >
                  <YAxis
                    dataKey="shortName"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    className="text-xs font-medium"
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                          <p className="font-semibold">{d.name}</p>
                          <p className="text-muted-foreground text-xs">
                            <span
                              className="hover:text-primary cursor-pointer hover:underline"
                              onClick={() => goToPlayer(d.player1)}
                            >
                              {d.player1}
                            </span>
                            {" & "}
                            <span
                              className="hover:text-primary cursor-pointer hover:underline"
                              onClick={() => goToPlayer(d.player2)}
                            >
                              {d.player2}
                            </span>
                          </p>
                          <p className="text-muted-foreground mt-1">
                            Total Points:{" "}
                            <span className="text-foreground font-medium">
                              {d.value}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            From{" "}
                            <span className="text-foreground font-medium">
                              {d.matches}
                            </span>{" "}
                            matches
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            Click player name for profile
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={4} barSize={18}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      className="fill-foreground"
                      fontSize={11}
                    />
                    {data.duoMostPoints.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getPlayerColor(index, isDark)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Total Wins */}
        <Card>
          <CardHeader>
            <CardTitle>Total Duo Wins</CardTitle>
            <CardDescription>Partnerships ranked by total wins</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Wins", color: getPlayerColor(0, isDark) },
              }}
              className="h-[250px] sm:h-[300px] w-full"
            >
              <BarChart
                data={data.duoMostWins}
                layout="vertical"
                margin={{ left: 0, right: 40 }}
              >
                <YAxis
                  dataKey="shortName"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  className="text-xs font-medium"
                />
                <XAxis type="number" hide />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                        <p className="font-semibold">{d.name}</p>
                        <p className="text-muted-foreground text-xs">
                          <span
                            className="hover:text-primary cursor-pointer hover:underline"
                            onClick={() => goToPlayer(d.player1)}
                          >
                            {d.player1}
                          </span>
                          {" & "}
                          <span
                            className="hover:text-primary cursor-pointer hover:underline"
                            onClick={() => goToPlayer(d.player2)}
                          >
                            {d.player2}
                          </span>
                        </p>
                        <p className="text-muted-foreground mt-1">
                          Total Wins:{" "}
                          <span className="text-foreground font-medium">
                            {d.value}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          From{" "}
                          <span className="text-foreground font-medium">
                            {d.matches}
                          </span>{" "}
                          matches
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 italic">
                          Click player name for profile
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={4} barSize={18}>
                  <LabelList
                    dataKey="value"
                    position="right"
                    className="fill-foreground"
                    fontSize={11}
                  />
                  {data.duoMostWins.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getPlayerColor(index, isDark)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background overflow-x-auto">
      <Navbar title={strictMode ? "Analytics (Strict Mode)" : "Analytics"} />

      <div className="max-w-6xl mx-auto p-2 md:p-6 pt-0 md:pt-2 space-y-4 mt-6">
        <PlayerOfTheDay playerName={stats.playerOfTheDay} />

        {/* Controls & Tabs */}
        <Tabs defaultValue="doubles" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
            <TabsList className="grid w-full md:w-[500px] grid-cols-3">
              <TabsTrigger value="doubles" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Doubles
              </TabsTrigger>
              <TabsTrigger value="duos" className="flex items-center gap-2">
                <Handshake className="h-4 w-4" /> Duos
              </TabsTrigger>
              <TabsTrigger value="singles" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Singles
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Popover
                open={popoverOpen}
                onOpenChange={(open) => {
                  setPopoverOpen(open);
                  // Reset to list view when popover opens or closes
                  if (!open) {
                    setShowCalendar(false);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full md:w-60 justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>
                        {timePeriod === "today" && "Today"}
                        {timePeriod === "yesterday" && "Yesterday"}
                        {timePeriod === "7d" && "Last 7 Days"}
                        {timePeriod === "15d" && "Last 15 Days"}
                        {timePeriod === "this-month" && "This Month"}
                        {timePeriod === "last-month" && "Last Month"}
                        {timePeriod === "30d" && "Last 30 Days"}
                        {timePeriod === "60d" && "Last 60 Days"}
                        {timePeriod === "365d" && "A Year"}
                        {timePeriod === "all" && "All Time"}
                        {timePeriod === "custom" &&
                          customDateRange.from &&
                          customDateRange.to &&
                          `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`}
                        {timePeriod === "custom" &&
                          (!customDateRange.from || !customDateRange.to) &&
                          "Custom Range"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 max-h-[90vh] overflow-y-auto"
                  align="end"
                >
                  {!showCalendar || timePeriod !== "custom" ? (
                    <div className="grid p-1">
                      <Button
                        variant={timePeriod === "today" ? "secondary" : "ghost"}
                        className="justify-start font-normal"
                        onClick={() => {
                          setTimePeriod("today");
                          setShowCalendar(false);
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        variant={
                          timePeriod === "yesterday" ? "secondary" : "ghost"
                        }
                        className="justify-start font-normal"
                        onClick={() => {
                          setTimePeriod("yesterday");
                          setShowCalendar(false);
                        }}
                      >
                        Yesterday
                      </Button>
                      <Button
                        variant={timePeriod === "7d" ? "secondary" : "ghost"}
                        className="justify-start font-normal"
                        onClick={() => {
                          setTimePeriod("7d");
                          setShowCalendar(false);
                        }}
                      >
                        Last 7 Days
                      </Button>
                      <Button
                        variant={timePeriod === "15d" ? "secondary" : "ghost"}
                        className="justify-start font-normal"
                        onClick={() => {
                          setTimePeriod("15d");
                          setShowCalendar(false);
                        }}
                      >
                        Last 15 Days
                      </Button>
                      <Button
                        variant={
                          timePeriod === "this-month" ? "secondary" : "ghost"
                        }
                        className="justify-start font-normal"
                        onClick={() => {
                          setTimePeriod("this-month");
                          setShowCalendar(false);
                        }}
                      >
                        This Month
                      </Button>
                      <Button
                        variant={
                          timePeriod === "last-month" ? "secondary" : "ghost"
                        }
                        className="justify-start font-normal"
                        onClick={() => {
                          setTimePeriod("last-month");
                          setShowCalendar(false);
                        }}
                      >
                        Last Month
                      </Button>
                      <Button
                        variant={timePeriod === "30d" ? "secondary" : "ghost"}
                        className="justify-start font-normal"
                        onClick={() => {
                          setTimePeriod("30d");
                          setShowCalendar(false);
                        }}
                      >
                        Last 30 Days
                      </Button>
                      <Button
                        variant={timePeriod === "60d" ? "secondary" : "ghost"}
                        className="justify-start font-normal"
                        onClick={() => {
                          setTimePeriod("60d");
                          setShowCalendar(false);
                        }}
                      >
                        Last 60 Days
                      </Button>
                      <Button
                        variant={timePeriod === "365d" ? "secondary" : "ghost"}
                        className="justify-start font-normal"
                        onClick={() => {
                          setTimePeriod("365d");
                          setShowCalendar(false);
                        }}
                      >
                        A Year
                      </Button>
                      <div className="border-t my-1" />
                      <Button
                        variant={timePeriod === "all" ? "secondary" : "ghost"}
                        className="justify-start font-normal"
                        onClick={() => {
                          setTimePeriod("all");
                          setShowCalendar(false);
                        }}
                      >
                        All Time
                      </Button>
                      <div className="border-t my-1" />
                      <Button
                        variant={timePeriod === "custom" ? "secondary" : "ghost"}
                        className="justify-start font-normal gap-2"
                        onClick={() => {
                          setShowCalendar(true);
                          setTimePeriod("custom");
                        }}
                      >
                        <CalendarIcon className="h-4 w-4" />
                        Custom Range
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 max-w-full">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">Select Date Range</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowCalendar(false);
                            if (!customDateRange.from || !customDateRange.to) {
                              setTimePeriod("30d");
                            }
                          }}
                        >
                          ← Back
                        </Button>
                      </div>
                      <Calendar
                        mode="range"
                        defaultMonth={customDateRange.from || new Date()}
                        selected={{
                          from: customDateRange.from,
                          to: customDateRange.to,
                        }}
                        onSelect={(range) => {
                          setCustomDateRange({
                            from: range?.from,
                            to: range?.to,
                          });
                          if (range?.from && range?.to) {
                            setTimePeriod("custom");
                            setShowCalendar(false);
                          }
                        }}
                        numberOfMonths={window.innerWidth >= 768 ? 2 : 1}
                        toDate={new Date()}
                        className="rounded-md"
                      />
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <TabsContent value="doubles" className="space-y-8">
            {renderContent(
              stats.doubles,
              "Doubles",
              stats.totalDoublesAllTime,
              getPlayerColor,
            )}
          </TabsContent>

          <TabsContent value="duos" className="space-y-8">
            {renderDuoContent(stats.duos)}
          </TabsContent>

          <TabsContent value="singles" className="space-y-8">
            {renderContent(
              stats.singles,
              "Singles",
              stats.totalSinglesAllTime,
              getPlayerColor,
            )}
          </TabsContent>
        </Tabs>

        {/* All Players Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Players
            </CardTitle>
            <CardDescription>
              Click on a player to view their profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allPlayers.map((player) => (
                <Link
                  key={player}
                  href={`/home/${groupId}/analytics/player/${encodeURIComponent(player)}`}
                  className="inline-flex items-center h-9 px-4 text-sm border hover:bg-foreground hover:text-background transition-colors rounded-xl"
                >
                  {player}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}