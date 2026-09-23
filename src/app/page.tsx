'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { buttonVariants, Button } from '@/components/ui/button'
import { useMemo, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Moon, Sun, Play, X, TrendingUp, Menu, ChevronRight, BarChart2, Zap, Shield, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
} from 'recharts'
import { useTheme } from 'next-themes'

const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const popoverVariant = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.2 } }
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 flex shrink-0 items-center justify-center rounded-md bg-transparent hover:bg-muted/50 transition-colors"
        >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-muted-foreground" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground" />
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}

function FeaturePopover() {
    const [isOpen, setIsOpen] = useState(false)
    const popoverRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const features = [
        { icon: BarChart2, title: "Analytics", desc: "Win rates & performance trends" },
        { icon: Zap, title: "Momentum", desc: "Track comebacks & downfalls" },
        { icon: Shield, title: "Discipline", desc: "Log unforced errors & net faults" },
        { icon: Users, title: "H2H Data", desc: "Find your ultimate nemesis" },
    ]

    return (
        <div className="relative inline-block" ref={popoverRef}>
            <Button
                variant="outline"
                size="lg"
                onClick={() => setIsOpen(!isOpen)}
                className="shadow-sm font-medium w-full sm:w-auto px-8 bg-transparent border-border/50 active:scale-[0.98] transition-all"
            >
                See how it works <ChevronRight className={cn("ml-2 h-4 w-4 transition-transform", isOpen && "rotate-90")} />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={popoverVariant}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 mt-3 w-[320px] bg-background border border-border/50 rounded-xl shadow-xl z-50 p-2"
                    >
                        <div className="grid grid-cols-1 gap-1">
                            {features.map((feat, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-default">
                                    <div className="p-2 rounded-md bg-muted text-foreground">
                                        <feat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{feat.title}</p>
                                        <p className="text-xs text-muted-foreground">{feat.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

interface StatRadarProps {
    stats: {
        top: { label: string; value: number; max: number };
        right: { label: string; value: number; max: number };
        bottom: { label: string; value: number; max: number };
        left: { label: string; value: number; max: number };
    };
    className?: string;
}

function StatRadar({ stats, className = "" }: StatRadarProps) {
    const center = 50;
    const maxRadius = 40;

    const topPct = Math.min(stats.top.value / stats.top.max, 1);
    const rightPct = Math.min(stats.right.value / stats.right.max, 1);
    const bottomPct = Math.min(stats.bottom.value / stats.bottom.max, 1);
    const leftPct = Math.min(stats.left.value / stats.left.max, 1);

    const points = {
        top: { x: center, y: center - topPct * maxRadius },
        right: { x: center + rightPct * maxRadius, y: center },
        bottom: { x: center, y: center + bottomPct * maxRadius },
        left: { x: center - leftPct * maxRadius, y: center },
    };

    const path = `M ${points.top.x} ${points.top.y} L ${points.right.x} ${points.right.y} L ${points.bottom.x} ${points.bottom.y} L ${points.left.x} ${points.left.y} Z`;

    return (
        <div className={cn("relative w-full max-w-[200px] mx-auto", className)}>
            <svg viewBox="0 0 100 100" className="w-full aspect-square overflow-visible">
                <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
                <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />

                <circle cx={center} cy={center} r={maxRadius * 0.25} fill="none" stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground/10" />
                <circle cx={center} cy={center} r={maxRadius * 0.5} fill="none" stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground/10" />
                <circle cx={center} cy={center} r={maxRadius * 0.75} fill="none" stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground/10" />
                <circle cx={center} cy={center} r={maxRadius} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />

                <path d={path} fill="currentColor" className="text-foreground/5" />
                <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground/60" />

                <circle cx={points.top.x} cy={points.top.y} r="2.5" fill="currentColor" className="text-foreground" />
                <circle cx={points.right.x} cy={points.right.y} r="2.5" fill="currentColor" className="text-foreground" />
                <circle cx={points.bottom.x} cy={points.bottom.y} r="2.5" fill="currentColor" className="text-foreground" />
                <circle cx={points.left.x} cy={points.left.y} r="2.5" fill="currentColor" className="text-foreground" />
                <circle cx={center} cy={center} r="3" fill="currentColor" className="text-muted-foreground/40" />
            </svg>

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-4 md:-top-2 left-1/2 -translate-x-1/2 text-center">
                    <span className="text-[12px] sm:text-sm font-bold tabular-nums text-foreground block leading-none">
                        {stats.top.value}{stats.top.label === 'Win%' ? '%' : ''}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{stats.top.label}</span>
                </div>

                <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-right">
                    <span className="text-[12px] sm:text-sm font-bold tabular-nums text-foreground block leading-none">
                        {stats.right.value}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{stats.right.label}</span>
                </div>

                <div className="absolute -bottom-4 md:-bottom-2 left-1/2 -translate-x-1/2 text-center">
                    <span className="text-[12px] sm:text-sm font-bold tabular-nums text-foreground block leading-none">
                        {stats.bottom.value}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{stats.bottom.label}</span>
                </div>

                <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-left">
                    <span className="text-[12px] sm:text-sm font-bold tabular-nums text-foreground block leading-none">
                        {stats.left.value}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{stats.left.label}</span>
                </div>
            </div>
        </div>
    )
}

function ActivityHeatmap() {
    const seededValue = (week: number, day: number, salt = 0) => {
        const x = Math.sin((week + 1) * 12.9898 + (day + 1) * 78.233 + salt * 37.719) * 43758.5453
        return x - Math.floor(x)
    }

    const calendarData = useMemo(() => {
        const weeks = 52
        const days = 7
        const grid = []
        const today = new Date()
        const startDate = new Date()
        startDate.setDate(today.getDate() - (weeks * days) + 1)

        for (let w = 0; w < weeks; w++) {
            const week = []
            for (let d = 0; d < days; d++) {
                const currentDate = new Date(startDate)
                currentDate.setDate(startDate.getDate() + (w * days + d))

                let count = 0
                const isWeekend = d === 0 || d === 6
                const chance = seededValue(w, d)

                if (isWeekend && chance > 0.4) count = Math.floor(seededValue(w, d, 1) * 4) + 1
                else if (!isWeekend && chance > 0.85) count = Math.floor(seededValue(w, d, 2) * 2) + 1
                if (w > 48 && chance > 0.3) count = Math.floor(seededValue(w, d, 3) * 5) + 1

                week.push({
                    date: currentDate,
                    count: count,
                    dateStr: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                })
            }
            grid.push(week)
        }
        return grid
    }, [])

    const getColor = (count: number) => {
        if (count === 0) return 'bg-muted/30 dark:bg-muted/10'
        if (count === 1) return 'bg-foreground/20'
        if (count === 2) return 'bg-foreground/40'
        if (count === 3) return 'bg-foreground/70'
        return 'bg-foreground'
    }

    return (
        <TooltipProvider >
            <div className="w-full flex flex-col items-center">
                <div className="w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="min-w-max flex gap-[3px] p-2 mx-auto justify-center">
                        {calendarData.map((week, wIdx) => (
                            <div key={wIdx} className="flex flex-col gap-[3px]">
                                {week.map((day, dIdx) => (
                                    <Tooltip key={`${wIdx}-${dIdx}`}>
                                        <TooltipTrigger >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                whileInView={{ scale: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: Math.min(wIdx * 0.01 + dIdx * 0.02, 0.5), duration: 0.2 }}
                                                className={cn(
                                                    "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] transition-colors duration-200",
                                                    getColor(day.count),
                                                    day.count > 0 ? "hover:ring-1 ring-foreground/50 cursor-crosshair" : "cursor-default"
                                                )}
                                            />
                                        </TooltipTrigger>
                                        {day.count > 0 && (
                                            <TooltipContent side="top" className="text-xs border shadow-sm bg-background text-foreground px-3 py-2 rounded-md">
                                                <p className="font-medium">{day.dateStr}</p>
                                                <p className="text-muted-foreground tabular-nums">{day.count} match{day.count !== 1 ? 'es' : ''}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <span>Less</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map(l => (
                            <div key={l} className={cn("w-3 h-3 rounded-[2px]", getColor(l))} />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </div>
        </TooltipProvider>
    )
}

function HeroVideoUI({ className }: { className?: string }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={cn("max-w-4xl mx-auto px-6 mt-8 mb-16 sm:mb-24", className)}
        >
            <div
                onClick={() => setIsOpen(true)}
                className="relative w-full aspect-[21/9] sm:aspect-video bg-muted/10 border border-border/50 rounded-xl overflow-hidden group cursor-pointer shadow-sm"
            >
                <img
                    src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2000&auto=format&fit=crop"
                    alt="Video Thumbnail"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-background/20 z-10 pointer-events-none" />

                <div className="absolute inset-0 flex items-center justify-center z-20 transition-transform duration-500 group-hover:scale-110 active:scale-[0.98]">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-background/30 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-colors group-hover:bg-foreground group-hover:border-foreground text-white">
                        <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1.5 fill-current" />
                    </div>
                </div>

                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 flex items-center gap-3">
                    <Badge variant="outline" className="bg-black/40 backdrop-blur-md border-white/10 shadow-none text-[10px] uppercase tracking-widest text-white rounded">
                        Overview
                    </Badge>
                    <span className="text-xs sm:text-sm font-medium text-white drop-shadow-md">
                        Watch the demo
                    </span>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 sm:p-6"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-border/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors active:scale-[0.96]"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                            <iframe
                                className="w-full h-full"
                                src="https://www.youtube.com/embed/2YjODDzddKw/?autoplay=1"
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    )
}

function InteractiveScoreUI({ className }: { className?: string }) {
    const [score1, setScore1] = useState(19)
    const [score2, setScore2] = useState(20)

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={cn("w-full flex gap-3 select-none", className)}
        >
            <div
                onClick={() => setScore1(s => s < 30 ? s + 1 : s)}
                className="flex-1 bg-background border border-border/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.96] hover:border-foreground/30 min-h-[200px] shadow-sm"
            >
                <span className="text-xs font-medium text-muted-foreground transition-colors uppercase tracking-widest">Tap to score</span>
                <span className="text-6xl font-medium tracking-tighter text-foreground/90 tabular-nums">{score1}</span>
            </div>
            <div
                onClick={() => setScore2(s => s < 30 ? s + 1 : s)}
                className="flex-1 bg-foreground border border-foreground rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.96] min-h-[200px] shadow-sm"
            >
                <span className="text-xs font-medium text-background uppercase tracking-widest opacity-80">Match Point</span>
                <span className="text-6xl font-medium tracking-tighter text-background tabular-nums">{score2}</span>
            </div>
        </motion.div>
    )
}

const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border border-border/50 rounded-md p-3 shadow-sm text-sm min-w-[140px]">
                <p className="font-semibold text-foreground border-b border-border/50 pb-2 mb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs text-muted-foreground">{entry.name}</span>
                            </div>
                            <span className="text-xs font-medium text-foreground tabular-nums">{entry.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return null
}

function WinRateLineChartUI({ className }: { className?: string }) {
    const data = [
        { date: "Jan 1", Dhiraj: 50, Steve: 50, Shafik: 50 },
        { date: "Feb 1", Dhiraj: 55, Steve: 48, Shafik: 47 },
        { date: "Mar 1", Dhiraj: 60, Steve: 45, Shafik: 45 },
        { date: "Apr 1", Dhiraj: 58, Steve: 50, Shafik: 42 },
        { date: "May 1", Dhiraj: 62, Steve: 52, Shafik: 36 },
        { date: "Jun 1", Dhiraj: 65, Steve: 50, Shafik: 35 },
    ]

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={cn("w-full bg-background border border-border/50 rounded-xl p-4 sm:p-6 shadow-sm h-[280px]", className)}
        >
            <div className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
                            dy={10}
                        />
                        <YAxis
                            domain={[20, 80]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
                            tickFormatter={(val) => `${val}%`}
                        />
                        <RechartsTooltip content={<CustomLineTooltip />} cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        <Line type="monotone" dataKey="Dhiraj" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Steve" stroke="#71717a" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="Shafik" stroke="#a1a1aa" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}

function PlayerProfileUI({ className }: { className?: string }) {
    const dummyStats = {
        top: { label: "Win%", value: 65, max: 100 },
        right: { label: "Pts", value: 21, max: 30 },
        bottom: { label: "Wins", value: 42, max: 64 },
        left: { label: "Games", value: 64, max: 64 },
    }

    const recentResults = ['W', 'L', 'W', 'W', 'W'];

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={cn("w-full flex flex-col items-center bg-background border border-border/50 rounded-xl p-5 sm:p-8 shadow-sm z-10 min-h-[300px]", className)}
        >
            <div className="w-full flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-foreground flex items-center justify-center text-background font-bold">D</div>
                    <div>
                        <h4 className="text-lg font-bold text-foreground leading-tight">Dhiraj</h4>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Rank #1</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Win Streak</p>
                    <div className="flex items-center gap-1.5 justify-end text-foreground">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-lg font-bold tabular-nums">7W</span>
                    </div>
                </div>
            </div>

            <div className="w-full mb-8 pt-2 px-4">
                <StatRadar stats={dummyStats} />
            </div>

            <div className="w-full border-t border-border/40 pt-5">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Form</span>
                </div>
                <div className="flex gap-2 w-full justify-start">
                    {recentResults.map((result, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-7 h-7 rounded flex items-center justify-center text-xs font-bold border",
                                result === 'W'
                                    ? "bg-foreground text-background border-foreground"
                                    : "bg-background text-foreground border-border/50"
                            )}
                        >
                            {result}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

function HeadToHeadUI({ className }: { className?: string }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={cn("w-full bg-background border border-border/50 rounded-xl p-6 sm:p-8 flex flex-col justify-center min-h-[300px] shadow-sm", className)}
        >
            <div className="flex items-center justify-between mb-10">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-foreground text-background flex items-center justify-center text-xl font-bold">D</div>
                    <span className="text-xs font-medium">Dhiraj</span>
                </div>
                <div className="flex flex-col items-center px-4">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">VS</span>
                    <div className="h-px w-10 bg-border" />
                </div>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xl font-bold border border-border/50">S</div>
                    <span className="text-xs font-medium">Steve</span>
                </div>
            </div>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-sm font-bold mb-3">
                        <span className="text-foreground tabular-nums">42 Wins</span>
                        <span className="text-muted-foreground tabular-nums">20 Wins</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                        <div className="h-full bg-foreground" style={{ width: '67%' }} />
                        <div className="h-full bg-muted-foreground/30" style={{ width: '33%' }} />
                    </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                    <span className="font-medium tabular-nums">Avg 21.4 pts</span>
                    <span className="font-medium tabular-nums">Avg 18.2 pts</span>
                </div>
            </div>
        </motion.div>
    )
}

function CheckpointsUI({ className }: { className?: string }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={cn("w-full flex flex-col justify-center gap-4 bg-background border border-border/50 rounded-xl p-6 sm:p-8 shadow-sm min-h-[300px]", className)}
        >
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30 shadow-sm">
                <span className="text-lg font-black tracking-tight tabular-nums text-muted-foreground">11 - 2</span>
                <Badge variant="outline" className="bg-background text-foreground border-border text-[10px] font-bold uppercase tracking-widest px-3 py-1 shadow-none rounded">Downfall Risk</Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-foreground bg-foreground text-background shadow-md sm:translate-x-4">
                <span className="text-2xl font-black tabular-nums tracking-tighter">19 - 21</span>
                <Badge className="bg-background text-foreground hover:bg-background border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1 shadow-none rounded">Epic Comeback</Badge>
            </div>
        </motion.div>
    )
}

function FaultTrackerUI({ className }: { className?: string }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={cn("w-full bg-background border border-border/50 rounded-xl p-6 sm:p-8 flex flex-col justify-center shadow-sm space-y-6 min-h-[300px]", className)}
        >
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Match Log</span>
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold shadow-none border-border/50 rounded">Strict Mode</Badge>
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex gap-3 items-center">
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center font-bold text-xs shrink-0">D</div>
                        <span className="text-sm font-medium">Dhiraj</span>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground tabular-nums">-1 Bad Serve</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex gap-3 items-center">
                        <div className="w-6 h-6 rounded bg-foreground text-background flex items-center justify-center font-bold text-xs shrink-0">S</div>
                        <span className="text-sm font-medium">Steve</span>
                    </div>
                    <span className="text-xs font-bold text-foreground tabular-nums">+2 Epic Smash</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex gap-3 items-center">
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center font-bold text-xs shrink-0">S</div>
                        <span className="text-sm font-medium">Shafik</span>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground tabular-nums">-1 Net Fault</span>
                </div>
            </div>
        </motion.div>
    )
}

function VideoDialogUI({ className }: { className?: string }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={cn("w-full min-h-[300px] flex items-center", className)}
        >
            <div
                onClick={() => setIsOpen(true)}
                className="relative w-full aspect-video bg-muted/10 border border-border/50 rounded-xl overflow-hidden group cursor-pointer shadow-sm"
            >
                <img
                    src="https://user-cdn.hackclub-assets.com/019de004-0b06-7b6a-bd86-7a0ff8751b38/Screenshot%202026-05-01%20at%2001.40.15.png"
                    alt="Custom Modes Thumbnail"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />

                <div className="absolute inset-0 flex items-center justify-center z-20 transition-transform duration-300 group-hover:scale-110 active:scale-[0.96]">
                    <div className="w-16 h-16 rounded-full bg-background/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg text-white group-hover:bg-foreground group-hover:border-foreground transition-colors">
                        <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                </div>

                <div className="absolute bottom-5 left-6 right-6 flex justify-between items-center z-30">
                    <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    </div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-md">
                        Watch Demo
                    </span>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-border/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors active:scale-[0.96]"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                            <video
                                className="w-full h-full object-cover"
                                controls
                                autoPlay
                                playsInline
                            >
                                <source src="https://cdn.hackclub.com/019ddfe5-f0c1-75a4-9b98-472906bbd6e4/screen_recording_2026-05-01_at_01.06.45.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

function InviteUI({ className }: { className?: string }) {
    const router = useRouter()

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={cn("w-full space-y-6 p-6 sm:p-8 bg-background border border-border/50 rounded-xl shadow-sm min-h-[300px] flex flex-col justify-center", className)}
        >
            <div className="space-y-2">
                <p className="text-xl font-bold tracking-tight">Add to Club</p>
                <p className="text-sm text-muted-foreground leading-relaxed">Sign in to generate a custom invite link and start building your roster.</p>
            </div>

            <div className="pt-2">
                <Button
                    onClick={() => router.push('/login?invite=creator')}
                    className="w-full font-medium shadow-none active:scale-[0.96] transition-transform rounded"
                >
                    Sign in to Invite
                </Button>
            </div>

            <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active players</span>
                <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-black text-foreground">
                            {String.fromCharCode(64 + i)}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}


export default function Home() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-muted/50 overflow-x-hidden">
            <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-transparent">
                <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
                    <Link href="/" className="font-semibold tracking-tight text-sm text-foreground flex items-center gap-2">
                        <div className="w-3 h-3 bg-foreground rounded-sm" />
                        Badminton Tracker
                    </Link>

                    <div className="hidden sm:flex items-center">
                        <div className="flex items-center gap-6 text-sm mr-2">
                            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Features</Link>
                            <Link href="#story" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Story</Link>
                        </div>
                        <div className="flex items-center gap-1 pl-1">
                            <ThemeToggle />
                            <Link href="/login" className={buttonVariants({ variant: "default", size: "sm", className: "shadow-sm font-medium ml-2 active:scale-[0.96] transition-transform rounded" })}>
                                Try it free
                            </Link>
                        </div>
                    </div>

                    <button
                        className="sm:hidden p-2 -mr-2 text-muted-foreground active:scale-[0.96] transition-transform"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="sm:hidden overflow-hidden bg-background border-b border-border/50 px-6 py-4 flex flex-col gap-4 shadow-lg"
                        >
                            <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium">Features</Link>
                            <Link href="#story" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium">Story</Link>
                            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                <span className="text-sm text-muted-foreground font-medium">Theme</span>
                                <ThemeToggle />
                            </div>
                            <Link href="/login" className={buttonVariants({ variant: "default", className: "w-full shadow-sm font-medium mt-2 rounded" })}>
                                Try it free
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <main className="flex-1">
                <motion.section
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="max-w-4xl mx-auto px-6 pt-32 pb-16 text-center"
                >
                    <div className="space-y-6">
                        <motion.div
                            variants={fadeUp}
                            className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-muted border border-border mb-4 text-[10px] font-bold uppercase tracking-widest shadow-sm"
                        >
                            Now open for early access
                        </motion.div>
                        <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-[1.1] text-foreground/90 text-balance mx-auto">
                            Stop losing scores in group chats.
                        </motion.h1>
                        <motion.p variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed font-normal text-balance mx-auto max-w-2xl">
                            A fast, zero-clutter workspace for your weekend matches. Track scores, view win rates, and keep the rivalry recorded permanently. Fully responsive, dark mode ready, and built for the court.
                        </motion.p>
                        <motion.div variants={fadeUp} className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href="/login" className={buttonVariants({ variant: "default", size: "lg", className: "shadow-sm font-medium w-full sm:w-auto px-8 active:scale-[0.98] transition-transform rounded" })}>
                                Start Tracking Now
                            </Link>
                            <FeaturePopover />
                        </motion.div>
                    </div>
                </motion.section>

                <HeroVideoUI />

                <motion.section
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
                    className="max-w-5xl mx-auto px-6 py-12 mb-16 sm:mb-24"
                >
                    <div className="text-center mb-8 space-y-2">
                        <h2 className="text-xl font-bold tracking-tight text-foreground/90">Your year on the court</h2>
                        <p className="text-sm text-muted-foreground">Hover over the days to see interactive match history.</p>
                    </div>
                    <div className="w-full flex justify-center border border-border/50 rounded-xl p-6 shadow-sm">
                        <ActivityHeatmap />
                    </div>
                </motion.section>

                <section className="max-w-4xl mx-auto px-6 mb-24">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center space-y-3 transition-transform duration-300 hover:-translate-y-1">
                            <div className="w-10 h-10 mx-auto rounded-md bg-muted text-foreground flex items-center justify-center font-black text-sm mb-4">1</div>
                            <h4 className="font-bold">Create your club</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed text-balance">Set up a dedicated space for your friend group in seconds.</p>
                        </div>
                        <div className="text-center space-y-3 transition-transform duration-300 hover:-translate-y-1">
                            <div className="w-10 h-10 mx-auto rounded-md bg-muted text-foreground flex items-center justify-center font-black text-sm mb-4">2</div>
                            <h4 className="font-bold">Log the matches</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed text-balance">Use the fast UI to record scores, bonus points, and checkpoints.</p>
                        </div>
                        <div className="text-center space-y-3 transition-transform duration-300 hover:-translate-y-1">
                            <div className="w-10 h-10 mx-auto rounded-md bg-muted text-foreground flex items-center justify-center font-black text-sm mb-4">3</div>
                            <h4 className="font-bold">Settle the debate</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed text-balance">Let the automated analytics decide who is actually the best player.</p>
                        </div>
                    </div>
                </section>


                <section id="features" className="max-w-5xl mx-auto px-6 py-12 space-y-24 sm:space-y-32">

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4 lg:order-1">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2"><Zap className="w-3 h-3" /> Zero Friction</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Manage scores instantly.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Log scores in seconds without fighting a messy interface. We built this to be fast on mobile so you can edit and manage scores between sets, not after you get home.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center lg:justify-end lg:order-2">
                            <InteractiveScoreUI className="w-full max-w-lg" />
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4 lg:order-2">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Momentum</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Checkpoints & Comebacks.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Don't just record the final result. Log mid-game checkpoints to capture the story of the match. Automatically tag "Epic Comebacks" or "Downfalls" to keep the banter alive.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center lg:justify-start lg:order-1">
                            <CheckpointsUI className="w-full max-w-lg" />
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4 lg:order-1">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2"><Shield className="w-3 h-3" /> Accountability</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">The "Fault" Tracker.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Every point counts. Use Bonus and Deduction points to note who gave away easy points to the opponent or failed to defend a smash. Monitor player discipline trends.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center lg:justify-end lg:order-2">
                            <FaultTrackerUI className="w-full max-w-lg" />
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4 lg:order-2">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2"><Users className="w-3 h-3" /> Player Identity</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Detailed Player Profiles.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Every player gets a dedicated profile showcasing their radar stats, average points per match, recent form history, and active win streaks.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center lg:justify-start lg:order-1">
                            <PlayerProfileUI className="w-full max-w-lg" />
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4 lg:order-1">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Head to Head</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Know your nemesis.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Know head to head win and loss count against your friends. Track partner win rates, performance by day, and in-depth stats to see who your toughest matchups really are.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center lg:justify-end lg:order-2">
                            <HeadToHeadUI className="w-full max-w-lg" />
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4 lg:order-2">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2"><BarChart2 className="w-3 h-3" /> Deep Stats</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Settle debates with hard data.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Access rich analytics including win rate trends, total matches played, and point differentials over time. Watch the graph evolve as you log more games.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center lg:justify-start lg:order-1">
                            <WinRateLineChartUI className="w-full max-w-lg" />
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4 lg:order-1">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Your Court, Your Rules</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Solo, Duo & Custom Modes.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Full support for 1v1 and 2v2 matchups. Add custom checkpoints and bonus points to track the specific house rules you and your friends actually play by.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center lg:justify-end lg:order-2">
                            <VideoDialogUI className="w-full max-w-lg" />
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4 lg:order-2">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Multiplayer</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Invite your friends instantly.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Badminton isn't played alone. Easily invite your group via a link, manage rosters, and let everyone view the leaderboards from their own devices.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center lg:justify-start lg:order-1">
                            <InviteUI className="w-full max-w-lg" />
                        </div>
                    </motion.div>

                </section>

                <section className="py-24 bg-background border-t border-border/50">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="text-center space-y-4 mb-16">
                            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground/90">What's Next</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="space-y-2 text-center md:text-left">
                                <h4 className="text-lg font-bold text-foreground/90">Strict Mode ELO</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    A new competitive mode where bonus points and faults actively dictate your ELO ranking, not just wins and losses.
                                </p>
                            </div>
                            <div className="space-y-2 text-center md:text-left">
                                <h4 className="text-lg font-bold text-foreground/90">League Tournaments</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Organize brackets and round-robins directly from your club dashboard.
                                </p>
                            </div>
                            <div className="space-y-2 text-center md:text-left">
                                <h4 className="text-lg font-bold text-foreground/90">AI Match Insights</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Automated play style summaries telling you when you peak and which opponents to avoid.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                            <div className="space-y-1">
                                <h4 className="text-lg font-bold flex items-center justify-center sm:justify-start gap-2">
                                    Have a feature idea?
                                </h4>
                                <p className="text-sm text-muted-foreground">Tell us what you want to see built next for your club.</p>
                            </div>
                            <Button variant="outline" className="shadow-none w-full sm:w-auto shrink-0 rounded border-border/50">
                                Message Me on Slack
                            </Button>
                        </div>
                    </div>
                </section>

                <section id="story" className="py-24 bg-muted/30">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <div className="space-y-6">
                                <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground/90">Built by me for me and my friends.</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed font-normal">
                                    We didn't know if our games were improving or not, a lot of matches are just going to vain without any proper data. This app tells and does a lot of stuff. It's just a tool built by a player to solve a real problem for our own court. Now, it's open for anyone who takes their friendly rivalries a bit too seriously.
                                </p>
                                <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground/90">P.S. - We forgot to a take photo of us together :( 🫠 and time ran out 😴  </h2>

                                <div className="pt-4">
                                    <Link href="/home/j577aw31jp6v0aswm6myj2v23h85vht2" className={buttonVariants({ variant: "outline", size: "lg", className: "shadow-sm font-medium active:scale-[0.98] transition-transform rounded border-border/50 bg-background" })}>
                                        See our match data →
                                    </Link>
                                </div>
                            </div>

                            <div className="w-full max-w-md mx-auto">
                                <div className="aspect-square sm:aspect-[4/3] bg-background rounded-xl border border-border/50 flex items-center justify-center relative overflow-hidden shadow-sm">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Our Court</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="max-w-3xl mx-auto px-6 py-24 text-center space-y-6 bg-background">
                    <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground/90">Ready to own the court?</h2>
                    <p className="text-muted-foreground font-normal text-balance text-lg">
                        It's completely free to use. Try it out, invite your friends, and see who really dominates the games.
                    </p>
                    <div className="pt-6">
                        <Link href="/login" className={buttonVariants({ variant: "default", size: "lg", className: "shadow-sm font-medium active:scale-[0.98] transition-transform rounded" })}>
                            Create your free account
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="bg-background w-full pb-8">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="border-t border-border/60 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                            <div className="w-2 h-2 bg-foreground rounded-sm" />
                            Badminton Tracker
                        </p>
                        <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}