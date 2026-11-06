"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { MatchList } from "@/components/match-list";
import { useMobile } from "@/hooks/use-mobile";
import { Navbar } from "@/components/navbar";
import { ArrowUpRight, Filter, RotateCw } from "lucide-react";
import { Menu, MenuTrigger, MenuPopup, MenuRadioGroup, MenuRadioItem } from "@/components/ui/menu";
import { useQueryClient } from "@tanstack/react-query";
import { groupMatchesKey, useGroupMatches } from "@/lib/queries";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Match } from "@/types/match";
import type { Id } from "../../../../../convex/_generated/dataModel";

const CreateMatchDialog = dynamic(
  () => import("@/components/create-match-dialog").then((module) => module.CreateMatchDialog),
  { ssr: false },
);

interface HomeClientProps {
  user: {
    _id: Id<"users">;
    _creationTime: number;
    groupId?: Id<"groups">;
    role?: "admin" | "member";
    name: string;
    email: string;
    workosId: string;
    isOnboarded: boolean;
  } | null; 
  group: any;
}

export default function HomeClient({ user, group }: HomeClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const isMobile = useMobile();
  const router = useRouter();
  const queryClient = useQueryClient();
  const groupMatches = useGroupMatches(group._id);
  const liveGroup = useQuery(api.group.getGroupById, { groupId: group._id });
  const signalRefresh = useMutation(api.group.triggerRefresh);

  const loadPage = useCallback(
    async (pageNum: number) => {
      try {
        const response = await fetch(
          `/api/matches?groupId=${group._id}&page=${pageNum}&limit=20`,
          { signal: AbortSignal.timeout(15000) },
        );
        if (!response.ok) throw new Error("Could not load your matches. Please try again.");

        const data = await response.json();
        setLoadError(null);

        if (pageNum === 1) {
          setMatches(data.matches);
        } else {
          setMatches((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMatches = data.matches.filter(
              (m: Match) => !existingIds.has(m.id),
            );
            return [...prev, ...newMatches];
          });
        }

        setHasMore(data.page < data.totalPages);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch matches:", error);
        setLoadError("Could not load matches. Check your connection and try again.");
      }
    },
    [group._id],
  );

  const fetchMatches = useCallback(async (pageNum: number, isBackground = false) => {
    if (isBackground) {
      await loadPage(pageNum);
      return;
    }

    setIsLoading(true);
    try {
      await loadPage(pageNum);
    } finally {
      setIsLoading(false);
    }
  }, [loadPage]);

  useEffect(() => {
    fetchMatches(1);
  }, [fetchMatches]);

  useEffect(() => {
    const refresh = () => {
      void fetchMatches(1, true);
      void queryClient.invalidateQueries({ queryKey: groupMatchesKey(group._id) });
    };
    window.addEventListener("badminton:match-created", refresh);
    return () => window.removeEventListener("badminton:match-created", refresh);
  }, [fetchMatches, queryClient, group._id]);

  useEffect(() => {
    if (liveGroup?.lastActivity) {
      console.log("New match detected in group! Refreshing...");
      fetchMatches(1, true);
    }
  }, [liveGroup?.lastActivity, fetchMatches]);

  const handleMatchCreated = async (newMatch: Match) => {
    if (!user) return;

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
        const savedMatch = await response.json() as Match;
        setMatches((prev) => [savedMatch, ...prev]);
        setIsOpen(false);
        void queryClient.invalidateQueries({ queryKey: groupMatchesKey(group._id) });
        void signalRefresh({ groupId: group._id }).catch(console.error);
      } else {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Unable to save the score. Please try again.");
      }

    } catch (error) {
      console.error("Sync error:", error);
      throw error;
    }
  };

  const triggerCreateMatch = () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (isMobile) {
      router.push(`/home/${group._id}/matches/new`);
    } else {
      setIsOpen(true);
    }
  };
  const canCreateMatch = Boolean(user);
  const players = useMemo(() => Array.from(new Set((groupMatches.data?.matches ?? matches)
    .flatMap((match) => [...match.team1.players, ...match.team2.players])
    .map((player) => player.name.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [matches, groupMatches.data]);
  const visibleMatches = useMemo(() => (selectedPlayer ? groupMatches.data?.matches ?? matches : matches).filter((match) => {
    const players = [...match.team1.players, ...match.team2.players];
    return !selectedPlayer || players.some((player) => player.name.trim() === selectedPlayer);
  }), [matches, selectedPlayer, groupMatches.data]);

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="relative z-10 pb-24 md:pb-0">
        <Navbar
          title={`${group.name} Tracker`}
          titleAction={
            <Menu>
              <MenuTrigger render={<Button variant={selectedPlayer ? "secondary" : "ghost"} size="icon" />} aria-label={selectedPlayer ? `Filter matches: ${selectedPlayer}` : "Filter matches by player"} title={selectedPlayer ? `Player: ${selectedPlayer}` : "Filter by player"}>
                <Filter />
              </MenuTrigger>
              <MenuPopup align="start" className="w-56">
                <MenuRadioGroup value={selectedPlayer} onValueChange={setSelectedPlayer} aria-label="Player filter">
                  <MenuRadioItem value="">All players</MenuRadioItem>
                  {players.map((player) => <MenuRadioItem key={player} value={player}>{player}</MenuRadioItem>)}
                </MenuRadioGroup>
              </MenuPopup>
            </Menu>
          }
          onCreateMatch={canCreateMatch ? triggerCreateMatch : undefined}
          isAuthenticated={canCreateMatch}
        />

        <main className="mx-auto max-w-6xl px-3 pb-12 pt-3 md:px-6 md:pt-5">
          {loadError && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 p-4 text-sm"><p>{loadError}</p><Button variant="outline" size="sm" onClick={() => fetchMatches(page)}><RotateCw className="mr-2 size-4" />Retry</Button></div>}
          {!loadError && !isLoading && selectedPlayer && groupMatches.isPending && <p className="py-4 text-sm text-muted-foreground">Loading match history...</p>}
          {!loadError && !isLoading && matches.length > 0 && visibleMatches.length === 0 && !groupMatches.isPending && <p className="py-8 text-center text-sm text-muted-foreground">No matches for this player{groupMatches.isError ? " in the loaded records" : ""}.</p>}
          {(!loadError || matches.length > 0) && (visibleMatches.length > 0 || matches.length === 0 || isLoading) &&
          <MatchList
            matches={visibleMatches}
            isLoading={isLoading && page === 1}
            loadingCount={isLoading && page > 1 ? 2 : 0}
          />}

          {hasMore && !isLoading && !loadError && (!selectedPlayer || groupMatches.isError) && (
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

        {canCreateMatch && !isMobile && isOpen && (
          <CreateMatchDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            onMatchCreated={handleMatchCreated}
            groupId={group._id}
          />
        )}
      </div>
    </div>
  );
}
