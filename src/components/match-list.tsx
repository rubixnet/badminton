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
                    {match.team1player1} {match.team1player2} ({match.team1score}) vs {match.team2player1} {match.team2player2} ({match.team2score})   
                </li>
            ))}
        </ul>
    )
}