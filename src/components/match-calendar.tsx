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
    if (count === 0) return "bg-muted/40 dark:bg-muted/10"; 
    if (count === 1) return "bg-primary/30";                
    if (count <= 3) return "bg-primary/60";                 
    if (count <= 5) return "bg-primary/80";                 
    return "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.6)]";
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      setTimeout(() => {
        container.scrollLeft = container.scrollWidth;
      }, 50);
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
    <div className={cn("w-full flex flex-col items-center", className)}>
      <TooltipProvider>
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-[100vw] flex justify-center">
            
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto pb-6 pt-2 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            >
              <div className="inline-flex flex-col min-w-max mx-auto">
                
                <div className="flex text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 pl-8">
                  {calendarData.months.map((month, index) => {
                    const nextMonth = calendarData.months[index + 1];
                    const span = nextMonth
                      ? nextMonth.colStart - month.colStart
                      : calendarData.weeks.length - month.colStart;
                    const width = span * 15; // 12px box + 3px gap
                    return (
                      <div
                        key={index}
                        className="text-left shrink-0 select-none"
                        style={{ width: `${width}px` }}
                      >
                        {span >= 4 ? month.name : ""}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-[3px]">
                  <div className="flex flex-col gap-[3px] text-[10px] font-bold text-muted-foreground w-7 shrink-0 select-none">
                    {["", "Mon", "", "Wed", "", "Fri", ""].map((day, index) => (
                      <div
                        key={index}
                        className="h-3 flex items-center justify-end pr-2 leading-none"
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
                                className={cn(
                                  "w-3 h-3 rounded-[3px] cursor-crosshair transition-all duration-300",
                                  getColorClass(day.count),
                                  day.count > 0 && "hover:ring-1 hover:ring-primary/50 hover:scale-125 hover:z-10 relative z-0"
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
                                  className="text-xs bg-background/95 backdrop-blur-md text-foreground border border-border/50 shadow-xl px-3 py-2 rounded-lg"
                                >
                                  <p className="font-bold">{formatDate(day.dateStr)}</p>
                                  <p className="text-muted-foreground tabular-nums mt-0.5 font-medium">
                                    <span className="text-foreground">{day.count}</span> match{day.count !== 1 ? "es" : ""}
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
          </div>

          {/* Legend and Summary Stats Layout */}
          <div className="w-full max-w-[800px] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-4 select-none">
              
            {/* Quick Stat Summary */}
            <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                    <span className="font-black text-foreground tabular-nums tracking-tight">
                        {calendarData.totalMatches}
                    </span>
                    <span className="uppercase tracking-wider text-[9px] font-bold text-muted-foreground">Matches</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                    <span className="font-black text-foreground tabular-nums tracking-tight">
                        {calendarData.activeDays}
                    </span>
                    <span className="uppercase tracking-wider text-[9px] font-bold text-muted-foreground">Active Days</span>
                </div>
            </div>

            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1.5">
                <div className={cn("w-3 h-3 rounded-[3px]", getColorClass(0))} />
                <div className={cn("w-3 h-3 rounded-[3px]", getColorClass(1))} />
                <div className={cn("w-3 h-3 rounded-[3px]", getColorClass(2))} />
                <div className={cn("w-3 h-3 rounded-[3px]", getColorClass(4))} />
                <div className={cn("w-3 h-3 rounded-[3px]", getColorClass(6))} />
              </div>
              <span>More</span>
            </div>
            
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}