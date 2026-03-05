"use client";

import type { Match } from "@/types/match";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";
import { MatchCard } from "./match-card";
import { is } from "react-day-picker/locale";



interface MatchListProps {
    matches: Match[]
    isLoading?: boolean;
    loadingCount?: number;
}

function SkeletonMatchCard() {
    return (
        <Card>
            <div>
                <div>
                    <div>
                        <Skeleton className="h-12 w-12 rounded-full" />
                    </div>

                    <div>
                        <div>
                            <Skeleton className="" />
                        </div>
                        <div>
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>

                    <div>
                        <Skeleton className="h-6 w-8" />
                    </div>
                </div>
                <div>
                    <Skeleton />
                </div>
            </div>
        </Card>

    )
}

export function MatchList({ matches, isLoading = false, loadingCount = 0 }: MatchListProps) {
    if (isLoading && matches.length === 0) {
        return (
            <div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <SkeletonMatchCard key={i} />
                ))}
            </div>
        );
    }

    return (
        <div>
            {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
            ))}
            
            {isLoading && loadingCount > 0 && (
                <>
                {Array.from({length: loadingCount}).map((_, i) => (
                    <SkeletonMatchCard key={i} />
                ))}
                </>
            )}
        </div>
    );
}