// 'use client'

// import { useMemo } from 'react'
// import { cn } from '@/lib/utils'
// import {
//     Tooltip,
//     TooltipContent,
//     TooltipProvider,
//     TooltipTrigger,
// } from "@/components/ui/tooltip"

// export function ActivityHeatmap() {
//     const calendarData = useMemo(() => {
//         const weeks = 52
//         const days = 7
//         const grid = []
//         const today = new Date()
//         const startDate = new Date()
//         startDate.setDate(today.getDate() - (weeks * days) + 1)

//         for (let w = 0; w < weeks; w++) {
//             const week = []
//             for (let d = 0; d < days; d++) {
//                 const currentDate = new Date(startDate)
//                 currentDate.setDate(startDate.getDate() + (w * days + d))

//                 let count = 0
//                 const isWeekend = d === 0 || d === 6
//                 const chance = Math.random()

//                 if (isWeekend && chance > 0.4) count = Math.floor(Math.random() * 4) + 1
//                 else if (!isWeekend && chance > 0.85) count = Math.floor(Math.random() * 2) + 1
//                 if (w > 48 && chance > 0.3) count = Math.floor(Math.random() * 5) + 1

//                 week.push({
//                     date: currentDate,
//                     count: count,
//                     dateStr: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
//                 })
//             }
//             grid.push(week)
//         }
//         return grid
//     }, [])

//     const getColor = (count: number) => {
//         if (count === 0) return 'bg-muted/30 dark:bg-muted/10'
//         if (count === 1) return 'bg-primary/30'
//         if (count === 2) return 'bg-primary/60'
//         if (count === 3) return 'bg-primary/80'
//         return 'bg-primary'
//     }

//     return (
//         <TooltipProvider >
//             <div className="w-full flex flex-col items-center">
//                 <div className="w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
//                     <div className="min-w-max flex gap-[3px] p-2 mx-auto justify-center">
//                         {calendarData.map((week, wIdx) => (
//                             <div key={wIdx} className="flex flex-col gap-[3px]">
//                                 {week.map((day, dIdx) => (
//                                     <Tooltip key={`${wIdx}-${dIdx}`}>
//                                         <TooltipTrigger >
//                                             <div
//                                                 className={cn(
//                                                     "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] transition-all duration-200",
//                                                     getColor(day.count),
//                                                     day.count > 0 ? "hover:scale-125 hover:z-10 hover:ring-1 ring-foreground/50 cursor-crosshair relative" : "cursor-default"
//                                                 )}
//                                             />
//                                         </TooltipTrigger>
//                                         {day.count > 0 && (
//                                             <TooltipContent side="top" className="text-xs border shadow-sm rounded-md bg-background text-foreground px-3 py-2">
//                                                 <p className="font-medium">{day.dateStr}</p>
//                                                 <p className="text-muted-foreground">{day.count} match{day.count !== 1 ? 'es' : ''}</p>
//                                             </TooltipContent>
//                                         )}
//                                     </Tooltip>
//                                 ))}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//                 <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
//                     <span>Less</span>
//                     <div className="flex gap-1">
//                         {[0, 1, 2, 3, 4].map(l => (
//                             <div key={l} className={cn("w-3 h-3 rounded-[2px]", getColor(l))} />
//                         ))}
//                     </div>
//                     <span>More</span>
//                 </div>
//             </div>
//         </TooltipProvider>
//     )
// }
