"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMobile } from "@/hooks/use-mobile";

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

  const getColorStyle = (count: number): React.CSSProperties => {
    if (count === 0) return { backgroundColor: "var(--calendar-empty)" };
    if (count === 1) return { backgroundColor: "var(--calendar-l1)" };
    if (count <= 3) return { backgroundColor: "var(--calendar-l2)" };
    if (count <= 5) return { backgroundColor: "var(--calendar-l3)" };
    return { backgroundColor: "var(--calendar-l4)" };
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
    <TooltipProvider delayDuration={100}>
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-center gap-6 text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {calendarData.totalMatches}
            </span>{" "}
            matches
          </span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {calendarData.activeDays}
            </span>{" "}
            active days
          </span>
        </div>

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-2 max-w-full"
        >
          <div className="inline-flex flex-col min-w-max">
            {/* Month labels */}
            <div className="flex text-[10px] text-muted-foreground mb-1 pl-7">
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
              <div className="flex flex-col gap-[3px] text-[10px] text-muted-foreground w-6 shrink-0">
                {["", "M", "", "W", "", "F", ""].map((day, index) => (
                  <div
                    key={index}
                    className="h-3 flex items-center justify-end pr-1"
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
                        <TooltipTrigger asChild>
                          <div
                            className="w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-foreground/50"
                            style={getColorStyle(day.count)}
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
                        <TooltipContent
                          side="top"
                          className="text-xs bg-popover text-popover-foreground border shadow-md"
                          onPointerDownOutside={() => setOpenTooltip(null)}
                        >
                          <p className="font-medium">
                            {formatDate(day.dateStr)}
                          </p>
                          <p className="text-muted-foreground">
                            {day.count} match{day.count !== 1 ? "es" : ""}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm" style={getColorStyle(0)}></div>
            <div className="w-3 h-3 rounded-sm" style={getColorStyle(1)}></div>
            <div className="w-3 h-3 rounded-sm" style={getColorStyle(2)}></div>
            <div className="w-3 h-3 rounded-sm" style={getColorStyle(3)}></div>
            <div className="w-3 h-3 rounded-sm" style={getColorStyle(4)}></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
}