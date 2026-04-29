// import { TrendingUp } from 'lucide-react'
// import { StatRadar } from '@/components/stat-cross'
// import { cn } from '@/lib/utils'

// export function PlayerProfileUI({ className }: { className?: string }) {
//     const dummyStats = {
//         top: { label: "Win%", value: 65, max: 100 },
//         right: { label: "Pts", value: 21, max: 30 },
//         bottom: { label: "Wins", value: 42, max: 64 },
//         left: { label: "Games", value: 64, max: 64 },
//     }

//     const recentResults = ['W', 'L', 'W', 'W', 'W'];

//     return (
//         <div className="flex flex-col md:flex-row-reverse gap-12 lg:gap-20 items-center">
//             <div className="flex-1 space-y-4">
//                 <div className="text-xs font-medium text-primary uppercase tracking-wider">Player Identity</div>
//                 <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Detailed Player Profiles.</h3>
//                 <p className="text-muted-foreground leading-relaxed font-normal">
//                     Every player gets a dedicated profile showcasing their radar stats, average points per match, recent form history, and head-to-head records against specific opponents.
//                 </p>
//             </div>
//             <div className="flex-[1.2] w-full flex justify-center">
//                 <div className={cn("w-full max-w-sm mx-auto flex flex-col items-center bg-background border border-border/50 rounded-xl p-5 sm:p-6 shadow-sm z-10", className)}>
//                     <div className="w-full flex items-center justify-between mb-8">
//                         <div className="flex items-center gap-3">
//                             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">G</div>
//                             <div>
//                                 <h4 className="text-base font-bold text-foreground leading-tight">Gaurav</h4>
//                                 <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Rank #1</p>
//                             </div>
//                         </div>
//                         <div className="text-right">
//                             <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Form</p>
//                             <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
//                                 <TrendingUp className="w-3.5 h-3.5" />
//                                 <span className="text-xs font-bold">80%</span>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="w-full mb-8 pt-2 px-4">
//                         <StatRadar stats={dummyStats} />
//                     </div>

//                     <div className="w-full border-t border-border/40 pt-5">
//                         <div className="flex justify-between items-center mb-3">
//                             <span className="text-xs font-medium text-muted-foreground">Last 5 Matches</span>
//                             <span className="text-[10px] text-muted-foreground">(oldest → newest)</span>
//                         </div>
//                         <div className="flex gap-2 w-full justify-start">
//                             {recentResults.map((result, i) => (
//                                 <div
//                                     key={i}
//                                     className={cn(
//                                         "w-6 h-6 sm:w-8 sm:h-8 rounded flex items-center justify-center text-[10px] sm:text-xs font-bold border",
//                                         result === 'W'
//                                             ? "bg-foreground text-background border-foreground"
//                                             : "bg-background text-foreground border-border/50"
//                                     )}
//                                 >
//                                     {result}
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }