"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Trophy, Medal, Filter, ChevronDown, ChevronLeft, Calculator, Handshake, 
  CalendarIcon, Users
} from "lucide-react";

import { Navbar } from "@/components/navbar";
import { PlayerOfTheDay } from "@/components/player-of-the-day";
import { useColorMode } from "@/components/color-mode-provider";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart,
  Line, Cell, LabelList, ResponsiveContainer
} from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
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
  | "today" | "yesterday" | "7d" | "15d" | "this-month"
  | "last-month" | "30d" | "60d" | "365d" | "all" | "custom";

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupid as string;

  const { getPlayerColor } = useColorMode();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [strictMode, setStrictMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<DateRangeOption>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`badminton_analytics_timeperiod_${groupId}`);
      if (saved) return saved as DateRangeOption;
    }
    return "30d";
  });
  
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date; }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`badminton_analytics_customdates_${groupId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          from: parsed.from ? new Date(parsed.from) : undefined,
          to: parsed.to ? new Date(parsed.to) : undefined,
        };
      }
    }
    return {};
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const goToPlayer = (name: string) => {
    router.push(`/home/${groupId}/analytics/player/${encodeURIComponent(name)}`);
  };

  const allPlayers = useMemo(() => {
    const players = new Set<string>();
    matches.forEach((m) => {
      m.team1.players.forEach((p) => p.name && players.add(p.name.trim()));
      m.team2.players.forEach((p) => p.name && players.add(p.name.trim()));
    });
    return Array.from(players).sort();
  }, [matches]);

  useEffect(() => {
    if (groupId) localStorage.setItem(`badminton_analytics_timeperiod_${groupId}`, timePeriod);
  }, [timePeriod, groupId]);

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

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const getDateRange = (period: DateRangeOption): { start: Date | null; end: Date } => {
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

      if (period === "today") return { start, end };
      if (period === "yesterday") {
        start.setDate(start.getDate() - 1);
        const yesterdayEnd = new Date(start);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return { start, end: yesterdayEnd };
      }
      if (period === "7d") { start.setDate(start.getDate() - 7); return { start, end }; }
      if (period === "15d") { start.setDate(start.getDate() - 15); return { start, end }; }
      if (period === "this-month") { start.setDate(1); return { start, end }; }
      if (period === "last-month") {
        start.setDate(1);
        start.setMonth(start.getMonth() - 1);
        end.setMonth(end.getMonth() - 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      if (period === "30d") { start.setDate(start.getDate() - 30); return { start, end }; }
      if (period === "60d") { start.setDate(start.getDate() - 60); return { start, end }; }
      if (period === "365d") { start.setDate(start.getDate() - 365); return { start, end }; }
      return { start: null, end };
    };

    const getPeriodDays = (period: DateRangeOption): number => {
      if (period === "today" || period === "yesterday") return 1;
      if (period === "7d") return 7;
      if (period === "15d") return 15;
      if (period === "this-month" || period === "last-month" || period === "30d") return 30;
      if (period === "60d") return 60;
      if (period === "365d") return 365;
      if (period === "custom" && customDateRange.from && customDateRange.to) {
        const diffTime = customDateRange.to.getTime() - customDateRange.from.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return 0;
    };

    const periodDays = getPeriodDays(timePeriod);
    const dateRange = getDateRange(timePeriod);

    const filteredMatches = matches.filter((m) => {
      if (!dateRange.start) return true;
      const matchDate = new Date(m.createdAt);
      return matchDate >= dateRange.start && matchDate <= dateRange.end;
    });

    const previousPeriodMatches = timePeriod !== "all" && dateRange.start
      ? matches.filter((m) => {
          const matchDate = new Date(m.createdAt);
          const periodLength = periodDays * 24 * 60 * 60 * 1000;
          const prevStart = new Date(dateRange.start!.getTime() - periodLength);
          const prevEnd = new Date(dateRange.start!.getTime() - 1);
          return matchDate >= prevStart && matchDate <= prevEnd;
        })
      : [];

    const calculateSubsetStats = (subset: Match[], previousSubset: Match[] = [], strictMode: boolean = false) => {
      const playerStats: Record<string, { wins: number; losses: number; points: number; matches: number; bonusPoints: number }> = {};
      const currentWinRateTotals = computePlayerWinRateTotals(subset, { bonusWeightedDoubles: { strictMode } });
      const previousWinRateTotals = computePlayerWinRateTotals(previousSubset, { bonusWeightedDoubles: { strictMode } });

      const update = (name: string, isWinner: boolean, points: number, bonus: number) => {
        if (!name) return;
        const n = name.trim();
        if (!playerStats[n]) playerStats[n] = { wins: 0, losses: 0, points: 0, matches: 0, bonusPoints: 0 };
        playerStats[n].matches++;
        playerStats[n].points += points;
        playerStats[n].bonusPoints += bonus;
        if (isWinner) playerStats[n].wins++; else playerStats[n].losses++;
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
          update(n, isT1, m.team1.score + (p.bonusPoints || 0), p.bonusPoints || 0);
        });

        m.team2.players.forEach((p) => {
          if (!p.name) return;
          const n = p.name.trim();
          if (processed.has(n)) return;
          processed.add(n);
          update(n, isT2, m.team2.score + (p.bonusPoints || 0), p.bonusPoints || 0);
        });
      });

      const players = Object.keys(playerStats);

      const winRates = players.map((name) => {
        const s = playerStats[name];
        const currentTotals = currentWinRateTotals[name];
        const currentWinRate = currentTotals ? computeWinRatePercent(currentTotals, 3) : 0;
        const rawWinRate = currentTotals ? computeRawWinRatePercent(currentTotals, 3) : 0;
        const playImpact = parseFloat((currentWinRate - rawWinRate).toFixed(1));

        const prevTotals = previousWinRateTotals[name];
        let prevWinRate = 0; let change = 0;
        if (prevTotals && prevTotals.rawMatches >= 1) {
          prevWinRate = computeWinRatePercent(prevTotals, 1);
          if (s.matches >= 3) change = parseFloat((currentWinRate - prevWinRate).toFixed(1));
        }
        return { name, value: currentWinRate, wins: s.wins, matches: s.matches, losses: s.losses, rawWinRate, playImpact, prevWinRate, prevMatches: prevTotals?.rawMatches || 0, change };
      }).filter((p) => p.matches >= 3).sort((a, b) => b.value - a.value).slice(0, 10);

      const avgPoints = players.map((name) => {
        const s = playerStats[name];
        return { name, value: s.matches >= 3 ? parseFloat((s.points / s.matches).toFixed(1)) : 0, matches: s.matches, totalPoints: s.points };
      }).filter((p) => p.matches >= 3).sort((a, b) => b.value - a.value).slice(0, 10);

      const mostWins = players.map((name) => ({ name, value: playerStats[name].wins, matches: playerStats[name].matches })).sort((a, b) => b.value - a.value).slice(0, 10);
      const mostPoints = players.map((name) => ({ name, value: playerStats[name].points, matches: playerStats[name].matches })).sort((a, b) => b.value - a.value).slice(0, 10);

      const dailyBonusPoints: any[] = [];
      const dateMap: Record<string, Record<string, number>> = {};
      subset.forEach((m) => {
        const date = m.createdAt.split("T")[0];
        [...m.team1.players, ...m.team2.players].forEach((p) => {
          if (p.name && p.bonusPoints && p.bonusPoints !== 0) {
            if (!dateMap[date]) dateMap[date] = {};
            const n = p.name.trim();
            dateMap[date][n] = (dateMap[date][n] || 0) + p.bonusPoints;
          }
        });
      });
      Object.entries(dateMap).forEach(([date, playersMap]) => {
        const entry: any = { date }; Object.assign(entry, playersMap); dailyBonusPoints.push(entry);
      });
      dailyBonusPoints.sort((a, b) => a.date.localeCompare(b.date));

      const bonusPlayersSet = new Set<string>();
      Object.values(dateMap).forEach((day) => Object.keys(day).forEach((p) => bonusPlayersSet.add(p)));
      const bonusPlayers = Array.from(bonusPlayersSet).sort((a, b) => Math.abs(playerStats[b].bonusPoints) - Math.abs(playerStats[a].bonusPoints));

      const top5 = mostWins.slice(0, 5).map((p) => p.name);
      const winRateOverTime = computeWinRateOverTime(subset, top5);

      const impactOverTime: Array<{ date: string; [key: string]: any }> = [];
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
            if (!impactByDate[date][name]) impactByDate[date][name] = { impact: 0, count: 0 };
            impactByDate[date][name].impact = impact;
            impactByDate[date][name].count++;
          }
        });
      });

      Object.entries(impactByDate).forEach(([date, playersMap]) => {
        const entry: any = { date };
        Object.entries(playersMap).forEach(([name, data]) => { entry[name] = data.impact; });
        impactOverTime.push(entry);
      });
      impactOverTime.sort((a, b) => a.date.localeCompare(b.date));

      const impactPlayersSet = new Set<string>();
      Object.values(impactByDate).forEach((day) => Object.keys(day).forEach((p) => impactPlayersSet.add(p)));
      const impactPlayers = Array.from(impactPlayersSet).sort((a, b) => {
        const aLastImpact = winRates.find((wr) => wr.name === a)?.playImpact || 0;
        const bLastImpact = winRates.find((wr) => wr.name === b)?.playImpact || 0;
        return Math.abs(bLastImpact) - Math.abs(aLastImpact);
      });

      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const activityByDay = daysOfWeek.map((day) => ({ day, matches: 0 }));
      subset.forEach((m) => { activityByDay[new Date(m.createdAt).getDay()].matches++; });

      const matchesByDate: Record<string, number> = {};
      subset.forEach((m) => {
        const date = m.createdAt.split("T")[0];
        matchesByDate[date] = (matchesByDate[date] || 0) + 1;
      });

      return { winRates, avgPoints, mostWins, mostPoints, dailyBonusPoints, bonusPlayers, winRateOverTime, impactOverTime, impactPlayers, activityByDay, matchesByDate: Object.entries(matchesByDate).map(([date, count]) => ({ date, count })), totalMatches: subset.length, topPlayers: top5 };
    };

    const singlesMatches = filteredMatches.filter((m) => m.team1.players.length + m.team2.players.length <= 3);
    const doublesMatches = filteredMatches.filter((m) => m.team1.players.length + m.team2.players.length === 4);
    const prevSinglesMatches = previousPeriodMatches.filter((m) => m.team1.players.length + m.team2.players.length <= 3);
    const prevDoublesMatches = previousPeriodMatches.filter((m) => m.team1.players.length + m.team2.players.length === 4);

    const calculateDuoStats = (subset: Match[]) => {
      const duoStats: Record<string, { wins: number; losses: number; points: number; matches: number; player1: string; player2: string }> = {};

      const getDuoKey = (p1: string, p2: string) => { const sorted = [p1.trim(), p2.trim()].sort(); return `${sorted[0]} & ${sorted[1]}`; };
      const getShortDuoKey = (p1: string, p2: string) => { const sorted = [p1.trim()[0]?.toUpperCase() || "", p2.trim()[0]?.toUpperCase() || ""].sort(); return `${sorted[0]}${sorted[1]}`; };

      subset.forEach((m) => {
        if (m.team1.players.length === 2 && m.team2.players.length === 2) {
          const t1p1 = m.team1.players[0]?.name || ""; const t1p2 = m.team1.players[1]?.name || "";
          const t2p1 = m.team2.players[0]?.name || ""; const t2p2 = m.team2.players[1]?.name || "";

          const processDuo = (p1: string, p2: string, score: number, isWin: boolean) => {
            if (p1 && p2) {
              const key = getDuoKey(p1, p2);
              if (!duoStats[key]) { const [player1, player2] = [p1.trim(), p2.trim()].sort(); duoStats[key] = { wins: 0, losses: 0, points: 0, matches: 0, player1, player2 }; }
              duoStats[key].matches++; duoStats[key].points += score;
              if (isWin) duoStats[key].wins++; else duoStats[key].losses++;
            }
          };
          processDuo(t1p1, t1p2, m.team1.score, m.winner === "team1");
          processDuo(t2p1, t2p2, m.team2.score, m.winner === "team2");
        }
      });

      const duos = Object.keys(duoStats);

      const duoWinRates = duos.map((key) => {
        const s = duoStats[key]; const shortKey = getShortDuoKey(s.player1, s.player2);
        return { name: key, shortName: shortKey, value: s.matches >= 2 ? parseFloat(((s.wins / s.matches) * 100).toFixed(1)) : 0, wins: s.wins, matches: s.matches, losses: s.losses, player1: s.player1, player2: s.player2 };
      }).filter((d) => d.matches >= 2).sort((a, b) => b.value - a.value).slice(0, 10);

      const duoAvgPoints = duos.map((key) => {
        const s = duoStats[key]; const shortKey = getShortDuoKey(s.player1, s.player2);
        return { name: key, shortName: shortKey, value: s.matches >= 2 ? parseFloat((s.points / s.matches).toFixed(1)) : 0, matches: s.matches, totalPoints: s.points, player1: s.player1, player2: s.player2 };
      }).filter((d) => d.matches >= 2).sort((a, b) => b.value - a.value).slice(0, 10);

      const duoMostWins = duos.map((key) => {
        const s = duoStats[key]; const shortKey = getShortDuoKey(s.player1, s.player2);
        return { name: key, shortName: shortKey, value: s.wins, matches: s.matches, player1: s.player1, player2: s.player2 };
      }).sort((a, b) => b.value - a.value).slice(0, 10);

      const duoMostPoints = duos.map((key) => {
        const s = duoStats[key]; const shortKey = getShortDuoKey(s.player1, s.player2);
        return { name: key, shortName: shortKey, value: s.points, matches: s.matches, player1: s.player1, player2: s.player2 };
      }).sort((a, b) => b.value - a.value).slice(0, 10);

      const duoMostMatches = duos.map((key) => {
        const s = duoStats[key]; const shortKey = getShortDuoKey(s.player1, s.player2);
        return { name: key, shortName: shortKey, value: s.matches, wins: s.wins, player1: s.player1, player2: s.player2 };
      }).sort((a, b) => b.value - a.value).slice(0, 10);

      return { duoWinRates, duoAvgPoints, duoMostWins, duoMostPoints, duoMostMatches, topDuo: duoMostWins[0] || null, totalDuos: duos.length };
    };

    const duoData = calculateDuoStats(doublesMatches);

    const todayMatches = matches.filter((m) => m.createdAt.startsWith(todayStr));
    const dailyStats: Record<string, number> = {};
    todayMatches.forEach((m) => {
      if (m.winner === "team1") m.team1.players.forEach((p) => (dailyStats[p.name] = (dailyStats[p.name] || 0) + 1));
      if (m.winner === "team2") m.team2.players.forEach((p) => (dailyStats[p.name] = (dailyStats[p.name] || 0) + 1));
    });
    let playerOfTheDay = null; let maxDailyWins = 0;
    Object.entries(dailyStats).forEach(([name, wins]) => { if (wins > maxDailyWins) { maxDailyWins = wins; playerOfTheDay = name; } });

    return {
      singles: calculateSubsetStats(singlesMatches, prevSinglesMatches, strictMode),
      doubles: calculateSubsetStats(doublesMatches, prevDoublesMatches, strictMode),
      duos: duoData,
      playerOfTheDay,
      totalMatches: matches.length,
      totalSinglesAllTime: matches.filter((m) => m.team1.players.length + m.team2.players.length <= 3).length,
      totalDoublesAllTime: matches.filter((m) => m.team1.players.length + m.team2.players.length === 4).length,
    };
  }, [matches, timePeriod, strictMode, customDateRange]);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  if (loading) return <AnalyticsSkeleton />;
  if (!stats) return <div className="p-8 text-center text-muted-foreground">No analytics data available</div>;

  const renderContent = (data: any, title: string, totalAllTime: number) => {
    if (!data || data.totalMatches === 0) return <div className="py-12 text-center text-muted-foreground">No {title.toLowerCase()} matches found in this period.</div>;

    const chartConfig: any = { points: { label: "Points" } };
    data.topPlayers.forEach((p: string, i: number) => { chartConfig[p] = { label: p, color: getPlayerColor(i, isDark) }; });

    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Matches Played" value={data.totalMatches} sub={timePeriod === 'all' ? `Total matches` : `In selected period`} icon={<Medal className="w-4 h-4 shrink-0" />} />
          <StatCard title="Best Win Rate" value={`${data.winRates[0]?.value || 0}%`} sub={data.winRates[0]?.name || '-'} icon={<Trophy className="w-4 h-4 shrink-0" />} onClick={() => data.winRates[0]?.name && goToPlayer(data.winRates[0].name)} />
          <StatCard title="Highest Avg Pts" value={data.avgPoints[0]?.value || 0} sub={data.avgPoints[0]?.name || '-'} icon={<Calculator className="w-4 h-4 shrink-0" />} onClick={() => data.avgPoints[0]?.name && goToPlayer(data.avgPoints[0].name)} />
          <StatCard title="Most Wins" value={data.mostWins[0]?.value || 0} sub={data.mostWins[0]?.name || '-'} icon={<Trophy className="w-4 h-4 shrink-0" />} onClick={() => data.mostWins[0]?.name && goToPlayer(data.mostWins[0].name)} />
        </div>

        <Card className="md:col-span-6 rounded-2xl border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-balance">Win Rates</CardTitle>
            <CardDescription>Min 3 matches • vs previous period</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Win %", color: "hsl(var(--primary))" } }} className="h-[300px] w-full">
              <BarChart data={data.winRates} layout="vertical" margin={{ left: 0, right: 50 }}>
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} className="text-xs font-medium" />
                <XAxis type="number" hide />
                <ChartTooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null; const d = payload[0].payload;
                  const playImpact = Number(d.playImpact ?? 0);
                  const impactColor = playImpact > 0 ? "text-green-500" : playImpact < 0 ? "text-red-500" : "text-muted-foreground";
                  return (
                    <div className="bg-card border border-border/50 rounded-xl p-3 shadow-sm text-sm">
                      <p className="font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => goToPlayer(d.name)}>{d.name} →</p>
                      <div className="space-y-1 mt-2">
                        <p className="text-muted-foreground flex justify-between gap-4">Win Rate: <span className="tabular-nums font-medium text-foreground">{d.value}%</span></p>
                        <p className="text-muted-foreground flex justify-between gap-4">Impact: <span className={cn("tabular-nums font-medium", impactColor)}>{playImpact > 0 ? "+" : ""}{playImpact}%</span></p>
                        <p className="text-muted-foreground flex justify-between gap-4">Matches: <span className="tabular-nums font-medium text-foreground">{d.wins}/{d.matches}</span></p>
                      </div>
                      {d.prevMatches > 0 && (
                        <>
                          <div className="border-t border-border/50 my-2" />
                          <p className="text-muted-foreground text-xs flex justify-between gap-4">Previous: <span className="tabular-nums font-medium text-foreground">{d.prevWinRate}%</span></p>
                        </>
                      )}
                    </div>
                  );
                }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  <LabelList dataKey="value" position="right" formatter={(val: any) => `${val}%`} className="fill-foreground text-xs tabular-nums" />
                  {data.winRates.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || getPlayerColor(index, isDark)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-6 rounded-2xl border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-balance">Average Points</CardTitle>
            <CardDescription>Total points / Matches played (min 3 matches)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Avg Points", color: "hsl(var(--primary))" } }} className="h-[300px] w-full">
              <BarChart data={data.avgPoints} layout="vertical" margin={{ left: 0, right: 40 }}>
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} className="text-xs font-medium" />
                <XAxis type="number" hide />
                <ChartTooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null; const d = payload[0].payload;
                  return (
                    <div className="bg-card border border-border/50 rounded-xl p-3 shadow-sm text-sm">
                      <p className="font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => goToPlayer(d.name)}>{d.name} →</p>
                      <div className="space-y-1 mt-2">
                        <p className="text-muted-foreground flex justify-between gap-4">Avg Points: <span className="tabular-nums font-medium text-foreground">{d.value}</span></p>
                        <p className="text-muted-foreground flex justify-between gap-4">Total: <span className="tabular-nums font-medium text-foreground">{d.totalPoints} pts</span></p>
                      </div>
                    </div>
                  );
                }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  <LabelList dataKey="value" position="right" className="fill-foreground text-xs tabular-nums" />
                  {data.avgPoints.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || getPlayerColor(index, isDark)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-12 rounded-2xl border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-balance">Performance Velocity</CardTitle>
            <CardDescription>Progression over selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={data.winRateOverTime} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} className="tabular-nums" />
                <ChartTooltip content={<ChartTooltipContent hideIndicator className="rounded-xl shadow-sm border-border/50" />} />
                <ChartLegend content={<ChartLegendContent />} />
                {data.topPlayers.map((player: string, index: number) => (
                  <Line key={player} type="monotone" dataKey={player} stroke={chartConfig[player]?.color || getPlayerColor(index, isDark)} strokeWidth={2.5} dot={false} />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {data.impactOverTime && data.impactOverTime.length > 0 && (
          <Card className="md:col-span-12 rounded-2xl border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-balance">Play Impact History</CardTitle>
              <CardDescription>Player impact progression over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={data.impactOverTime} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                  <YAxis tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} className="tabular-nums" />
                  <ChartTooltip content={<ChartTooltipContent hideIndicator className="rounded-xl shadow-sm border-border/50" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {data.impactPlayers.slice(0,10).map((player: string, index: number) => (
                    <Line key={player} type="monotone" dataKey={player} stroke={chartConfig[player]?.color || getPlayerColor(index, isDark)} strokeWidth={2.5} dot={false} />
                  ))}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {data.dailyBonusPoints && data.dailyBonusPoints.length > 0 && (
          <Card className="md:col-span-6 rounded-2xl border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-balance">Bonus Distribution</CardTitle>
              <CardDescription>Daily bonus points awarded</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[250px] w-full">
                <BarChart data={data.dailyBonusPoints} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs" tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                  <YAxis tickLine={false} axisLine={false} className="tabular-nums" />
                  <ChartTooltip content={<ChartTooltipContent className="rounded-xl shadow-sm border-border/50" />} />
                  {data.bonusPlayers.map((player: string, index: number) => (
                    <Bar key={player} dataKey={player} stackId="bonus" fill={getPlayerColor(index, isDark)} />
                  ))}
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <Card className={cn("rounded-2xl border-border/50 bg-card shadow-sm p-8 flex flex-col justify-center items-center", data.dailyBonusPoints && data.dailyBonusPoints.length > 0 ? 'md:col-span-6' : 'md:col-span-12')}>
          <CardTitle className="mb-4 text-balance">Court Density</CardTitle>
          <div className="w-full overflow-x-auto flex justify-center pb-4"><MatchCalendar data={data.matchesByDate} /></div>
        </Card>

        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
           <LeaderboardCard title="Total Points Gained" data={data.mostPoints} isDark={isDark} getPlayerColor={getPlayerColor} colorIndex={2} goToPlayer={goToPlayer} />
           <LeaderboardCard title="Total Wins" data={data.mostWins} isDark={isDark} getPlayerColor={getPlayerColor} colorIndex={3} goToPlayer={goToPlayer} />
        </div>
      </div>
    );
  };

  const renderDuoContent = (data: any) => {
    if (!data || data.totalDuos === 0) return <div className="py-12 text-center text-muted-foreground">No duo partnerships found.</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Duos" value={data.totalDuos} sub="Unique partnerships" icon={<Handshake className="w-4 h-4 shrink-0" />} />
          <StatCard title="Best Duo Win Rate" value={`${data.duoWinRates[0]?.value || 0}%`} sub={data.duoWinRates[0]?.shortName || '-'} icon={<Trophy className="w-4 h-4 shrink-0" />} />
          <StatCard title="Highest Avg Pts" value={data.duoAvgPoints[0]?.value || 0} sub={data.duoAvgPoints[0]?.shortName || '-'} icon={<Calculator className="w-4 h-4 shrink-0" />} />
          <StatCard title="Most Duo Wins" value={data.duoMostWins[0]?.value || 0} sub={data.duoMostWins[0]?.shortName || '-'} icon={<Trophy className="w-4 h-4 shrink-0" />} />
        </div>

        <Card className="md:col-span-6 rounded-2xl border-border/50 bg-card shadow-sm">
          <CardHeader><CardTitle className="text-balance">Duo Win Rates</CardTitle><CardDescription>Min 2 matches</CardDescription></CardHeader>
          <CardContent><DuoBarChart data={data.duoWinRates} isDark={isDark} getPlayerColor={getPlayerColor} goToPlayer={goToPlayer} /></CardContent>
        </Card>

        <Card className="md:col-span-6 rounded-2xl border-border/50 bg-card shadow-sm">
          <CardHeader><CardTitle className="text-balance">Duo Avg Points</CardTitle><CardDescription>Min 2 matches</CardDescription></CardHeader>
          <CardContent><DuoBarChart data={data.duoAvgPoints} isDark={isDark} getPlayerColor={getPlayerColor} goToPlayer={goToPlayer} /></CardContent>
        </Card>

        <Card className="md:col-span-6 rounded-2xl border-border/50 bg-card shadow-sm">
          <CardHeader><CardTitle className="text-balance">Most Games Together</CardTitle></CardHeader>
          <CardContent><DuoBarChart data={data.duoMostMatches} isDark={isDark} getPlayerColor={getPlayerColor} goToPlayer={goToPlayer} /></CardContent>
        </Card>
        
        <Card className="md:col-span-6 rounded-2xl border-border/50 bg-card shadow-sm">
          <CardHeader><CardTitle className="text-balance">Total Duo Points</CardTitle></CardHeader>
          <CardContent><DuoBarChart data={data.duoMostPoints} isDark={isDark} getPlayerColor={getPlayerColor} goToPlayer={goToPlayer} /></CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar title={strictMode ? "Analytics (Strict Mode)" : "Analytics"} />

      <main className="max-w-6xl mx-auto w-full px-4 md:px-6 py-6 md:py-10 space-y-8 md:space-y-12">
        
        {stats?.playerOfTheDay && <PlayerOfTheDay playerName={stats.playerOfTheDay} />}

        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <Tabs defaultValue="doubles" className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <TabsList className="bg-card p-1.5 border border-border/50 rounded-2xl h-auto shadow-sm">
                <TabsTrigger value="doubles" className="rounded-xl px-6 py-2 text-sm font-medium active:scale-[0.96] transition-transform">Doubles</TabsTrigger>
                <TabsTrigger value="duos" className="rounded-xl px-6 py-2 text-sm font-medium active:scale-[0.96] transition-transform">Partnerships</TabsTrigger>
                <TabsTrigger value="singles" className="rounded-xl px-6 py-2 text-sm font-medium active:scale-[0.96] transition-transform">Singles</TabsTrigger>
              </TabsList>

              <Popover open={popoverOpen} onOpenChange={(open) => { setPopoverOpen(open); if (!open) setShowCalendar(false); }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-xl border-border/50 min-h-10 px-4 min-w-[180px] justify-between shadow-sm bg-card active:scale-[0.96] transition-transform">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Filter className="h-4 w-4 opacity-60 shrink-0" />
                      {timePeriod === "custom" && customDateRange.from && customDateRange.to
                        ? `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`
                        : timePeriod.toUpperCase().replace('-', ' ')}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-40 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-2 max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border-border/50 bg-card">
                  {!showCalendar || timePeriod !== "custom" ? (
                    <div className="grid p-1 w-44 gap-1">
                      {["today", "yesterday", "7d", "15d", "this-month", "last-month", "30d", "60d", "365d", "all"].map((p) => (
                        <Button key={p} variant={timePeriod === p ? "secondary" : "ghost"} className="justify-start rounded-xl font-medium text-xs hover:bg-accent/50 active:scale-[0.96] transition-transform" onClick={() => { setTimePeriod(p as any); setShowCalendar(false); }}>
                          {p === 'all' ? 'All Time' : p.replace('-', ' ')}
                        </Button>
                      ))}
                      <div className="border-t my-1 mx-2 border-border/50" />
                      <Button variant={timePeriod === "custom" ? "secondary" : "ghost"} className="justify-start gap-2 rounded-xl font-medium text-xs hover:bg-accent/50 active:scale-[0.96] transition-transform" onClick={() => { setShowCalendar(true); setTimePeriod("custom"); }}>
                        <CalendarIcon className="h-4 w-4 shrink-0" /> Custom Range
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium pl-2">Select Date Range</h4>
                        <Button variant="ghost" size="icon" className="hover:bg-accent/50 rounded-xl min-h-10 min-w-10 active:scale-[0.96] transition-transform" onClick={() => { setShowCalendar(false); if (!customDateRange.from || !customDateRange.to) setTimePeriod("30d"); }}>
                            <ChevronLeft className="w-4 h-4 shrink-0" />
                        </Button>
                      </div>
                      <Calendar
                        mode="range"
                        defaultMonth={customDateRange.from || new Date()}
                        selected={{ from: customDateRange.from, to: customDateRange.to }}
                        onSelect={(range) => {
                          setCustomDateRange({ from: range?.from, to: range?.to });
                          if (range?.from && range?.to) { setTimePeriod("custom"); setShowCalendar(false); }
                        }}
                        numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                        toDate={new Date()}
                        className="rounded-xl"
                      />
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <TabsContent value="doubles">{renderContent(stats?.doubles, "Doubles", stats?.totalDoublesAllTime || 0)}</TabsContent>
            <TabsContent value="duos">{renderDuoContent(stats?.duos)}</TabsContent>
            <TabsContent value="singles">{renderContent(stats?.singles, "Singles", stats?.totalSinglesAllTime || 0)}</TabsContent>
          </Tabs>
        </section>

        <Card className="rounded-2xl border-border/50 shadow-sm bg-card">
          <CardHeader className="pb-4">
            <CardDescription>Click to view deep analytics for individual players</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allPlayers.map((player) => (
                <Button key={player} variant="outline" className="rounded-xl min-h-10 px-5  hover:border-primary transition-colors shadow-none border-border/60 bg-card active:scale-[0.96]" onClick={() => goToPlayer(player)}>
                  {player}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ title, value, sub, icon, onClick }: any) {
  return (
    <Card className={cn("rounded-2xl border border-border/50 bg-card shadow-sm p-5 sm:p-6 flex flex-col justify-between h-full min-h-[120px]", onClick && "cursor-pointer hover:bg-muted/50 active:scale-[0.96] transition-[transform,colors] duration-200")} onClick={onClick}>
      <div className="flex items-center justify-between space-y-0 pb-2">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</span>
        <div className="opacity-40 shrink-0">{icon}</div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">{value}</div>
        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1 truncate">{sub}</p>
      </div>
    </Card>
  );
}

function LeaderboardCard({ title, data, isDark, getPlayerColor, colorIndex, goToPlayer }: any) {
  return (
    <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
      <CardHeader><CardTitle className="text-balance">{title}</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={{ value: { label: "Value", color: getPlayerColor(colorIndex, isDark) } }} className="h-[250px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 40 }}>
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} className="text-xs font-medium" />
            <XAxis type="number" hide />
            <ChartTooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null; const d = payload[0].payload;
              return (
                <div className="bg-card border border-border/50 rounded-xl p-3 shadow-sm text-sm">
                  <p className="font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => goToPlayer(d.name)}>{d.name} →</p>
                  <p className="text-muted-foreground mt-2">Total: <span className="text-foreground font-medium tabular-nums">{d.value}</span></p>
                </div>
              );
            }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
              <LabelList dataKey="value" position="right" className="fill-foreground text-xs tabular-nums" />
              {data.map((e: any, i: number) => <Cell key={i} fill={getPlayerColor(i, isDark)} />)}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function DuoBarChart({ data, isDark, getPlayerColor, goToPlayer }: any) {
  return (
    <ChartContainer config={{ value: { label: "Value", color: "hsl(var(--primary))" } }} className="h-[300px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 50 }}>
        <YAxis dataKey="shortName" type="category" tickLine={false} axisLine={false} width={60} className="text-xs font-medium" />
        <XAxis type="number" hide />
        <ChartTooltip content={({ active, payload }) => {
          if (!active || !payload?.length) return null; const d = payload[0].payload;
          return (
            <div className="bg-card border border-border/50 rounded-xl p-3 shadow-sm text-sm">
              <p className="font-semibold">{d.name}</p>
              <div className="space-y-1 mt-2">
                 <p className="text-muted-foreground">Value: <span className="text-foreground font-medium tabular-nums">{d.value}</span></p>
                 <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => goToPlayer(d.player1)}>{d.player1}</span> & <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => goToPlayer(d.player2)}>{d.player2}</span>
                 </div>
              </div>
            </div>
          );
        }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
          <LabelList dataKey="value" position="right" className="fill-foreground text-xs tabular-nums" />
          {data.map((e: any, i: number) => <Cell key={i} fill={getPlayerColor(i, isDark)} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}



function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-card overflow-x-hidden">
      <Navbar title="Analytics" />
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 py-6 md:py-10 space-y-8 md:space-y-12">
        <Skeleton className="h-12 w-64 rounded-2xl bg-card border border-border/50" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-[120px] rounded-2xl bg-card border border-border/50" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[400px]">
          <Skeleton className="col-span-1 md:col-span-6 rounded-2xl bg-card border border-border/50" />
          <Skeleton className="col-span-1 md:col-span-6 rounded-2xl bg-card border border-border/50" />
        </div>
      </div>
    </div>
  );
}