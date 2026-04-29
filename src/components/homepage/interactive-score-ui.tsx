// 'use client'

// import { useState } from 'react'
// import { cn } from '@/lib/utils'

// export function InteractiveScoreUI({ className }: { className?: string }) {
//     const [score1, setScore1] = useState(19)
//     const [score2, setScore2] = useState(20)

//     return (
//         <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
//             <div className="flex-1 space-y-4">
//                 <div className="text-xs font-medium text-primary uppercase tracking-wider">Zero Friction</div>
//                 <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Manage scores instantly.</h3>
//                 <p className="text-muted-foreground leading-relaxed font-normal">
//                     Log scores in seconds without fighting a messy interface. We built this to be fast on mobile so you can edit and manage scores between sets, not after you get home.
//                 </p>
//             </div>
//             <div className="flex-[1.2] w-full flex justify-center">
//                 <div className={cn("w-full max-w-sm mx-auto flex gap-3 select-none", className)}>
//                     <div
//                         onClick={() => setScore1(s => s < 30 ? s + 1 : s)}
//                         className="flex-1 bg-background border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm active:scale-95 group min-h-[160px] sm:min-h-[200px]"
//                     >
//                         <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">Tap to score</span>
//                         <span className="text-5xl sm:text-6xl font-medium tracking-tighter text-foreground/90">{score1}</span>
//                     </div>
//                     <div
//                         onClick={() => setScore2(s => s < 30 ? s + 1 : s)}
//                         className="flex-1 bg-background border border-primary/30 ring-1 ring-primary/10 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-primary/60 hover:shadow-sm active:scale-95 group min-h-[160px] sm:min-h-[200px]"
//                     >
//                         <span className="text-[10px] sm:text-xs font-medium text-primary">Match Point</span>
//                         <span className="text-5xl sm:text-6xl font-medium tracking-tighter text-primary">{score2}</span>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }