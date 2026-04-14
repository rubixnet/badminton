"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { MatchList } from "@/components/match-list";
import { CreateMatchDialog } from "@/components/create-match-dialog";
import { useMobile } from "@/hooks/use-mobile";
import { Navbar } from "@/components/navbar";
import { ArrowUpRight } from "lucide-react";

import type { Match } from "@/types/match";
import type { Doc } from "../../convex/_generated/dataModel";

interface HomeClientProps {
  user: Doc<"users">;
  group: Doc<"groups">;
}

export default function HomeClient({ user, group }: HomeClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isMobile = useMobile();
  const router = useRouter();

  const syncToSheets = useAction(api.matches.recordMatchToSheets);

  const fetchMatches = useCallback(async (pageNum: number, isBackground = false) => {
    if (isLoading && !isBackground && pageNum !== 1) return;
    if (!isBackground) setIsLoading(true);

    try {
      const response = await fetch(`/api/matches?groupId=${group._id}&page=${pageNum}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (pageNum === 1) {
          setMatches(data.matches);
        } else {
          setMatches((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMatches = data.matches.filter((m: Match) => !existingIds.has(m.id));
            return [...prev, ...newMatches];
          });
        }
        
        setHasMore(data.page < data.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to fetch matches from Google Sheets:", error);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [group._id, isLoading]);

  useEffect(() => {
    fetchMatches(1);
  }, []);

  const handleMatchCreated = async (newMatch: Match) => {
    const matchWithMeta: Match = {
      ...newMatch,
      id: `match_${Date.now()}`,
      createdAt: new Date().toISOString(),
      winner: newMatch.winner ?? (
        newMatch.team1.score > newMatch.team2.score ? "team1" : 
        newMatch.team2.score > newMatch.team1.score ? "team2" : "draw"
      ),
    };

    setMatches((prev) => [matchWithMeta, ...prev]);
    setIsOpen(false);

    try {
      await syncToSheets({
        groupId: group._id,
        userId: user._id,
        userRole: user.role ?? "member",
        matchData: matchToSync(matchWithMeta), 
      });

      console.log("Match archived successfully to 5TB storage.");
    } catch (error) {
      console.error("Failed to sync match to Google Sheets:", error);
      fetchMatches(1, true);
    }
  };

  const matchToSync = (m: Match) => ({
    id: m.id,
    createdAt: m.createdAt,
    winner: m.winner,
    team1: m.team1,
    team2: m.team2,
    checkpoints: m.checkpoints || [],
  });

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="relative z-10">
        <Navbar
          title={`${group.name} Tracker`} // Your Group Name in the Navbar
          onCreateMatch={() =>
            isMobile ? router.push("/matches/new") : setIsOpen(true)
          }
        />

        <main className="mx-auto max-w-6xl px-3 pb-12 pt-3 md:px-6 md:pt-5">
          <MatchList
            matches={matches}
            isLoading={isLoading && page === 1}
            loadingCount={isLoading && page > 1 ? 2 : 0}
          />

          {hasMore && !isLoading && (
            <div className="flex justify-center pt-8">
              <Button
                variant="outline"
                className="rounded-lg"
                onClick={() => fetchMatches(page + 1)}
              >
                Load More
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </main>

        {!isMobile && (
          <CreateMatchDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            onMatchCreated={handleMatchCreated}
          />
        )}
      </div>
    </div>
  );
}