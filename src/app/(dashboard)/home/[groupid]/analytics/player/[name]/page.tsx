"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar"; // Using Navbar instead of Header
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { MatchCalendar } from "@/components/match-calendar";
import { StatRadar } from "@/components/stat-cross";
import { useColorMode } from "@/components/color-mode-provider";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Match } from "@/types/match";
import { computePlayerWinRateTotals, computeWinRatePercent } from "@/lib/win-rate";

type MatchFilter = "all" | "doubles" | "singles";

interface PlayerStats {
  name: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  effectiveWinRate: number;
  totalPoints: number;
  avgPoints: number;
  currentStreak: { type: "win" | "loss" | "none"; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
  last5: ("W" | "L")[];
  recentResults: ("W" | "L")[];
  form: "hot" | "cold" | "neutral";
  formWinRate: number;
  headToHead: Record<string, { wins: number; losses: number; matches: number }>;
  partners: Record<string, { wins: number; losses: number; matches: number }>;
  nemesis: { name: string; losses: number } | null;
  favoriteVictim: { name: string; wins: number } | null;
  bestPartner: { name: string; winRate: number; matches: number } | null;
  performanceByDay: {
    day: string;
    wins: number;
    losses: number;
    matches: number;
    winRate: number;
  }[];
  monthlyTrend: { month: string; winRate: number; matches: number }[];
  winRateOverTime: { date: string; winRate: number; matches: number }[];
  matchesByDate: { date: string; count: number }[];
  dailyBonusPoints: { date: string; bonus: number }[];
  totalBonusPoints: number;
}

function filterMatchesByType(matches: Match[], filter: MatchFilter): Match[] {
  if (filter === "all") return matches;
  return matches.filter((m) => {
    const totalPlayers = m.team1.players.length + m.team2.players.length;
    if (filter === "doubles") return totalPlayers === 4;
    return totalPlayers <= 3;
  });
}

function calculatePlayerStats(
  playerName: string,
  matches: Match[],
  filter: MatchFilter = "all",
  strictMode: boolean = false,
): PlayerStats {
  const filteredMatches = filterMatchesByType(matches, filter);
  const playerMatches = filteredMatches
    .filter(
      (m) =>
        m.team1.players.some((p) => p.name?.trim() === playerName) ||
        m.team2.players.some((p) => p.name?.trim() === playerName),
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  // Compute effective win rate using bonus weighting
  const winRateTotals = computePlayerWinRateTotals(filteredMatches, {
    bonusWeightedDoubles: { strictMode },
  });
  const effectiveWinRate = computeWinRatePercent(winRateTotals[playerName.trim()] || { rawMatches: 0, rawWins: 0, effectiveMatches: 0, effectiveWins: 0 }, 3);

  let wins = 0;
  let losses = 0;
  let totalPoints = 0;
  const headToHead: Record<
    string,
    { wins: number; losses: number; matches: number }
  > = {};
  const partners: Record<
    string,
    { wins: number; losses: number; matches: number }
  > = {};
  const dayStats: Record<string, { wins: number; losses: number }> = {
    Sun: { wins: 0, losses: 0 },
    Mon: { wins: 0, losses: 0 },
    Tue: { wins: 0, losses: 0 },
    Wed: { wins: 0, losses: 0 },
    Thu: { wins: 0, losses: 0 },
    Fri: { wins: 0, losses: 0 },
    Sat: { wins: 0, losses: 0 },
  };
  const monthlyStats: Record<string, { wins: number; losses: number }> = {};
  const dailyWinRate: { date: string; wins: number; matches: number }[] = [];
  const matchesByDate: Record<string, number> = {};
  const dailyBonusMap: Record<string, number> = {};
  let totalBonusPoints = 0;

  let tempWinStreak = 0;
  let tempLossStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentStreak = { type: "none" as "win" | "loss" | "none", count: 0 };

  playerMatches.forEach((match, idx) => {
    const isTeam1 = match.team1.players.some(
      (p) => p.name?.trim() === playerName,
    );
    const myTeam = isTeam1 ? match.team1 : match.team2;
    const oppTeam = isTeam1 ? match.team2 : match.team1;
    const isWinner =
      (isTeam1 && match.winner === "team1") ||
      (!isTeam1 && match.winner === "team2");

    totalPoints += myTeam.score;

    if (isWinner) {
      wins++;
      tempWinStreak++;
      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
      tempLossStreak = 0;
    } else {
      losses++;
      tempLossStreak++;
      longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
      tempWinStreak = 0;
    }

    if (idx === playerMatches.length - 1) {
      if (tempWinStreak > 0)
        currentStreak = { type: "win", count: tempWinStreak };
      else if (tempLossStreak > 0)
        currentStreak = { type: "loss", count: tempLossStreak };
    }

    oppTeam.players.forEach((opp) => {
      if (!opp.name) return;
      const oppName = opp.name.trim();
      if (!headToHead[oppName])
        headToHead[oppName] = { wins: 0, losses: 0, matches: 0 };
      headToHead[oppName].matches++;
      if (isWinner) headToHead[oppName].wins++;
      else headToHead[oppName].losses++;
    });

    myTeam.players.forEach((p) => {
      if (!p.name) return;
      const pName = p.name.trim();
      if (pName === playerName) return;
      if (!partners[pName])
        partners[pName] = { wins: 0, losses: 0, matches: 0 };
      partners[pName].matches++;
      if (isWinner) partners[pName].wins++;
      else partners[pName].losses++;
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = dayNames[new Date(match.createdAt).getDay()];
    if (isWinner) dayStats[day].wins++;
    else dayStats[day].losses++;

    const monthKey = new Date(match.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
    if (!monthlyStats[monthKey])
      monthlyStats[monthKey] = { wins: 0, losses: 0 };
    if (isWinner) monthlyStats[monthKey].wins++;
    else monthlyStats[monthKey].losses++;

    const dateKey = match.createdAt.split("T")[0];
    matchesByDate[dateKey] = (matchesByDate[dateKey] || 0) + 1;
    const existing = dailyWinRate.find((d) => d.date === dateKey);
    if (existing) {
      existing.matches++;
      if (isWinner) existing.wins++;
    } else {
      dailyWinRate.push({ date: dateKey, wins: isWinner ? 1 : 0, matches: 1 });
    }

    // Track bonus points for this player
    const myPlayer = myTeam.players.find((p) => p.name?.trim() === playerName);
    if (myPlayer?.bonusPoints) {
      dailyBonusMap[dateKey] =
        (dailyBonusMap[dateKey] || 0) + myPlayer.bonusPoints;
      totalBonusPoints += myPlayer.bonusPoints;
    }
  });

  const last5 = playerMatches.slice(-5).map((match) => {
    const isTeam1 = match.team1.players.some(
      (p) => p.name?.trim() === playerName,
    );
    const isWinner =
      (isTeam1 && match.winner === "team1") ||
      (!isTeam1 && match.winner === "team2");
    return isWinner ? "W" : "L";
  }) as ("W" | "L")[];

  const recentResults = playerMatches.slice(-20).map((match) => {
    const isTeam1 = match.team1.players.some(
      (p) => p.name?.trim() === playerName,
    );
    const isWinner =
      (isTeam1 && match.winner === "team1") ||
      (!isTeam1 && match.winner === "team2");
    return isWinner ? "W" : "L";
  }) as ("W" | "L")[];

  const last5Wins = last5.filter((r) => r === "W").length;
  const formWinRate = last5.length > 0 ? (last5Wins / last5.length) * 100 : 0;
  const overallWinRate =
    playerMatches.length > 0 ? (wins / playerMatches.length) * 100 : 0;
  let form: "hot" | "cold" | "neutral" = "neutral";
  if (last5.length >= 3) {
    if (formWinRate >= overallWinRate + 15) form = "hot";
    else if (formWinRate <= overallWinRate - 15) form = "cold";
  }

  let nemesis: { name: string; losses: number } | null = null;
  Object.entries(headToHead).forEach(([name, stats]) => {
    if (stats.losses >= 2 && (!nemesis || stats.losses > nemesis.losses)) {
      nemesis = { name, losses: stats.losses };
    }
  });

  let favoriteVictim: { name: string; wins: number } | null = null;
  Object.entries(headToHead).forEach(([name, stats]) => {
    if (
      stats.wins >= 2 &&
      (!favoriteVictim || stats.wins > favoriteVictim.wins)
    ) {
      favoriteVictim = { name, wins: stats.wins };
    }
  });

  let bestPartner: { name: string; winRate: number; matches: number } | null =
    null;
  Object.entries(partners).forEach(([name, stats]) => {
    if (stats.matches >= 2) {
      const wr = (stats.wins / stats.matches) * 100;
      if (!bestPartner || wr > bestPartner.winRate) {
        bestPartner = {
          name,
          winRate: parseFloat(wr.toFixed(1)),
          matches: stats.matches,
        };
      }
    }
  });

  const performanceByDay = Object.entries(dayStats).map(([day, stats]) => ({
    day,
    wins: stats.wins,
    losses: stats.losses,
    matches: stats.wins + stats.losses,
    winRate:
      stats.wins + stats.losses > 0
        ? parseFloat(
            ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1),
          )
        : 0,
  }));

  const monthlyTrend = Object.entries(monthlyStats)
    .map(([month, stats]) => ({
      month,
      winRate: parseFloat(
        ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1),
      ),
      matches: stats.wins + stats.losses,
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  let cumWins = 0;
  let cumMatches = 0;
  const winRateOverTime = dailyWinRate.map((d) => {
    cumWins += d.wins;
    cumMatches += d.matches;
    return {
      date: d.date,
      winRate: parseFloat(((cumWins / cumMatches) * 100).toFixed(1)),
      matches: cumMatches,
    };
  });

  // Build daily bonus points array
  const dailyBonusPoints = Object.entries(dailyBonusMap)
    .map(([date, bonus]) => ({ date, bonus }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    name: playerName,
    totalMatches: playerMatches.length,
    wins,
    losses,
    winRate: parseFloat(overallWinRate.toFixed(1)),
    effectiveWinRate,
    totalPoints,
    avgPoints:
      playerMatches.length > 0
        ? parseFloat((totalPoints / playerMatches.length).toFixed(1))
        : 0,
    currentStreak,
    longestWinStreak,
    longestLossStreak,
    last5,
    recentResults,
    form,
    formWinRate: parseFloat(formWinRate.toFixed(1)),
    headToHead,
    partners,
    nemesis,
    favoriteVictim,
    bestPartner,
    performanceByDay,
    monthlyTrend,
    winRateOverTime,
    matchesByDate: Object.entries(matchesByDate).map(([date, count]) => ({
      date,
      count,
    })),
    dailyBonusPoints,
    totalBonusPoints,
  };
}

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupid as string; // FIX 1: Extract the groupId
  const playerName = decodeURIComponent(params.name as string);

  const [matches, setMatches] = useState<Match[]>([]);
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [comparePlayer, setComparePlayer] = useState<string>("");
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [strictMode, setStrictMode] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const fetchData = async () => {
      try {
        // FIX 2: Group specific caching
        const cacheKey = `badminton_analytics_matches_${groupId}`;
        const stored = localStorage.getItem(cacheKey);
        let loadedFromCache = false;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.matches) {
              setMatches(parsed.matches);
              setStrictMode(parsed.strictMode || false);
              const players = new Set<string>();
              parsed.matches.forEach((m: Match) => {
                m.team1.players.forEach(
                  (p) => p.name && players.add(p.name.trim()),
                );
                m.team2.players.forEach(
                  (p) => p.name && players.add(p.name.trim()),
                );
              });
              setAllPlayers(Array.from(players).sort());
              setLoading(false);
              loadedFromCache = true;
            }
          } catch (e) {
            console.error(e);
          }
        }

        // FIX 3: Add ?groupId= to the API fetch
        if (!loadedFromCache) {
            const res = await fetch(`/api/analytics?groupId=${groupId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.matches) {
                  setMatches(data.matches);
                  setStrictMode(data.strictMode || false);
                  localStorage.setItem(
                    cacheKey,
                    JSON.stringify({ matches: data.matches, strictMode: data.strictMode }),
                  );
    
                  const players = new Set<string>();
                  data.matches.forEach((m: Match) => {
                    m.team1.players.forEach(
                      (p) => p.name && players.add(p.name.trim()),
                    );
                    m.team2.players.forEach(
                      (p) => p.name && players.add(p.name.trim()),
                    );
                  });
                  setAllPlayers(Array.from(players).sort());
                }
            }
        }
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId]);

  const matchCounts = useMemo(() => {
    const playerMatches = matches.filter(
      (m) =>
        m.team1.players.some((p) => p.name?.trim() === playerName) ||
        m.team2.players.some((p) => p.name?.trim() === playerName),
    );
    const doubles = playerMatches.filter((m) => {
      const totalPlayers = m.team1.players.length + m.team2.players.length;
      return totalPlayers === 4;
    }).length;
    return {
      all: playerMatches.length,
      doubles,
      singles: playerMatches.length - doubles,
    };
  }, [matches, playerName]);

  const stats = useMemo(
    () => calculatePlayerStats(playerName, matches, matchFilter, strictMode),
    [playerName, matches, matchFilter, strictMode],
  );
  const compareStats = useMemo(
    () =>
      comparePlayer
        ? calculatePlayerStats(comparePlayer, matches, matchFilter, strictMode)
        : null,
    [comparePlayer, matches, matchFilter, strictMode],
  );

  const sortedH2H = Object.entries(stats.headToHead)
    .map(([name, data]) => ({
      name,
      ...data,
      winRate: data.matches > 0 ? (data.wins / data.matches) * 100 : 0,
    }))
    .sort((a, b) => b.matches - a.matches);

  const sortedPartners = Object.entries(stats.partners)
    .map(([name, data]) => ({
      name,
      ...data,
      winRate: data.matches > 0 ? (data.wins / data.matches) * 100 : 0,
    }))
    .sort((a, b) => b.matches - a.matches);

  // FIX 4: Correct routing to include the dynamic groupId
  const backLink = `/home/${groupId}/analytics`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <main className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </main>
      </div>
    );
  }

  if (!allPlayers.includes(playerName)) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar title="Player Not Found" />
        <main className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
          <Link
            href={backLink}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Analytics
          </Link>
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">Player not found</p>
          </div>
        </main>
      </div>
    );
  }

  const formIcon =
    stats.form === "hot" ? (
      <TrendingUp className="h-4 w-4" />
    ) : stats.form === "cold" ? (
      <TrendingDown className="h-4 w-4" />
    ) : (
      <Minus className="h-4 w-4" />
    );

  const displayedResults = showAllRecent ? stats.recentResults : stats.last5;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <main className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analytics
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{playerName}</h1>
          {strictMode && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
              Strict Mode
            </Badge>
          )}
        </div>

        {/* Stats Header */}
        <div className="mb-8">
          <p className="text-muted-foreground">
            {stats.totalMatches} {matchFilter !== "all" ? matchFilter : ""}{" "}
            matches played
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={matchFilter === "all" ? "default" : "outline"}
            onClick={() => setMatchFilter("all")}
          >
            All ({matchCounts.all})
          </Button>
          <Button
            variant={matchFilter === "doubles" ? "default" : "outline"}
            onClick={() => setMatchFilter("doubles")}
            disabled={matchCounts.doubles === 0}
          >
            Doubles ({matchCounts.doubles})
          </Button>
          <Button
            variant={matchFilter === "singles" ? "default" : "outline"}
            onClick={() => setMatchFilter("singles")}
            disabled={matchCounts.singles === 0}
          >
            Singles ({matchCounts.singles})
          </Button>

          <div className="ml-auto">
            <Select
              value={comparePlayer || "none"}
              onValueChange={(v) => setComparePlayer(v === "none" ? "" : v)}
            >
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder="Compare…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No comparison</SelectItem>
                {allPlayers
                  .filter((p) => p !== playerName)
                  .map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {stats.totalMatches === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No {matchFilter !== "all" ? matchFilter : ""} matches found
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Radar */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <StatRadar
                  stats={{
                    top: { label: "Win%", value: stats.effectiveWinRate, max: 100 },
                    right: { label: "Pts", value: stats.avgPoints, max: 30 },
                    bottom: {
                      label: "Wins",
                      value: stats.wins,
                      max: Math.max(stats.wins, stats.losses, 10),
                    },
                    left: {
                      label: "Games",
                      value: stats.totalMatches,
                      max: Math.max(stats.totalMatches, 20),
                    },
                  }}
                />
                {compareStats && (
                  <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
                    vs {comparePlayer}: {compareStats.effectiveWinRate}% win rate,{" "}
                    {compareStats.wins}–{compareStats.losses}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Last 5 + Form */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-muted-foreground">
                        Recent Matches
                      </p>
                      <span className="text-xs text-muted-foreground">
                        (oldest → newest)
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {displayedResults.length > 0 ? (
                        displayedResults.map((result, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center justify-center w-8 h-8 text-sm font-medium border ${
                              result === "W"
                                ? "bg-foreground text-background"
                                : "bg-background text-foreground"
                            }`}
                          >
                            {result}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No recent matches
                        </span>
                      )}
                    </div>
                    {stats.recentResults.length > stats.last5.length && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 px-2 text-xs"
                        onClick={() => setShowAllRecent((prev) => !prev)}
                      >
                        {showAllRecent ? "Show fewer" : "Show more"}
                        {showAllRecent ? (
                          <ChevronUp className="ml-1 h-3 w-3" />
                        ) : (
                          <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Form</p>
                    <div className="flex items-center gap-2 justify-end">
                      {formIcon}
                      <span className="font-mono">{stats.formWinRate}%</span>
                      <span className="text-xs text-muted-foreground">
                        ({stats.formWinRate > stats.winRate ? "+" : ""}
                        {(stats.formWinRate - stats.winRate).toFixed(0)}% vs
                        avg)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Match Activity Calendar */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base">Match Activity</CardTitle>
              </CardHeader>
              <CardContent className="lg:flex lg:justify-center">
                <MatchCalendar data={stats.matchesByDate} />
              </CardContent>
            </Card>

            {/* Highlights */}
            {(stats.bestPartner || stats.nemesis || stats.favoriteVictim) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {stats.bestPartner && (
                  <Card className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => router.push(`/home/${groupId}/analytics/player/${encodeURIComponent(stats.bestPartner!.name)}`)}>
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground mb-1">
                        Best Partner
                      </p>
                      <Link
                        href={`/home/${groupId}/analytics/player/${encodeURIComponent(stats.bestPartner.name)}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {stats.bestPartner.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stats.bestPartner.winRate}% win rate (
                        {stats.bestPartner.matches} games)
                      </p>
                    </CardContent>
                  </Card>
                )}

                {stats.favoriteVictim && (
                  <Card className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => router.push(`/home/${groupId}/analytics/player/${encodeURIComponent(stats.favoriteVictim!.name)}`)}>
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground mb-1">
                        Most Wins Against
                      </p>
                      <Link
                        href={`/home/${groupId}/analytics/player/${encodeURIComponent(stats.favoriteVictim.name)}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {stats.favoriteVictim.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stats.favoriteVictim.wins} wins
                      </p>
                    </CardContent>
                  </Card>
                )}

                {stats.nemesis && (
                  <Card className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => router.push(`/home/${groupId}/analytics/player/${encodeURIComponent(stats.nemesis!.name)}`)}>
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground mb-1">
                        Nemesis
                      </p>
                      <Link
                        href={`/home/${groupId}/analytics/player/${encodeURIComponent(stats.nemesis.name)}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {stats.nemesis.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stats.nemesis.losses} losses
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Tabs for detailed stats */}
            <Tabs defaultValue="opponents" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-6">
                <TabsTrigger value="opponents">Opponents</TabsTrigger>
                <TabsTrigger value="partners">Partners</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="days">Days</TabsTrigger>
              </TabsList>

              <TabsContent value="opponents">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Head-to-Head</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sortedH2H.length > 0 ? (
                      <div className="space-y-3">
                        {sortedH2H.map((opp) => (
                          <div
                            key={opp.name}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <Link
                              href={`/home/${groupId}/analytics/player/${encodeURIComponent(opp.name)}`}
                              className="font-medium hover:underline"
                            >
                              {opp.name}
                            </Link>
                            <div className="text-right">
                              <span className="font-mono text-sm">
                                {opp.wins}W – {opp.losses}L
                              </span>
                              <span className="text-muted-foreground text-sm ml-3">
                                {opp.winRate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No opponent data
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="partners">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Partner Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sortedPartners.length > 0 ? (
                      <div className="space-y-3">
                        {sortedPartners.map((partner) => (
                          <div
                            key={partner.name}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/home/${groupId}/analytics/player/${encodeURIComponent(partner.name)}`}
                                className="font-medium hover:underline"
                              >
                                {partner.name}
                              </Link>
                              {stats.bestPartner?.name === partner.name && (
                                <span className="text-xs text-muted-foreground">
                                  ★
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-sm">
                                {partner.wins}W – {partner.losses}L
                              </span>
                              <span className="text-muted-foreground text-sm ml-3">
                                {partner.winRate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No partner data (singles only)
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Win Rate Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.winRateOverTime.length > 1 ? (
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.winRateOverTime}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="var(--border)"
                              />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10 }}
                                tickFormatter={(v) =>
                                  new Date(v).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })
                                }
                                stroke="var(--muted-foreground)"
                              />
                              <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 10 }}
                                tickFormatter={(v) => `${v}%`}
                                stroke="var(--muted-foreground)"
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null;
                                  const d = payload[0].payload;
                                  return (
                                    <div className="bg-background border p-2 text-xs">
                                      <p className="font-medium">
                                        {new Date(d.date).toLocaleDateString()}
                                      </p>
                                      <p>
                                        {d.winRate}% after {d.matches} matches
                                      </p>
                                    </div>
                                  );
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="winRate"
                                stroke="var(--foreground)"
                                strokeWidth={1.5}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Not enough data
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Monthly Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.monthlyTrend.length > 0 ? (
                        <div className="h-[180px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.monthlyTrend}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="var(--border)"
                              />
                              <XAxis
                                dataKey="month"
                                tick={{ fontSize: 10 }}
                                stroke="var(--muted-foreground)"
                              />
                              <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 10 }}
                                tickFormatter={(v) => `${v}%`}
                                stroke="var(--muted-foreground)"
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null;
                                  const d = payload[0].payload;
                                  return (
                                    <div className="bg-background border p-2 text-xs">
                                      <p className="font-medium">{d.month}</p>
                                      <p>
                                        {d.winRate}% ({d.matches} matches)
                                      </p>
                                    </div>
                                  );
                                }}
                              />
                              <Bar dataKey="winRate" fill="var(--foreground)" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No monthly data
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Daily Bonus Points Chart */}
                  {stats.dailyBonusPoints.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Daily Bonus Points
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Total:{" "}
                          <span
                            className={`font-medium ${stats.totalBonusPoints >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                          >
                            {stats.totalBonusPoints >= 0 ? "+" : ""}
                            {stats.totalBonusPoints}
                          </span>
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[180px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dailyBonusPoints}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="var(--border)"
                              />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10 }}
                                stroke="var(--muted-foreground)"
                                tickFormatter={(v) =>
                                  new Date(v).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })
                                }
                              />
                              <YAxis
                                tick={{ fontSize: 10 }}
                                stroke="var(--muted-foreground)"
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null;
                                  const d = payload[0].payload;
                                  const dateStr = new Date(
                                    d.date,
                                  ).toLocaleDateString(undefined, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  });
                                  return (
                                    <div className="bg-background border p-2 text-xs">
                                      <p className="font-medium">{dateStr}</p>
                                      <p
                                        className={`font-medium ${d.bonus >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                                      >
                                        {d.bonus >= 0 ? "+" : ""}
                                        {d.bonus} bonus points
                                      </p>
                                    </div>
                                  );
                                }}
                              />
                              <Bar dataKey="bonus" radius={4}>
                                {stats.dailyBonusPoints.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      entry.bonus >= 0
                                        ? "hsl(142, 70%, 45%)"
                                        : "hsl(0, 70%, 55%)"
                                    }
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="days">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Performance by Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] w-full mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.performanceByDay}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--border)"
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11 }}
                            stroke="var(--muted-foreground)"
                          />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            stroke="var(--muted-foreground)"
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-background border p-2 text-xs">
                                  <p className="font-medium">{d.day}</p>
                                  <p>
                                    {d.wins}W – {d.losses}L ({d.winRate}%)
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Bar
                            dataKey="wins"
                            stackId="a"
                            fill="var(--foreground)"
                          />
                          <Bar
                            dataKey="losses"
                            stackId="a"
                            fill="var(--muted)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Best/Worst Day */}
                    {(() => {
                      const daysWithMatches = stats.performanceByDay.filter(
                        (d) => d.matches > 0,
                      );
                      if (daysWithMatches.length === 0) return null;
                      const bestDay = daysWithMatches.reduce((a, b) =>
                        a.winRate > b.winRate ? a : b,
                      );
                      const worstDay = daysWithMatches.reduce((a, b) =>
                        a.winRate < b.winRate ? a : b,
                      );
                      return (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Best Day
                            </p>
                            <p className="font-medium">{bestDay.day}</p>
                            <p className="text-sm text-muted-foreground">
                              {bestDay.winRate}% ({bestDay.matches} games)
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Worst Day
                            </p>
                            <p className="font-medium">{worstDay.day}</p>
                            <p className="text-sm text-muted-foreground">
                              {worstDay.winRate}% ({worstDay.matches} games)
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Comparison Section */}
            {compareStats && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-base">
                    {playerName} vs {comparePlayer}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        Win Rate
                      </p>
                      <p className="font-mono">
                        <span
                          className={
                            stats.winRate > compareStats.winRate
                              ? "font-bold"
                              : ""
                          }
                        >
                          {stats.winRate}%
                        </span>
                        <span className="text-muted-foreground mx-2">vs</span>
                        <span
                          className={
                            compareStats.winRate > stats.winRate
                              ? "font-bold"
                              : ""
                          }
                        >
                          {compareStats.winRate}%
                        </span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Wins</p>
                      <p className="font-mono">
                        <span
                          className={
                            stats.wins > compareStats.wins ? "font-bold" : ""
                          }
                        >
                          {stats.wins}
                        </span>
                        <span className="text-muted-foreground mx-2">vs</span>
                        <span
                          className={
                            compareStats.wins > stats.wins ? "font-bold" : ""
                          }
                        >
                          {compareStats.wins}
                        </span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        Avg Points
                      </p>
                      <p className="font-mono">
                        <span
                          className={
                            stats.avgPoints > compareStats.avgPoints
                              ? "font-bold"
                              : ""
                          }
                        >
                          {stats.avgPoints}
                        </span>
                        <span className="text-muted-foreground mx-2">vs</span>
                        <span
                          className={
                            compareStats.avgPoints > stats.avgPoints
                              ? "font-bold"
                              : ""
                          }
                        >
                          {compareStats.avgPoints}
                        </span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        Best Streak
                      </p>
                      <p className="font-mono">
                        <span
                          className={
                            stats.longestWinStreak >
                            compareStats.longestWinStreak
                              ? "font-bold"
                              : ""
                          }
                        >
                          {stats.longestWinStreak}W
                        </span>
                        <span className="text-muted-foreground mx-2">vs</span>
                        <span
                          className={
                            compareStats.longestWinStreak >
                            stats.longestWinStreak
                              ? "font-bold"
                              : ""
                          }
                        >
                          {compareStats.longestWinStreak}W
                        </span>
                      </p>
                    </div>
                  </div>

                  {stats.headToHead[comparePlayer] && (
                    <div className="mt-6 pt-6 border-t text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        Head-to-Head
                      </p>
                      <p className="text-2xl font-mono font-bold">
                        {stats.headToHead[comparePlayer].wins} –{" "}
                        {stats.headToHead[comparePlayer].losses}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}