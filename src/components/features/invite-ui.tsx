'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function InviteUI({ className }: { className?: string }) {
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
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-primary/20" />
                    ))}
                </div>
            </div>
        </div>
    )
}
