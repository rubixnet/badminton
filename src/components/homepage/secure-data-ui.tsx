// import { ShieldCheck, Lock } from 'lucide-react'
// import { cn } from '@/lib/utils'

// export function SecureDataUI({ className }: { className?: string }) {
//     return (
//         <div className="flex flex-col md:flex-row-reverse gap-12 lg:gap-20 items-center w-full">
//             <div className="w-full md:w-[45%] shrink-0 space-y-4">
//                 <div className="text-xs font-medium text-primary uppercase tracking-wider">Privacy First</div>
//                 <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Your data stays on your court.</h3>
//                 <p className="text-muted-foreground leading-relaxed font-normal">
//                     Match scores, player profiles, and win rates are strictly secured. Your club's data is safely stored in the database and never shared with random people or third parties. What happens on the court, stays on the court.
//                 </p>
//             </div>

//             <div className="w-full md:w-[55%] shrink-0 flex justify-center">
//                 <div className={cn("w-full max-w-sm mx-auto bg-background border border-border/50 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden", className)}>
//                     <div className="absolute inset-0 bg-linear-to-b from-green-500/5 to-transparent pointer-events-none" />

//                     <div className="relative mb-6">
//                         <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
//                         <div className="w-16 h-16 rounded-full bg-background border border-green-500/30 flex items-center justify-center relative z-10 shadow-sm">
//                             <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-500" />
//                         </div>
//                     </div>

//                     <h4 className="text-lg font-medium text-foreground mb-2 tracking-tight">End-to-End Secure</h4>
//                     <p className="text-sm text-muted-foreground mb-5">
//                         Only verified club members can view match history, head-to-head stats, and player profiles.
//                     </p>

//                     <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
//                         <Lock className="w-3.5 h-3.5" />
//                         <span>Private & Protected</span>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }