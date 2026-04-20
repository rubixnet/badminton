'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { buttonVariants, Button } from '@/components/ui/button'
import { useMemo, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Moon, Sun, Play, X, TrendingUp, Trophy, Menu } from 'lucide-react'
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
    BarChart,
    Bar
} from 'recharts'
import { useTheme } from 'next-themes'
import { StatRadar } from '@/components/stat-cross'

function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])
    if (!mounted) return <div className="w-9 h-9" />

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            className="w-8 h-8 flex shrink-0 items-center justify-center rounded-md bg-transparent hover:bg-muted/20 transition-colors"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}


function ActivityHeatmap() {
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
                const chance = Math.random()
                
                if (isWeekend && chance > 0.4) count = Math.floor(Math.random() * 4) + 1
                else if (!isWeekend && chance > 0.85) count = Math.floor(Math.random() * 2) + 1
                if (w > 48 && chance > 0.3) count = Math.floor(Math.random() * 5) + 1

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
        if (count === 1) return 'bg-primary/30'
        if (count === 2) return 'bg-primary/60'
        if (count === 3) return 'bg-primary/80'
        return 'bg-primary'
    }

    return (
        <TooltipProvider delayDuration={0}>
            <div className="w-full flex flex-col items-center">
                <div className="w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="min-w-max flex gap-[3px] p-2 mx-auto justify-center">
                        {calendarData.map((week, wIdx) => (
                            <div key={wIdx} className="flex flex-col gap-[3px]">
                                {week.map((day, dIdx) => (
                                    <Tooltip key={`${wIdx}-${dIdx}`}>
                                        <TooltipTrigger asChild>
                                            <div 
                                                className={cn(
                                                    "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] transition-all duration-200", 
                                                    getColor(day.count),
                                                    day.count > 0 ? "hover:scale-125 hover:z-10 hover:ring-1 ring-foreground/50 cursor-crosshair relative" : "cursor-default"
                                                )}
                                            />
                                        </TooltipTrigger>
                                        {day.count > 0 && (
                                            <TooltipContent side="top" className="text-xs border shadow-sm rounded-md bg-background text-foreground px-3 py-2">
                                                <p className="font-medium">{day.dateStr}</p>
                                                <p className="text-muted-foreground">{day.count} match{day.count !== 1 ? 'es' : ''}</p>
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

function InteractiveScoreUI({ className }: { className?: string }) {
    const [score1, setScore1] = useState(19)
    const [score2, setScore2] = useState(20)

    return (
        <div className={cn("w-full max-w-sm mx-auto flex gap-3 select-none", className)}>
            <div 
                onClick={() => setScore1(s => s < 30 ? s + 1 : s)}
                className="flex-1 bg-background border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm active:scale-95 group min-h-[160px] sm:min-h-[200px]"
            >
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">Tap to score</span>
                <span className="text-5xl sm:text-6xl font-medium tracking-tighter text-foreground/90">{score1}</span>
            </div>
            <div 
                onClick={() => setScore2(s => s < 30 ? s + 1 : s)}
                className="flex-1 bg-background border border-primary/30 ring-1 ring-primary/10 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-primary/60 hover:shadow-sm active:scale-95 group min-h-[160px] sm:min-h-[200px]"
            >
                <span className="text-[10px] sm:text-xs font-medium text-primary">Match Point</span>
                <span className="text-5xl sm:text-6xl font-medium tracking-tighter text-primary">{score2}</span>
            </div>
        </div>
    )
}

const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border border-border/50 rounded-lg p-3 shadow-lg text-sm min-w-[140px]">
                <p className="font-semibold text-foreground border-b border-border/50 pb-2 mb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs text-muted-foreground">{entry.name}</span>
                            </div>
                            <span className="text-xs font-medium text-foreground">{entry.value}%</span>
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
        { date: "Jan 1", Gaurav: 50, Raj: 50, Aryan: 50 },
        { date: "Feb 1", Gaurav: 55, Raj: 48, Aryan: 47 },
        { date: "Mar 1", Gaurav: 60, Raj: 45, Aryan: 45 },
        { date: "Apr 1", Gaurav: 58, Raj: 50, Aryan: 42 },
        { date: "May 1", Gaurav: 62, Raj: 52, Aryan: 36 },
        { date: "Jun 1", Gaurav: 65, Raj: 50, Aryan: 35 },
    ]

    return (
        <div className={cn("w-full max-w-lg mx-auto h-[250px] sm:h-[300px] min-w-0 bg-background border border-border/50 rounded-xl p-4 sm:p-6 shadow-sm", className)}>
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
                    <Line type="monotone" dataKey="Gaurav" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="Raj" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="Aryan" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
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
        <div className={cn("w-full max-w-sm mx-auto flex flex-col items-center bg-background border border-border/50 rounded-xl p-5 sm:p-6 shadow-sm z-10", className)}>
            <div className="w-full flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">G</div>
                    <div>
                        <h4 className="text-base font-bold text-foreground leading-tight">Gaurav</h4>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Rank #1</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Form</p>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">80%</span>
                    </div>
                </div>
            </div>
            
            <div className="w-full mb-8 pt-2 px-4">
                <StatRadar stats={dummyStats} />
            </div>

            <div className="w-full border-t border-border/40 pt-5">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium text-muted-foreground">Last 5 Matches</span>
                    <span className="text-[10px] text-muted-foreground">(oldest → newest)</span>
                </div>
                <div className="flex gap-2 w-full justify-start">
                    {recentResults.map((result, i) => (
                        <div 
                            key={i} 
                            className={cn(
                                "w-6 h-6 sm:w-8 sm:h-8 rounded flex items-center justify-center text-[10px] sm:text-xs font-bold border",
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
        </div>
    )
}

function HeadToHeadUI({ className }: { className?: string }) {
    return (
        <div className={cn("w-full max-w-sm mx-auto bg-background border border-border/50 rounded-xl p-6 sm:p-8 shadow-sm", className)}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">G</div>
                    <span className="text-xs font-medium">Gaurav</span>
                </div>
                <div className="flex flex-col items-center px-4">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">VS</span>
                    <div className="h-px w-10 sm:w-12 bg-border" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold">R</div>
                    <span className="text-xs font-medium">Raj</span>
                </div>
            </div>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-foreground">42 Wins</span>
                        <span className="text-muted-foreground">20 Wins</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                        <div className="h-full bg-primary" style={{ width: '67%' }} />
                        <div className="h-full bg-muted-foreground/30" style={{ width: '33%' }} />
                    </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                    <span className="font-medium">Avg 21.4 pts</span>
                    <span className="font-medium">Avg 18.2 pts</span>
                </div>
            </div>
        </div>
    )
}

function PlayerOfTheDayUI({ className }: { className?: string }) {
    return (
        <div className={cn("w-full max-w-sm mx-auto relative cursor-default", className)}>
            <div className="relative w-full rounded-2xl bg-background border border-border/50 p-8 py-12 shadow-sm flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent rounded-2xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center gap-5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                        <div className="w-20 h-20 rounded-full bg-background border border-primary/50 flex items-center justify-center relative z-10 shadow-md">
                            <Trophy className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    
                    <div className="text-center space-y-1.5">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Player of the Day</p>
                        <h4 className="text-3xl font-black text-foreground tracking-tight">Raj</h4>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mt-2">
                            <span>7 Wins</span>
                            <span className="w-1 h-1 rounded-full bg-primary/50" />
                            <span>+42 Pts</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function VideoDialogUI({ className }: { className?: string }) {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <>
            <div 
                onClick={() => setIsOpen(true)}
                className={cn("relative w-full max-w-md mx-auto aspect-video bg-background border border-border/50 rounded-xl overflow-hidden group cursor-pointer shadow-sm", className)}
            >
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-muted/20 dark:from-primary/10 dark:to-muted/10" />
                
                <div className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <div className="w-14 h-14 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center shadow-sm">
                        <Play className="w-5 h-5 text-primary ml-1" />
                    </div>
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center">
                    <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Watch Demo
                    </span>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-border/50 animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                            <Play className="w-16 h-16 mb-4 opacity-50" />
                            <p>Video Player Implementation</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function InviteUI({ className }: { className?: string }) {
    const router = useRouter()

    return (
        <div className={cn("w-full max-w-sm mx-auto space-y-5 p-6 sm:p-8 bg-background border border-border/50 rounded-xl shadow-sm min-h-[240px] flex flex-col justify-center", className)}>
            <div className="space-y-2">
                <p className="text-lg font-medium tracking-tight">Add to Club</p>
                <p className="text-sm text-muted-foreground">Sign in to generate a custom invite link and start building your roster.</p>
            </div>
            
            <div className="pt-2">
                <Button 
                    onClick={() => router.push('/login?invite=creator')}
                    className="w-full font-medium shadow-none h-11"
                >
                    Sign in to Invite
                </Button>
            </div>

            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span>Active players</span>
                <div className="flex -space-x-1.5">
                    {[1,2,3,4].map((i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-primary/20" />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function Home() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 overflow-x-hidden">
            <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center justify-between">
                    <Link href="/" className="font-medium tracking-tight text-sm text-foreground/90 hover:text-primary transition-colors">
                        Badminton Tracker
                    </Link>

                    <div className="hidden sm:flex items-center">
                        <div className="flex items-center gap-5 text-sm mr-2">
                            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                            <Link href="#story" className="text-muted-foreground hover:text-foreground transition-colors">Our Story</Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-px bg-border/50 " />
                            <ThemeToggle />
                            <div className="h-4 w-px bg-border/50" />
                            <Link href="/login" className={buttonVariants({ variant: "default", size: "sm", className: "rounded-md shadow-none font-medium h-9 px-5" })}>
                                Try it free
                            </Link>
                        </div>
                    </div>

                    <button 
                        className="sm:hidden p-2 -mr-2 text-muted-foreground"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Dropdown */}
                {isMobileMenuOpen && (
                    <div className="sm:hidden absolute top-full left-0 w-full bg-background border-b border-border/40 px-6 py-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-2">
                        <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium">Features</Link>
                        <Link href="#story" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium">Our Story</Link>
                        <div className="flex items-center justify-between pt-4 border-t border-border/40">
                            <span className="text-sm text-muted-foreground">Theme</span>
                            <ThemeToggle />
                        </div>
                        <Link href="/login" className={buttonVariants({ variant: "default", className: "w-full rounded-md shadow-none font-medium h-10 mt-2" })}>
                            Try it free
                        </Link>
                    </div>
                )}
            </nav>

            <main className="flex-1">
                <section className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
                            Now open for early access
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-[1.1] text-foreground/90 text-balance mx-auto">
                            Stop losing scores in group chats.
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed font-normal text-balance mx-auto max-w-2xl">
                            A fast, zero-clutter workspace for your weekend matches. Track scores, view win rates, and keep the rivalry recorded permanently. Fully responsive, dark mode ready, and built for the court.
                        </p>
                        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href="/login" className={buttonVariants({ variant: "default", size: "lg", className: "rounded-md shadow-none font-medium w-full sm:w-auto px-8 h-12" })}>
                                Start Tracking Now
                            </Link>
                            <Link href="#features" className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-md shadow-none font-medium w-full sm:w-auto px-8 h-12 bg-transparent border-border/50" })}>
                                See how it works
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="max-w-5xl mx-auto px-6 py-12 mb-16 sm:mb-24">
                    <div className="text-center mb-8 space-y-2">
                        <h2 className="text-xl font-medium tracking-tight text-foreground/90">Your year on the court</h2>
                        <p className="text-sm text-muted-foreground">Hover over the days to see interactive match history.</p>
                    </div>
                    <div className="bg-background border border-border/50 rounded-xl p-4 sm:p-10 shadow-sm">
                        <ActivityHeatmap />
                    </div>
                </section>

                <section className="max-w-4xl mx-auto px-6 mb-24">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center space-y-2">
                            <div className="w-8 h-8 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-4">1</div>
                            <h4 className="font-medium">Create your club</h4>
                            <p className="text-sm text-muted-foreground">Set up a dedicated space for your friend group in seconds.</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="w-8 h-8 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-4">2</div>
                            <h4 className="font-medium">Log the matches</h4>
                            <p className="text-sm text-muted-foreground">Use the fast UI to record scores, bonus points, and checkpoints.</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="w-8 h-8 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-4">3</div>
                            <h4 className="font-medium">Settle the debate</h4>
                            <p className="text-sm text-muted-foreground">Let the automated analytics decide who is actually the best player.</p>
                        </div>
                    </div>
                </section>

                <section id="features" className="max-w-5xl mx-auto px-6 py-12 space-y-24 sm:space-y-32">
                    
                    <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4">
                            <div className="text-xs font-medium text-primary uppercase tracking-wider">Zero Friction</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Manage scores instantly.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Log scores in seconds without fighting a messy interface. We built this to be fast on mobile so you can edit and manage scores between sets, not after you get home.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center">
                            <InteractiveScoreUI />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row-reverse gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4">
                            <div className="text-xs font-medium text-primary uppercase tracking-wider">Daily Honors</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Player of the Day.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Our algorithm crowns a Player of the Day based on wins, point differentials, and activity. Claim your spot at the top of the leaderboard and earn bragging rights.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center">
                            <PlayerOfTheDayUI />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4">
                            <div className="text-xs font-medium text-primary uppercase tracking-wider">Deep Stats</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Settle debates with hard data.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Access rich analytics including win rate trends, total matches played, and point differentials over time. Watch the graph evolve as you log more games.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center">
                            <WinRateLineChartUI />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row-reverse gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4">
                            <div className="text-xs font-medium text-primary uppercase tracking-wider">Player Identity</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Detailed Player Profiles.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Every player gets a dedicated profile showcasing their radar stats, average points per match, recent form history, and head-to-head records against specific opponents.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center">
                            <PlayerProfileUI />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4">
                            <div className="text-xs font-medium text-primary uppercase tracking-wider">Head to Head</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Know your nemesis.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Know head to head win and loss count against your friends. Track partner win rates, performance by day, and in-depth stats to see who your toughest matchups really are.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center">
                            <HeadToHeadUI />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row-reverse gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4">
                            <div className="text-xs font-medium text-primary uppercase tracking-wider">Your Court, Your Rules</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Solo, Duo & Custom Modes.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Full support for 1v1 and 2v2 matchups. Add custom checkpoints and bonus points to track the specific house rules you and your friends actually play by.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center">
                            <VideoDialogUI />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 space-y-4">
                            <div className="text-xs font-medium text-primary uppercase tracking-wider">Multiplayer</div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Invite your friends instantly.</h3>
                            <p className="text-muted-foreground leading-relaxed font-normal">
                                Badminton isn't played alone. Easily invite your group via a link, manage rosters, and let everyone view the leaderboards from their own devices.
                            </p>
                        </div>
                        <div className="flex-[1.2] w-full flex justify-center">
                            <InviteUI />
                        </div>
                    </div>

                </section>

                <section id="story" className="border-y border-border/40 bg-muted/10">
                    <div className="max-w-5xl mx-auto px-6 py-24">
                        <div className="flex flex-col md:flex-row gap-16 items-center">
                            <div className="flex-1 space-y-6">
                                <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground/90">Built by me for me and my friends.</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed font-normal">
                                    We didn't know if our games were improving or not, a lot of matches are just going to vain without any proper data. This app tells and does a lot of stuff. It's just a tool built by a player to solve a real problem for our own court. Now, it's open for anyone who takes their friendly rivalries a bit too seriously.
                                </p>
                                <div className="pt-4">
                                    <Link href="/analytics" className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-md shadow-none font-medium h-12 px-8 bg-background border-border/50" })}>
                                        See our match data →
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="flex-1 w-full max-w-md mx-auto">
                                <div className="aspect-square sm:aspect-[4/3] bg-muted/30 rounded-xl border border-border/50 flex items-center justify-center relative overflow-hidden shadow-sm">
                                    {/* Placeholder for Photo */}
                                    <span className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest">Our Court</span>
                                    <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="max-w-3xl mx-auto px-6 py-24 text-center space-y-6">
                    <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground/90">Ready to own the court?</h2>
                    <p className="text-muted-foreground font-normal text-lg">
                        It's completely free to use. Try it out, invite your friends, and see who really dominates the games.
                    </p>
                    <div className="pt-6">
                        <Link href="/login" className={buttonVariants({ variant: "default", size: "lg", className: "rounded-md shadow-none font-medium px-8 h-12" })}>
                            Create your free account
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="bg-background w-full pb-8">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <p className="text-sm font-medium text-foreground/80 tracking-tight">
                            Badminton Tracker
                        </p>
                        <div className="flex items-center gap-8 text-sm text-muted-foreground font-normal">
                            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}