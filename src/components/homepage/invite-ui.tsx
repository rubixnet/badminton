// 'use client'

// import { useRouter } from 'next/navigation'
// import { Button } from '@/components/ui/button'
// import { cn } from '@/lib/utils'

// export function InviteUI({ className }: { className?: string }) {
//     const router = useRouter()

//     return (
//         <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
//             <div className="flex-1 space-y-4">
//                 <div className="text-xs font-medium text-primary uppercase tracking-wider">Multiplayer</div>
//                 <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Invite your friends instantly.</h3>
//                 <p className="text-muted-foreground leading-relaxed font-normal">
//                     Badminton isn't played alone. Easily invite your group via a link, manage rosters, and let everyone view the leaderboards from their own devices.
//                 </p>
//             </div>
//             <div className="flex-[1.2] w-full flex justify-center">
//                 <div className={cn("w-full max-w-sm mx-auto space-y-5 p-6 sm:p-8 bg-background border border-border/50 rounded-xl shadow-sm min-h-[240px] flex flex-col justify-center", className)}>
//                     <div className="space-y-2">
//                         <p className="text-lg font-medium tracking-tight">Add to Club</p>
//                         <p className="text-sm text-muted-foreground">Sign in to generate a custom invite link and start building your roster.</p>
//                     </div>

//                     <div className="pt-2">
//                         <Button
//                             onClick={() => router.push('/login?invite=creator')}
//                             className="w-full font-medium shadow-none h-11"
//                         >
//                             Sign in to Invite
//                         </Button>
//                     </div>

//                     <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
//                         <span>Active players</span>
//                         <div className="flex -space-x-1.5">
//                             {[1, 2, 3, 4].map((i) => (
//                                 <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-primary/20" />
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }