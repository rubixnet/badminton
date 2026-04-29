// 'use client'

// import { useState } from 'react'
// import { Play, X } from 'lucide-react'
// import { cn } from '@/lib/utils'

// export function VideoDialogUI({ className }: { className?: string }) {
//     const [isOpen, setIsOpen] = useState(false)
//     return (
//         <div className="flex flex-col md:flex-row-reverse gap-12 lg:gap-20 items-center">
//             <div className="flex-1 space-y-4">
//                 <div className="text-xs font-medium text-primary uppercase tracking-wider">Your Court, Your Rules</div>
//                 <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Solo, Duo & Custom Modes.</h3>
//                 <p className="text-muted-foreground leading-relaxed font-normal">
//                     Full support for 1v1 and 2v2 matchups. Add custom checkpoints and bonus points to track the specific house rules you and your friends actually play by.
//                 </p>
//             </div>
//             <div className="flex-[1.2] w-full flex justify-center">
//                 <div
//                     onClick={() => setIsOpen(true)}
//                     className={cn("relative w-full max-w-md mx-auto aspect-video bg-background border border-border/50 rounded-xl overflow-hidden group cursor-pointer shadow-sm", className)}
//                 >
//                     <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-muted/20 dark:from-primary/10 dark:to-muted/10" />

//                     <div className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
//                         <div className="w-14 h-14 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center shadow-sm">
//                             <Play className="w-5 h-5 text-primary ml-1" />
//                         </div>
//                     </div>

//                     <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center">
//                         <div className="flex gap-1.5">
//                             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
//                             <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
//                         </div>
//                         <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
//                             Watch Demo
//                         </span>
//                     </div>
//                 </div>

//                 {isOpen && (
//                     <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
//                         <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-border/50 animate-in zoom-in-95 duration-200">
//                             <button
//                                 onClick={() => setIsOpen(false)}
//                                 className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
//                             >
//                                 <X className="w-4 h-4 text-white" />
//                             </button>
//                             <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
//                                 <Play className="w-16 h-16 mb-4 opacity-50" />
//                                 <p>Video Player Implementation</p>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     )
// }