"use client";

import type { Match } from "@/types/match";

interface MatchListProps {
    matches: Match[]
}

export function MatchList({ matches }: MatchListProps) {
    return (
        <ul className="space-y-2 px-4 pb-6">
            {matches.map((match) => (
                <li key={match.id} className="border rounded-md p-3">
                    {match.player1} ({match.player1Score}) vs {match.player2} ({match.player2Score})
                </li>
            ))}
        </ul>
    )
}