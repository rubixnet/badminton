'use client'

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PlayerOfTheDayUI({ className }: { className?: string }) {
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
