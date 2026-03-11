"use client";
import { useState, useEffect, useMemo } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Medal,
  Filter,
  ChevronDown,
  Users,
  User,
  Calculator
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
  LabelList
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { Match } from "@/types/match";

export default function AnalyticsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<
    "7d" | "30d" | "60d" | "90d" | "6m" | "1y" | "today" | "all"
  >("30d");
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const data = await res.json();
          if (data.matches) {
             setMatches(data.matches);
             localStorage.setItem("badminton_analytics_matches", JSON.stringify(data.matches));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    const init = async () => {
      const stored = localStorage.getItem("badminton_analytics_matches");
      let loadedFromCache = false;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setMatches(parsed);
          setLoading(false);
          loadedFromCache = true;
        } catch (e) {
          console.error(e);
        }
      }
      fetchStats(loadedFromCache);
    };
    init();
  }, []);

  const stats = useMemo(() => {
    if (!matches.length) return null;

    // 1. Filter by Time Period
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const filteredMatches = matches.filter(m => {
        if (timePeriod === 'all') return true;
        const matchDate = new Date(m.createdAt);
        const diffTime = Math.abs(now.getTime() - matchDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (timePeriod === 'today') return m.createdAt.startsWith(todayStr);
        if (timePeriod === '7d') return diffDays <= 7;
        if (timePeriod === '30d') return diffDays <= 30;
        if (timePeriod === '60d') return diffDays <= 60;
        if (timePeriod === '90d') return diffDays <= 90;
        if (timePeriod === '6m') return diffDays <= 180;
        if (timePeriod === '1y') return diffDays <= 365;
        return true;
    });

    // 2. Helper to calculate stats for a subset
    const calculateSubsetStats = (subset: Match[]) => {
        const playerStats: Record<string, { wins: number, losses: number, points: number, matches: number, bonusPoints: number }> = {};
        
        const update = (name: string, isWinner: boolean, points: number, bonus: number) => {
            if (!name) return;
            const n = name.trim();
            if (!playerStats[n]) playerStats[n] = { wins: 0, losses: 0, points: 0, matches: 0, bonusPoints: 0 };
            playerStats[n].matches++;
            playerStats[n].points += points;
            playerStats[n].bonusPoints += bonus;
            if (isWinner) playerStats[n].wins++; else playerStats[n].losses++;
        };

        subset.forEach(m => {
            const isT1 = m.winner === 'team1';
            const isT2 = m.winner === 'team2';
            m.team1.players.forEach(p => update(p.name, isT1, m.team1.score + (p.bonusPoints || 0), p.bonusPoints || 0));
            m.team2.players.forEach(p => update(p.name, isT2, m.team2.score + (p.bonusPoints || 0), p.bonusPoints || 0));
        });

        // Transform to arrays
        const players = Object.keys(playerStats);
        
        // Win Rates (Min 3 matches)
        const winRates = players
            .map(name => {
                const s = playerStats[name];
                return {
                    name,
                    value: s.matches >= 3 ? parseFloat(((s.wins / s.matches) * 100).toFixed(1)) : 0,
                    wins: s.wins,
                    matches: s.matches,
                    losses: s.losses
                };
            })
            .filter(p => p.matches >= 3)
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // Average Points (Min 3 matches)
        const avgPoints = players
            .map(name => {
                const s = playerStats[name];
                return {
                    name,
                    value: s.matches >= 3 ? parseFloat((s.points / s.matches).toFixed(1)) : 0,
                    matches: s.matches,
                    totalPoints: s.points
                };
            })
            .filter(p => p.matches >= 3)
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // Most Wins
        const mostWins = players
            .map(name => ({ name, value: playerStats[name].wins }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // Most Points (Total)
        const mostPoints = players
            .map(name => ({ name, value: playerStats[name].points }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // Bonus Points
        const mostBonusPoints = players
            .filter(name => playerStats[name].bonusPoints !== 0)
            .map(name => ({ name, value: playerStats[name].bonusPoints }))
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
            .slice(0, 10);

        // Points Progression
        // Get top 5 players by Wins (to show most relevant players)
        const top5 = mostWins.slice(0, 5).map(p => p.name);
        const dates = Array.from(new Set(subset.map(m => m.createdAt.split('T')[0]))).sort();
        
        const winRateOverTime = dates.map(date => {
            const entry: any = { date };
            top5.forEach(player => {
                let wins = 0;
                let matchesCount = 0;
                subset.forEach(m => {
                    if (m.createdAt.split('T')[0] <= date) {
                        const p1 = m.team1.players.find(p => p.name === player);
                        const p2 = m.team2.players.find(p => p.name === player);
                        
                        if (p1 || p2) {
                            matchesCount++;
                            if (p1 && m.winner === 'team1') wins++;
                            if (p2 && m.winner === 'team2') wins++;
                        }
                    }
                });
                entry[player] = matchesCount > 0 ? parseFloat(((wins / matchesCount) * 100).toFixed(1)) : 0;
            });
            return entry;
        });

        // Activity by Day
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activityByDay = daysOfWeek.map(day => ({ day, matches: 0 }));
        subset.forEach(m => {
            const d = new Date(m.createdAt);
            activityByDay[d.getDay()].matches++;
        });

        return {
            winRates,
            avgPoints,
            mostWins,
            mostPoints,
            mostBonusPoints,
            winRateOverTime,
            activityByDay,
            totalMatches: subset.length,
            topPlayers: top5
        };
    };

    // 3. Classify
    const singlesMatches = filteredMatches.filter(m => (m.team1.players.length + m.team2.players.length) <= 3);
    const doublesMatches = filteredMatches.filter(m => (m.team1.players.length + m.team2.players.length) === 4);

    // 4. Player of the Day (Global - based on filtered matches? Or always today? 
    // Usually "Player of the Day" implies TODAY regardless of filter, but if I filter by "Last 7 days", 
    // maybe I want "Player of the Period"? 
    // Let's stick to "Player of the Day" meaning TODAY's best player, calculated from ALL matches to be safe, 
    // or just from the matches that happened today.
    const todayMatches = matches.filter(m => m.createdAt.startsWith(todayStr));
    const dailyStats: Record<string, number> = {};
    todayMatches.forEach(m => {
        if (m.winner === 'team1') m.team1.players.forEach(p => dailyStats[p.name] = (dailyStats[p.name] || 0) + 1);
        if (m.winner === 'team2') m.team2.players.forEach(p => dailyStats[p.name] = (dailyStats[p.name] || 0) + 1);
    });
    let playerOfTheDay = null;
    let maxDailyWins = 0;
    Object.entries(dailyStats).forEach(([name, wins]) => {
        if (wins > maxDailyWins) { maxDailyWins = wins; playerOfTheDay = name; }
    });

    return {
        singles: calculateSubsetStats(singlesMatches),
        doubles: calculateSubsetStats(doublesMatches),
        playerOfTheDay,
        totalMatches: matches.length // Total all time
    };

  }, [matches, timePeriod]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background overflow-x-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <Skeleton className="h-12 w-full max-w-md mb-8" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
        </div>
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-center">No analytics data available</div>;

  const darkColors = [
    "hsl(0, 70%, 40%)", "hsl(240, 70%, 40%)", "hsl(120, 70%, 40%)", 
    "hsl(45, 70%, 40%)", "hsl(300, 70%, 40%)", "hsl(180, 70%, 40%)",
    "hsl(60, 70%, 40%)", "hsl(330, 70%, 40%)"
  ];
  const lightColors = [
    "hsl(0, 70%, 60%)", "hsl(240, 70%, 60%)", "hsl(120, 70%, 60%)",
    "hsl(45, 70%, 60%)", "hsl(300, 70%, 60%)", "hsl(180, 70%, 60%)",
    "hsl(60, 70%, 60%)", "hsl(330, 70%, 60%)"
  ];
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const colorPalette = isDark ? darkColors : lightColors;

  const renderContent = (data: any, title: string) => {
    if (!data || data.totalMatches === 0) return <div className="py-12 text-center text-muted-foreground">No {title.toLowerCase()} matches found in this period.</div>;

    const chartConfig: any = { points: { label: "Points" } };
    data.topPlayers.forEach((p: string, i: number) => {
        chartConfig[p] = { label: p, color: colorPalette[i % colorPalette.length] };
    });

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Top Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
                  <Medal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.totalMatches}</div>
                  <p className="text-xs text-muted-foreground">In selected period</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Best Win Rate</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.winRates[0]?.value || 0}%</div>
                  <p className="text-xs text-muted-foreground">{data.winRates[0]?.name || '-'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Highest Avg Pts</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.avgPoints[0]?.value || 0}</div>
                  <p className="text-xs text-muted-foreground">{data.avgPoints[0]?.name || '-'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Most Wins</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.mostWins[0]?.value || 0}</div>
                  <p className="text-xs text-muted-foreground">{data.mostWins[0]?.name || '-'}</p>
                </CardContent>
              </Card>
        </div>

        {/* Row 1: Win Rates & Average Points */}
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Win Rates</CardTitle>
                    <CardDescription>Win percentage (min 3 matches)</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{ value: { label: "Win %", color: "hsl(var(--primary))" } }} className="h-[300px] w-full">
                        <BarChart data={data.winRates} layout="vertical" margin={{ left: 0, right: 40 }}>
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} className="text-xs font-medium" />
                            <XAxis type="number" domain={[0, 100]} hide />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="value" radius={4} barSize={20}>
                                <LabelList dataKey="value" position="right" formatter={(val: any) => `${val}%`} className="fill-foreground" fontSize={12} />
                                {data.winRates.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || colorPalette[index % colorPalette.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Average Points per Match</CardTitle>
                    <CardDescription>Total points / Matches played (min 3 matches)</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{ value: { label: "Avg Points", color: "hsl(var(--primary))" } }} className="h-[300px] w-full">
                        <BarChart data={data.avgPoints} layout="vertical" margin={{ left: 0, right: 40 }}>
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} className="text-xs font-medium" />
                            <XAxis type="number" hide />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="value" radius={4} barSize={20}>
                                <LabelList dataKey="value" position="right" className="fill-foreground" fontSize={12} />
                                {data.avgPoints.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || colorPalette[index % colorPalette.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>

        {/* Row 2: Win Rate Trends & Activity */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Win Rate Trends</CardTitle>
                <CardDescription>Win percentage progression over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={data.winRateOverTime} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                    <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    {data.topPlayers.map((player: string, index: number) => (
                      <Line key={player} type="monotone" dataKey={player} stroke={chartConfig[player]?.color || colorPalette[index % colorPalette.length]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Activity</CardTitle>
                    <CardDescription>Matches by day of week</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{ matches: { label: "Matches", color: "hsl(var(--primary))" } }} className="h-[300px] w-full">
                        <BarChart data={data.activityByDay} margin={{ top: 20 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="matches" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" barSize={30}>
                                <LabelList dataKey="matches" position="top" className="fill-foreground" fontSize={12} />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>

        {/* Row 3: Bonus Points */}
        <Card>
            <CardHeader>
            <CardTitle>Bonus Points Impact</CardTitle>
            <CardDescription>Top players by bonus points (positive and negative)</CardDescription>
            </CardHeader>
            <CardContent>
            <ChartContainer config={{ value: { label: "Bonus Points" } }} className="h-[250px] w-full">
                <BarChart data={data.mostBonusPoints} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {data.mostBonusPoints.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"} />
                    ))}
                </Bar>
                </BarChart>
            </ChartContainer>
            </CardContent>
        </Card>

        {/* Row 4: Totals (Bottom) */}
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
            <CardHeader>
                <CardTitle>Total Points Gained</CardTitle>
                <CardDescription>Top players by total points</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{ value: { label: "Points", color: colorPalette[2] } }} className="h-[250px] w-full">
                <BarChart data={data.mostPoints} layout="vertical" margin={{ left: 0, right: 30 }}>
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={60} className="text-xs" />
                    <XAxis type="number" hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={4} barSize={16}>
                    <LabelList dataKey="value" position="right" className="fill-foreground" fontSize={12} />
                    {data.mostPoints.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || colorPalette[index % colorPalette.length]} />
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
                <ChartContainer config={{ value: { label: "Wins", color: colorPalette[3] } }} className="h-[250px] w-full">
                <BarChart data={data.mostWins} layout="vertical" margin={{ left: 0, right: 30 }}>
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={60} className="text-xs" />
                    <XAxis type="number" hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={4} barSize={16}>
                    <LabelList dataKey="value" position="right" className="fill-foreground" fontSize={12} />
                    {data.mostWins.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || colorPalette[index % colorPalette.length]} />
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

  return (
    <div className="min-h-screen bg-background overflow-x-auto">
    

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">

        {/* Controls & Tabs */}
        <Tabs defaultValue="doubles" className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                    <TabsTrigger value="doubles" className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Doubles
                    </TabsTrigger>
                    <TabsTrigger value="singles" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Singles
                    </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full md:w-[200px] justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <span>
                                {timePeriod === "today" && "Today"}
                                {timePeriod === "7d" && "Last 7 Days"}
                                {timePeriod === "30d" && "Last 30 Days"}
                                {timePeriod === "60d" && "Last 60 Days"}
                                {timePeriod === "90d" && "Last 90 Days"}
                                {timePeriod === "6m" && "Last 6 Months"}
                                {timePeriod === "1y" && "Last Year"}
                                {timePeriod === "all" && "All Time"}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="end">
                        <div className="grid">
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimePeriod("today")}>Today</Button>
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimePeriod("7d")}>Last 7 Days</Button>
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimePeriod("30d")}>Last 30 Days</Button>
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimePeriod("60d")}>Last 60 Days</Button>
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimePeriod("90d")}>Last 90 Days</Button>
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimePeriod("6m")}>Last 6 Months</Button>
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimePeriod("1y")}>Last Year</Button>
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimePeriod("all")}>All Time</Button>
                        </div>
                    </PopoverContent>
                    </Popover>
                </div>
            </div>

            <TabsContent value="doubles" className="space-y-4 ">
                {renderContent(stats.doubles, "Doubles")}
            </TabsContent>

            <TabsContent value="singles" className="space-y-4">
                {renderContent(stats.singles, "Singles")}
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}