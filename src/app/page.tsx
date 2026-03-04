"use client"

import { Button } from "@/components/ui/button";
import { MatchList } from "@/components/match-list";
import type { Match } from "@/types/match";
import Navbar from "@/components/navbar";
import { useState } from "react";

export default function Page() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchMatches = async (pageNumber: number, isBackground = false): Promise<Match[]> => {
    try {
      const response = await fetch(`/api/matches?page=${pageNumber}&limit=25`);
      if (response.ok) {
        const data = await response.json();
        if (pageNumber === 1) {
          setMatches(data.matches);
        } else {
          setMatches((prev) => {
            const existingIds = new Set(prev.map((match) => match.id));
            const newMatches = data.matches.filter((match: Match) => !existingIds.has(match.id));
            return [...prev, ...newMatches];
          });
        }
        setHasMore(data.page < data.totalPages);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
    return [];
  };

  const sortedMatches = matches; // placeholder

  const handleMatchCreated = (match: Match) => {
    setMatches((prev) => [match, ...prev]);
  };

  return (
    <div className="min-h-screen">
      <Navbar onMatchCreated={handleMatchCreated} />
      <main className="max-w-6xl mx-auto p-0 space-y-6">
        <MatchList matches={sortedMatches} />
      </main>
    </div>
  );
}
