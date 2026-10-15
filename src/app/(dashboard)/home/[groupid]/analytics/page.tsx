"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,CardHeader,
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
  Users,
  User,
  Calculator,
  Handshake,
  CalendarIcon,
  Palette,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { useAnalyticsStats, type DateRangeOption } from "./use-analytics-stats";
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
import { cn, formatDateLabel } from "@/lib/utils";
import { useStoredPreference } from "@/lib/stored-preferences";
import { useGroupMatches } from "@/lib/queries";

const PRESET_COLORS = [
  { name: "Blue", value: "hsl(220, 70%, 50%)" },
  { name: "Red", value: "hsl(0, 70%, 50%)" },
  { name: "Green", value: "hsl(140, 60%, 45%)" },
  { name: "Purple", value: "hsl(280, 65%, 55%)" },
  { name: "Orange", value: "hsl(25, 90%, 50%)" },
  { name: "Teal", value: "hsl(180, 60%, 45%)" },
  { name: "Pink", value: "hsl(330, 70%, 55%)" },
  { name: "Yellow", value: "hsl(45, 90%, 50%)" },
];

/** The four headline numbers above the chart grid. */
function TopStats({
  title,
  totalMatches,
  totalAllTime,
  timePeriod,
  winRates,
  avgPoints,
  mostWins,
  goToPlayer,
}: {
  title: string;
  totalMatches: number;
  totalAllTime: number;
  timePeriod: DateRangeOption;
  winRates: any[];
  avgPoints: any[];
  mostWins: any[];
  goToPlayer: (name: string) => void;
}) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Matches Played
          </CardTitle>
          <Medal className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalMatches}
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
            {winRates[0]?.value || 0}%
          </div>
          <button type="button"
            className="text-xs text-muted-foreground hover:text-primary cursor-pointer hover:underline block w-full text-left"
            onClick={() =>
              winRates[0]?.name && goToPlayer(winRates[0].name)
            }>
            {winRates[0]?.name || "-"} ({winRates[0]?.wins || 0}/
            {winRates[0]?.matches || 0} won)
          </button>
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
            {avgPoints[0]?.value || 0}
          </div>
          <button type="button"
            className="text-xs text-muted-foreground hover:text-primary cursor-pointer hover:underline block w-full text-left"
            onClick={() =>
              avgPoints[0]?.name && goToPlayer(avgPoints[0].name)
            }>
            {avgPoints[0]?.name || "-"}
          </button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Wins</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {mostWins[0]?.value || 0}
          </div>
          <button type="button"
            className="text-xs text-muted-foreground hover:text-primary cursor-pointer hover:underline block w-full text-left"
            onClick={() =>
              mostWins[0]?.name && goToPlayer(mostWins[0].name)
            }>
            {mostWins[0]?.name || "-"}
          </button>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * The singles/doubles chart grid.
 *
 * Both tabs render the same card layout from a different slice of the stats
 * object, so the layout lives here and takes the slice as props rather than
 * being duplicated per tab.
 */
