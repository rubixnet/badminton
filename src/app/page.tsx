"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MatchList } from "@/components/match-list";
import { CreateMatchDialog } from "@/components/create-match-dialog";
import { CREATE_MATCH_EVENT } from "@/components/create-match-screen";
import { useMobile } from "@/hooks/use-mobile";
import { Navbar } from "@/components/navbar";
import { ArrowUpRight } from "lucide-react";
import type { Match } from "@/types/match";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMobile();
  const router = useRouter();

  const fetchMatches = async (pageNum: number, isBackground = false) => {
    if (isLoading && !isBackground && pageNum !== 1) return;
    if (!isBackground) setIsLoading(true);
    try {
      const response = await fetch(`/api/matches?page=${pageNum}&limit=20`);
      if (response.ok) {
        const data = await response.json();
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
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem("badminton_matches");
      let loadedFromCache = false;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMatches(parsed);
            setIsLoading(false);
            loadedFromCache = true;
          }
        } catch (e) {
          console.error(e);
        }
      }
      fetchMatches(1, loadedFromCache);
    };
    init();
  }, []);

  useEffect(() => {
    // Save to localStorage as backup
    if (matches.length > 0) {
      localStorage.setItem("badminton_matches", JSON.stringify(matches));
    }
  }, [matches]);

  useEffect(() => {
    const handleMatchCreated = (event: Event) => {
      const match = (event as CustomEvent<Match>).detail;

      setMatches((prev) => {
        if (prev.some((item) => item.id === match.id)) {
          return prev;
        }

        return [match, ...prev];
      });
    };

    window.addEventListener(CREATE_MATCH_EVENT, handleMatchCreated);

    return () => {
      window.removeEventListener(CREATE_MATCH_EVENT, handleMatchCreated);
    };
  }, []);


  const handleMatchCreated = async (newMatch: Match) => {
    const fallbackMatch: Match = {
      ...newMatch,
      id: newMatch.id || `local_${Date.now()}`,
      winner:
        newMatch.winner ??
        (newMatch.team1.score > newMatch.team2.score
          ? "team1"
          : newMatch.team2.score > newMatch.team1.score
            ? "team2"
            : "draw"),
    };

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMatch),
      });

      if (response.ok) {
        const savedMatch = await response.json();
        setMatches((prev) => [savedMatch, ...prev]);
        // Also save to localStorage for backup
        const updatedMatches = [savedMatch, ...matches];
        localStorage.setItem(
          "badminton_matches",
          JSON.stringify(updatedMatches),
        );
      } else {
        console.error("Failed to save to API, saving locally");
        setMatches((prev) => [fallbackMatch, ...prev]);
      }
    } catch (error) {
      console.error("Error saving match:", error);
      // Save locally
      setMatches((prev) => [fallbackMatch, ...prev]);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="relative z-10">
        <Navbar
          title="Badminton Tracker"
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