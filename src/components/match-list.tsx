"use client";

import { MatchCard } from "./match-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useMobile } from "@/hooks/use-mobile";
import type { Match } from "@/types/match";

interface MatchListProps {
  matches: Match[];
  isLoading?: boolean;
  loadingCount?: number;
}

function SkeletonMatchCard() {
  const isMobile = useMobile();

  return (
    <Card className="overflow-hidden rounded-none border border-border shadow-none w-full bg-muted/10">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-2 w-20">
            <Skeleton className="h-12 w-12 rounded-full" />
            {!isMobile && (
              <div className="text-sm text-center">
                <Skeleton className="h-5 w-16" />
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center rounded-none px-2 md:px-4">
            <div className="text-center rounded-none flex-1">
              <Skeleton className="h-9  w-6 mx-auto" />
            </div>
            <div className="text-center flex-1">
              <Skeleton className="h-9 w-6 mx-auto" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 w-20">
            <Skeleton className="h-12 w-12 rounded-full" />
            {!isMobile && (
              <div className="text-sm text-center">
                <Skeleton className="h-5 w-16" />
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-3 px-2">
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>
      </div>
    </Card>
  );
}


export function MatchList({
  matches,
  isLoading = false,
  loadingCount = 0,
}: MatchListProps) {
  if (isLoading && matches.length === 0) {
    return (
      <div>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonMatchCard key={i} />
        ))}
      </div>
    );
  }

  if (isLoading && matches.length > 0) {
    return (
      <div>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonMatchCard key={i} />
        ))}
      </div>
    );
  }

  if (!isLoading && matches.length === 0) {
    return (
      <Card className="p-6 rounded-none text-center shadow-none border border-border bg-muted/10">
        <p className="text-sm text-muted-foreground">No matches yet. Create one to get started.</p>
      </Card>
    );
  }

  return (
    <div>
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
      {loadingCount > 0 && (
        <>  
          {Array.from({ length: loadingCount }, (_, i) => (
            <SkeletonMatchCard key={`loading-${i}`} />
          ))}
        </>
      )}
    </div>
  );
}