function StatsGrid({
  title,
  totalMatches,
  totalAllTime,
  topPlayers,
  winRates,
  avgPoints,
  mostPoints,
  mostWins,
  winRateOverTime,
  dailyBonusPoints,
  isDark,
  getPlayerColor,
  goToPlayer,
  timePeriod,
  impactOverTime,
  impactPlayers,
  bonusPlayers,
  matchesByDate,
}: {
  title: string;
  totalMatches: number;
  totalAllTime: number;
  topPlayers: string[];
  winRates: any[];
  avgPoints: any[];
  mostPoints: any[];
  mostWins: any[];
  winRateOverTime: any[];
  dailyBonusPoints: any[];
  isDark: boolean;
  getPlayerColor: (index: number, isDarkMode: boolean) => string;
  goToPlayer: (name: string) => void;
  timePeriod: DateRangeOption;
  impactOverTime: any[];
  impactPlayers: string[];
  bonusPlayers: string[];
  matchesByDate: any;
}) {
  if (totalMatches === 0)
    return (
      <div className="py-12 text-center text-muted-foreground">
        No {title.toLowerCase()} matches found in this period.
      </div>
    );

  const chartConfig: any = { points: { label: "Points" } };
  topPlayers.forEach((p: string, i: number) => {
    chartConfig[p] = { label: p, color: getPlayerColor(i, isDark) };
  });

  return (
    <div className="space-y-4  animate-in fade-in duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TopStats
          title={title}
          totalMatches={totalMatches}
          totalAllTime={totalAllTime}
          timePeriod={timePeriod}
          winRates={winRates}
          avgPoints={avgPoints}
          mostWins={mostWins}
          goToPlayer={goToPlayer}
        />
      </div>

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
                data={winRates}
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
                        <button type="button"
                          className="font-semibold hover:text-primary cursor-pointer hover:underline block w-full text-left"
                          onClick={() => goToPlayer(d.name)}>
                          {d.name} →
                        </button>
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
                      const entry = winRates[index];
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
                  {winRates.map((entry: any, index: number) => (
                    <Cell
                      key={entry.name}
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
                data={avgPoints}
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
                        <button type="button"
                          className="font-semibold hover:text-primary cursor-pointer hover:underline block w-full text-left"
                          onClick={() => goToPlayer(d.name)}>
                          {d.name} →
                        </button>
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
                  {avgPoints.map((entry: any, index: number) => (
                    <Cell
                      key={entry.name}
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

      <TrendAndImpactCharts
        winRateOverTime={winRateOverTime}
        impactOverTime={impactOverTime}
        impactPlayers={impactPlayers}
        matchesByDate={matchesByDate}
        topPlayers={topPlayers}
        getPlayerColor={getPlayerColor}
        goToPlayer={goToPlayer}
        isDark={isDark}
      />
      <BonusAndTotalsCharts
        dailyBonusPoints={dailyBonusPoints}
        bonusPlayers={bonusPlayers}
        mostWins={mostWins}
        mostPoints={mostPoints}
        getPlayerColor={getPlayerColor}
        goToPlayer={goToPlayer}
        isDark={isDark}
      />
    </div>
  );
}

function usePlayerChartConfig(
  names: string[],
  getPlayerColor: (index: number, isDarkMode: boolean) => string,
  isDark: boolean,
) {
  return useMemo(() => {
    const config: any = { value: { label: "Value" } };
    names.forEach((name, index) => {
      config[name] = { label: name, color: getPlayerColor(index, isDark) };
    });
    return config;
  }, [names, getPlayerColor, isDark]);
}

function TrendAndImpactCharts({
  winRateOverTime, impactOverTime, impactPlayers, matchesByDate,
  getPlayerColor, goToPlayer, isDark, topPlayers,
}: {
  winRateOverTime: any[];
  impactOverTime: any[];
  impactPlayers: string[];
  matchesByDate: any;
  getPlayerColor: (index: number, isDarkMode: boolean) => string;
  goToPlayer: (name: string) => void;
  isDark: boolean;
  topPlayers: string[];
}) {
  const chartConfig = usePlayerChartConfig(topPlayers, getPlayerColor, isDark);
  return (
    <>
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
          data={winRateOverTime}
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
          {topPlayers.map((player: string, index: number) => (
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
  {impactOverTime.length > 0 && (
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
            impactPlayers.slice(0, 10).map((p: string, i: number) => [
              p,
              { label: p, color: getPlayerColor(i, isDark) },
            ]),
          )}
          className="h-[250px] sm:h-[300px] w-full"
        >
          <LineChart
            data={impactOverTime}
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
                            <button type="button"
                              className="flex items-center gap-2 hover:text-primary cursor-pointer hover:underline"
                              onClick={() => goToPlayer(p.dataKey)}>
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="text-xs">{p.dataKey}</span>
                            </button>
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
            {impactPlayers.slice(0, 10).map((player: string, index: number) => (
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

  <Card>
    <CardHeader className="text-center">
      <CardTitle>Match Activity</CardTitle>
      <CardDescription>
        Your badminton activity over the past year
      </CardDescription>
    </CardHeader>
    <CardContent className="lg:flex lg:justify-center">
      <MatchCalendar data={matchesByDate} />
    </CardContent>
  </Card>
    </>
  );
}

function BonusAndTotalsCharts({
  dailyBonusPoints, bonusPlayers, mostWins, mostPoints,
  getPlayerColor, goToPlayer, isDark,
}: {
  dailyBonusPoints: any[];
  bonusPlayers: string[];
  mostWins: any[];
  mostPoints: any[];
  getPlayerColor: (index: number, isDarkMode: boolean) => string;
  goToPlayer: (name: string) => void;
  isDark: boolean;
}) {
  const chartConfig = usePlayerChartConfig([], getPlayerColor, isDark);
  return (
    <>
  {/* Row 5: Daily Bonus Points (stacked by player) */}
  {dailyBonusPoints.length > 0 && (
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
            bonusPlayers.map((p: string, i: number) => [
              p,
              { label: p, color: getPlayerColor(i, isDark) },
            ]),
          )}
          className="h-[250px] sm:h-[300px] w-full"
        >
          <BarChart
            data={dailyBonusPoints}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              className="text-xs"
              dataKey="date"
              interval="preserveStartEnd"
              angle={-45}
              tick={{ textAnchor: "end" }} 
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(undefined, {
                  month: "short",
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
            {bonusPlayers.map((player: string, index: number) => (
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
            data={mostPoints}
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
                    <button type="button"
                      className="font-semibold hover:text-primary cursor-pointer hover:underline block w-full text-left"
                      onClick={() => goToPlayer(d.name)}>
                      {d.name} →
                    </button>
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
              {mostPoints.map((entry: any, index: number) => (
                <Cell
                  key={entry.name}
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
            data={mostWins}
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
                    <button type="button"
                      className="font-semibold hover:text-primary cursor-pointer hover:underline block w-full text-left"
                      onClick={() => goToPlayer(d.name)}>
                      {d.name} →
                    </button>
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
              {mostWins.map((entry: any, index: number) => (
                <Cell
                  key={entry.name}
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
    </>
  );
}


/**
 * The custom range calendar.
 *
 * Split out because it is the only place that needs `window.innerWidth` and
 * "today". It only mounts once the popover is open, so the server HTML and the
 * first client render never differ on those browser-only values.
 */
function DateRangePicker({
  from,
  to,
  onSelect,
}: {
  from?: Date;
  to?: Date;
  onSelect: (next: { from?: Date; to?: Date }) => void;
}) {
  const months =
    typeof window === "undefined" ? 2 : window.innerWidth >= 768 ? 2 : 1;
  const today = new Date();

  return (
    <Calendar
      mode="range"
      defaultMonth={from || today}
      selected={{ from, to }}
      onSelect={(range) =>
        onSelect({ from: range?.from, to: range?.to })
      }
      numberOfMonths={months}
      toDate={today}
      className="rounded-md"
    />
  );
}

/**
 * The duos tab grid.
 *
 * Same treatment as {@link StatsGrid} but for partnership stats, so the tab
 * bodies stay declarative and the two layouts can diverge without touching the
 * page.
 */
function DuoStatsGrid({
  totalDuos,
  duoWinRates,
  duoAvgPoints,
  duoMostWins,
  duoMostPoints,
  duoMostMatches,
  isDark,
  getPlayerColor,
  goToPlayer,
}: {
  totalDuos: number;
  duoWinRates: any[];
  duoAvgPoints: any[];
  duoMostWins: any[];
  duoMostPoints: any[];
  duoMostMatches: any[];
  isDark: boolean;
  getPlayerColor: (index: number, isDarkMode: boolean) => string;
  goToPlayer: (name: string) => void;
}) {
  if (totalDuos === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No duo partnerships found in this period.
      </div>
    );
  }

  const duoChartConfig: any = { value: { label: "Value" } };
  duoWinRates.forEach((d: any, i: number) => {
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
            <div className="text-2xl font-bold">{totalDuos}</div>
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
              {duoWinRates[0]?.value || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {duoWinRates[0]?.shortName || "-"}
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
              {duoAvgPoints[0]?.value || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {duoAvgPoints[0]?.shortName || "-"}
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
              {duoMostWins[0]?.value || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {duoMostWins[0]?.shortName || "-"}
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
                data={duoWinRates}
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
                          <button type="button"
                            className="hover:text-primary cursor-pointer hover:underline text-left"
                            onClick={() => goToPlayer(d.player1)}>
                            {d.player1}
                          </button>
                          {" & "}
                          <button type="button"
                            className="hover:text-primary cursor-pointer hover:underline text-left"
                            onClick={() => goToPlayer(d.player2)}>
                            {d.player2}
                          </button>
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
                  {duoWinRates.map((entry: any, index: number) => (
                    <Cell
                      key={entry.name}
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
                data={duoAvgPoints}
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
                          <button type="button"
                            className="hover:text-primary cursor-pointer hover:underline text-left"
                            onClick={() => goToPlayer(d.player1)}>
                            {d.player1}
                          </button>
                          {" & "}
                          <button type="button"
                            className="hover:text-primary cursor-pointer hover:underline text-left"
                            onClick={() => goToPlayer(d.player2)}>
                            {d.player2}
                          </button>
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
                  {duoAvgPoints.map((entry: any, index: number) => (
                    <Cell
                      key={entry.name}
                      fill={getPlayerColor(index, isDark)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <DuoTotalsCharts
        duoMostWins={duoMostWins}
        duoMostMatches={duoMostMatches}
        duoMostPoints={duoMostPoints}
        getPlayerColor={getPlayerColor}
        goToPlayer={goToPlayer}
        isDark={isDark}
      />
    </div>
  );
}

function DuoTotalsCharts({
  duoMostWins,
  duoMostMatches,
  duoMostPoints,
  getPlayerColor,
  goToPlayer,
  isDark,
}: {
  duoMostWins: any[];
  duoMostMatches: any[];
  duoMostPoints: any[];
  getPlayerColor: (index: number, isDarkMode: boolean) => string;
  goToPlayer: (name: string) => void;
  isDark: boolean;
}) {
  return (
    <>
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
              data={duoMostMatches}
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
                        <button type="button"
                          className="hover:text-primary cursor-pointer hover:underline text-left"
                          onClick={() => goToPlayer(d.player1)}>
                          {d.player1}
                        </button>
                        {" & "}
                        <button type="button"
                          className="hover:text-primary cursor-pointer hover:underline text-left"
                          onClick={() => goToPlayer(d.player2)}>
                          {d.player2}
                        </button>
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
                {duoMostMatches.map((entry: any, index: number) => (
                  <Cell
                    key={entry.name}
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
              data={duoMostPoints}
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
                        <button type="button"
                          className="hover:text-primary cursor-pointer hover:underline text-left"
                          onClick={() => goToPlayer(d.player1)}>
                          {d.player1}
                        </button>
                        {" & "}
                        <button type="button"
                          className="hover:text-primary cursor-pointer hover:underline text-left"
                          onClick={() => goToPlayer(d.player2)}>
                          {d.player2}
                        </button>
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
                {duoMostPoints.map((entry: any, index: number) => (
                  <Cell
                    key={entry.name}
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
            data={duoMostWins}
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
                      <button type="button"
                        className="hover:text-primary cursor-pointer hover:underline text-left"
                        onClick={() => goToPlayer(d.player1)}>
                        {d.player1}
                      </button>
                      {" & "}
                      <button type="button"
                        className="hover:text-primary cursor-pointer hover:underline text-left"
                        onClick={() => goToPlayer(d.player2)}>
                        {d.player2}
                      </button>
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
              {duoMostWins.map((entry: any, index: number) => (
                <Cell
                  key={entry.name}
                  fill={getPlayerColor(index, isDark)}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
    </>
  );
}

/** Roster card: every player in the group links to their profile. */
function AllPlayersCard({
  players,
  groupId,
}: {
  players: string[];
  groupId: string;
}) {
  return (
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
          {players.map((player) => (
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
  );
}

/** Placeholder grid shown while the matches query is in flight. */
function AnalyticsLoadingSkeleton({ title }: { title: string }) {
  return (

    <div className="min-h-screen bg-background overflow-x-auto">
      <Navbar title={title} />
      <div className="max-w-6xl mx-auto p-2 md:p-6 pt-0 md:pt-2 space-y-4">
        {/* Player of the Day Skeleton */}
        <Card className="bg-linear-to-r from-primary/10 via-background to-background border-primary/20 cursor-pointer hover:border-primary/50 transition-colors group mt-6">
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <Skeleton className="h-10 w-full md:w-[400px]" />
          <Skeleton className="h-10 w-full md:w-[200px]" />
        </div>

        <div className="space-y-8">
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

/**
 * Tab switches plus the two view controls: chart colour mode and date range.
 *
 * All three live together because they occupy the same toolbar row, and
 * grouping them keeps the page body to "tabs and cards".
 */
function ChartColorPicker({
  colorModeContext,
}: {
  colorModeContext: ReturnType<typeof useColorMode>;
}) {
  return (
    <>
          {/* Chart Colors Picker */}
          <Popover>
            <PopoverTrigger >
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                title="Chart Colors"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Chart Colors
                </p>
                <Button
                  variant={
                    colorModeContext.colorMode === "monochrome"
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() =>
                    colorModeContext?.setColorMode("monochrome")
                  }
                >
                  {colorModeContext.colorMode === "monochrome" && (
                    <Check className="h-4 w-4" />
                  )}
                  <span
                    className={
                      colorModeContext.colorMode === "monochrome"
                        ? ""
                        : "ml-6"
                    }
                  >
                    {colorModeContext.colorMode === "monochrome" ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                  </span>
                </Button>
                <Button
                  onClick={() =>
                    colorModeContext?.setColorMode("multicolor")
                  }
                >
                  {colorModeContext.colorMode === "multicolor" ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                  <span
                    className={
                      colorModeContext.colorMode === "multicolor"
                        ? ""
                        : "ml-6"
                    }
                  >
                    Multicolor
                  </span>
                    {timePeriod === "30d" && "Last 30 Days"}
                    {timePeriod === "60d" && "Last 60 Days"}
                    {timePeriod === "365d" && "A Year"}
                    {timePeriod === "all" && "All Time"}
                    {timePeriod === "custom" &&
                      customDateRange.from &&
                      customDateRange.to &&
                      `${formatDateLabel(customDateRange.from)} - ${formatDateLabel(customDateRange.to)}`}
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
                  <DateRangePicker
                    from={customDateRange.from}
                    to={customDateRange.to}
                    onSelect={(next) => {
                      setCustomDateRange(next);
                      if (next.from && next.to) {
                        setTimePeriod("custom");
                        setShowCalendar(false);
                      }
                    }}
                  />
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  );
}

    </>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupid as string;

  const matchesQuery = useGroupMatches(groupId);
  const matches = useMemo(
    () => matchesQuery.data?.matches ?? [],
    [matchesQuery.data],
  );
  const strictMode = matchesQuery.data?.strictMode ?? false;
  const loading = matchesQuery.isPending;

  // localStorage is treated as an external store so the first client render
  // matches the server HTML and the saved preference is picked up right after
  // hydration, without a setState inside an effect.
  const [timePeriodKey, setTimePeriodValue] = useStoredPreference(
    `badminton_analytics_timeperiod_${groupId}`,
    "30d",
  );
  const timePeriod = timePeriodKey as DateRangeOption;
  const setTimePeriod = setTimePeriodValue;

  const [customRangeKey, setCustomRangeValue] = useStoredPreference(
    `badminton_analytics_customdates_${groupId}`,
    "",
  );
  const customDateRange = useMemo(() => {
    if (!customRangeKey) return {};
    try {
      const parsed = JSON.parse(customRangeKey);
      return {
        from: parsed.from ? new Date(parsed.from) : undefined,
        to: parsed.to ? new Date(parsed.to) : undefined,
      };
    } catch {
      return {};
    }
  }, [customRangeKey]);
  const setCustomDateRange = (next: { from?: Date; to?: Date }) => {
    if (!next.from && !next.to) return;
    setCustomRangeValue(
      JSON.stringify({
        from: next.from?.toISOString(),
        to: next.to?.toISOString(),
      }),
    );
  };

  const [showCalendar, setShowCalendar] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const colorModeContext = useColorMode();
  const { getPlayerColor } = colorModeContext;

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


  const stats = useAnalyticsStats({
    matches,
    timePeriod,
    strictMode,
    customDateRange,
  });

  const title = strictMode ? "Analytics (Strict Mode)" : "Analytics";

  if (loading) {
    return <AnalyticsLoadingSkeleton title={title} />;
  }

  if (!stats)
    return <div className="p-8 text-center">No analytics data available</div>;

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  // Replaced by <StatsGrid/> below.


  return (
    <div className="min-h-screen bg-background overflow-x-auto">
      <Navbar title={title} />

      <div className="max-w-6xl mx-auto p-2 md:p-6 pt-0 md:pt-2 space-y-4 mt-6">
        <PlayerOfTheDay playerName={stats.playerOfTheDay} />

        {/* Controls & Tabs */}
        <Tabs defaultValue="doubles" className="space-y-4">
          <AnalyticsToolbar
            colorModeContext={colorModeContext}
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
            showCalendar={showCalendar}
            setShowCalendar={setShowCalendar}
            popoverOpen={popoverOpen}
            setPopoverOpen={setPopoverOpen}
          />

          <TabsContent value="doubles" className="space-y-8">
            <StatsGrid
              {...stats.doubles}
              title="Doubles"
              totalAllTime={stats.totalDoublesAllTime}
              isDark={isDark}
              getPlayerColor={getPlayerColor}
              goToPlayer={goToPlayer}
              timePeriod={timePeriod}
            />
          </TabsContent>

          <TabsContent value="duos" className="space-y-8">
            <DuoStatsGrid
              {...stats.duos}
              isDark={isDark}
              getPlayerColor={getPlayerColor}
              goToPlayer={goToPlayer}
            />
          </TabsContent>

          <TabsContent value="singles" className="space-y-8">
            <StatsGrid
              {...stats.singles}
              title="Singles"
              totalAllTime={stats.totalSinglesAllTime}
              isDark={isDark}
              getPlayerColor={getPlayerColor}
              goToPlayer={goToPlayer}
              timePeriod={timePeriod}
            />
          </TabsContent>
        </Tabs>

        <AllPlayersCard players={allPlayers} groupId={groupId} />
      </div>
    </div>
  );
}