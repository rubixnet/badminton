'use client'

import { cn } from '@/lib/utils'

export function HeadToHeadUI({ className }: { className?: string }) {
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
