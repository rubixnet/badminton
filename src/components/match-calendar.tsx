"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MatchCalendarProps {
  data: { date: string; count: number }[];
  className?: string;
}

export function MatchCalendar({ data, className = "" }: MatchCalendarProps) {
  const isMobile = useMobile();
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const calendarData = useMemo(() => {
    const formatDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 364); // 365 days including today

    const dateMap = new Map<string, number>();
    data.forEach((item) => {
      dateMap.set(item.date, item.count);
    });

    const dates: { date: Date; count: number; dateStr: string }[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = formatDateString(current);
      dates.push({
        date: new Date(current),
        count: dateMap.get(dateStr) || 0,
        dateStr,
      });
      current.setDate(current.getDate() + 1);
    }

    const weeks: { date: Date; count: number; dateStr: string }[][] = [];
    let currentWeek: { date: Date; count: number; dateStr: string }[] = [];

    dates.forEach((day, index) => {
      currentWeek.push(day);
      if (day.date.getDay() === 6 || index === dates.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    const months: { name: string; colStart: number }[] = [];
    weeks.forEach((week, weekIndex) => {
      week.forEach((day) => {
        const month = day.date.toLocaleDateString("en-US", { month: "short" });
        const prevMonth =
          months.length > 0 ? months[months.length - 1].name : "";
        if (month !== prevMonth) {
          months.push({ name: month, colStart: weekIndex });
        }
      });
    });

    const totalMatches = data.reduce((sum, d) => sum + d.count, 0);
    const activeDays = data.filter((d) => d.count > 0).length;

    return { weeks, months, totalMatches, activeDays };
  }, [data]);

  const getColorClass = (count: number): string => {
    if (count === 0) return "bg-muted/30 dark:bg-muted/10";
    if (count === 1) return "bg-primary/30";
    if (count <= 3) return "bg-primary/60";
    if (count <= 5) return "bg-primary/80";
    return "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"; 
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const currentWeekIndex = calendarData.weeks.length - 1;
      if (currentWeekIndex >= 0) {
        const weekWidth = 15; // Approximate width per week
        const scrollPosition = currentWeekIndex * weekWidth;
        container.scrollLeft = Math.max(
          0,
          scrollPosition - container.clientWidth / 2,
        );
      }
    }
  }, [calendarData.weeks.length]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={cn("w-full bg-background border border-border/50 rounded-2xl p-6 shadow-sm", className)}>
        <TooltipProvider>
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground/90">Activity Heatmap</h3>
                    <p className="text-xs text-muted-foreground">Your performance mapped over the last year.</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex flex-col items-end">
                        <span className="font-black text-xl text-foreground tabular-nums leading-none">
                            {calendarData.totalMatches}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Matches</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex flex-col items-end">
                        <span className="font-black text-xl text-foreground tabular-nums leading-none">
                            {calendarData.activeDays}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Active Days</span>
                    </div>
                </div>
            </div>

            <div
            ref={scrollContainerRef}
            className="overflow-x-auto pb-4 max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
            <div className="inline-flex flex-col min-w-max">
                <div className="flex text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 pl-7">
                {calendarData.months.map((month, index) => {
                    const nextMonth = calendarData.months[index + 1];
                    const span = nextMonth
                    ? nextMonth.colStart - month.colStart
                    : calendarData.weeks.length - month.colStart;
                    const width = span * 15; // 12px box + 3px gap
                    return (
                    <div
                        key={index}
                        className="text-left shrink-0"
                        style={{ width: `${width}px` }}
                    >
                        {span >= 4 ? month.name : ""}
                    </div>
                    );
                })}
                </div>

                <div className="flex gap-[3px]">
                <div className="flex flex-col gap-[3px] text-[10px] font-bold text-muted-foreground w-6 shrink-0">
                    {["", "M", "", "W", "", "F", ""].map((day, index) => (
                    <div
                        key={index}
                        className="h-3 flex items-center justify-end pr-2"
                    >
                        {day}
                    </div>
                    ))}
                </div>

                <div className="flex gap-[3px]">
                    {calendarData.weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[3px]">
                        {weekIndex === 0 &&
                        Array.from({ length: 7 - week.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="w-3 h-3" />
                        ))}
                        {week.map((day, dayIndex) => (
                        <Tooltip
                            key={dayIndex}
                            open={
                            isMobile
                                ? openTooltip === `${weekIndex}-${dayIndex}`
                                : undefined
                            }
                        >
                            <TooltipTrigger >
                            <div
                                className={cn(
                                    "w-3 h-3 rounded-[2px] cursor-crosshair transition-all duration-200",
                                    getColorClass(day.count),
                                    day.count > 0 && "hover:ring-1 hover:ring-foreground/50 hover:scale-110 z-10 relative"
                                )}
                                onClick={
                                isMobile
                                    ? () =>
                                        setOpenTooltip(
                                        openTooltip === `${weekIndex}-${dayIndex}`
                                            ? null
                                            : `${weekIndex}-${dayIndex}`,
                                        )
                                    : undefined
                                }
                            />
                            </TooltipTrigger>
                            {day.count > 0 && (
                                <TooltipContent
                                    side="top"
                                    className="text-xs bg-background text-foreground border-border/50 shadow-xl px-3 py-2 rounded-lg"
                                >
                                    <p className="font-bold">{formatDate(day.dateStr)}</p>
                                    <p className="text-muted-foreground tabular-nums mt-0.5">
                                        {day.count} match{day.count !== 1 ? "es" : ""}
                                    </p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                        ))}
                    </div>
                    ))}
                </div>
                </div>
            </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-start gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-2">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className={cn("w-3 h-3 rounded-[2px]", getColorClass(0))} />
                    <div className={cn("w-3 h-3 rounded-[2px]", getColorClass(1))} />
                    <div className={cn("w-3 h-3 rounded-[2px]", getColorClass(2))} />
                    <div className={cn("w-3 h-3 rounded-[2px]", getColorClass(4))} />
                    <div className={cn("w-3 h-3 rounded-[2px]", getColorClass(6))} />
                </div>
                <span>More</span>
            </div>
        </div>
        </TooltipProvider>
    </div>
  );
}