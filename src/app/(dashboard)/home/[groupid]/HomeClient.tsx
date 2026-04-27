"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MatchList } from "@/components/match-list";
import { CreateMatchDialog } from "@/components/create-match-dialog";
import { useMobile } from "@/hooks/use-mobile";
import { Navbar } from "@/components/navbar";
import { ArrowUpRight, Plus, Home, BarChart2, User, Settings } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Match } from "@/types/match";
import type { Doc } from "../../../../../convex/_generated/dataModel";

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
  const liveGroup = useQuery(api.group.getGroupById, { groupId: group._id });
  const signalRefresh = useMutation(api.group.triggerRefresh);



  const fetchMatches = useCallback(async (pageNum: number, isBackground = false) => {
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
      console.error("Failed to fetch matches:", error);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [group._id]);

  useEffect(() => {
    fetchMatches(1);
  }, [fetchMatches]);

  useEffect(() => {
    if (liveGroup?.lastActivity) {
      console.log("New match detected in group! Refreshing...");
      fetchMatches(1, true);
    }
  }, [liveGroup?.lastActivity, fetchMatches]);

  const handleMatchCreated = async (newMatch: Match) => {
    const matchWithMeta: Match = {
      ...newMatch,
      id: `match_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userName: user.name,
      winner: newMatch.winner ?? (
        newMatch.team1.score > newMatch.team2.score ? "team1" :
          newMatch.team2.score > newMatch.team1.score ? "team2" : "draw"
      ),
    };

    setMatches((prev) => [matchWithMeta, ...prev]);
    setIsOpen(false);

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...matchWithMeta,
          groupId: group._id,
          userId: user._id,
          userName: user.name,
        }),
      });

      if (response.ok) {
        await signalRefresh({ groupId: group._id });
        console.log("Match archived and group notified.");
      } else {
        throw new Error("Sync Failed");
      }

    } catch (error) {
      console.error("Sync error:", error);
      fetchMatches(1, true);
    }
  };

  const triggerCreateMatch = () => {
    isMobile ? router.push("/matches/new") : setIsOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="relative z-10 pb-24 md:pb-0">
        <Navbar
          title={`${group.name} Tracker`}
          onCreateMatch={triggerCreateMatch}
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
                className="rounded-lg border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
                onClick={() => fetchMatches(page + 1)}
              >
                Load More
                <ArrowUpRight className="ml-2 h-4 w-4" />
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