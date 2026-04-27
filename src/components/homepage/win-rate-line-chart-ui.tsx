'use client'

import { cn } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

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

export function WinRateLineChartUI({ className }: { className?: string }) {
    const data = [
        { date: "Jan 1", Gaurav: 50, Raj: 50, Aryan: 50 },
        { date: "Feb 1", Gaurav: 55, Raj: 48, Aryan: 47 },
        { date: "Mar 1", Gaurav: 60, Raj: 45, Aryan: 45 },
        { date: "Apr 1", Gaurav: 58, Raj: 50, Aryan: 42 },
        { date: "May 1", Gaurav: 62, Raj: 52, Aryan: 36 },
        { date: "Jun 1", Gaurav: 65, Raj: 50, Aryan: 35 },
    ]

    return (
        <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
            <div className="flex-1 space-y-4">
                <div className="text-xs font-medium text-primary uppercase tracking-wider">Deep Stats</div>
                <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Settle debates with hard data.</h3>
                <p className="text-muted-foreground leading-relaxed font-normal">
                    Access rich analytics including win rate trends, total matches played, and point differentials over time. Watch the graph evolve as you log more games.
                </p>
            </div>
            <div className="flex-[1.2] w-full flex justify-center">
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
            </div>
        </div>
    )
}