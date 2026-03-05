"use client";

import type { Match } from "@/types/match";
import { Card, CardContent } from "@/components/ui/card";

interface MatchListProps {
    matches: Match[]
}

export function MatchList({ matches }: MatchListProps) {
    return (
        <div className="space-y-4 px-4 pb-6">
            {matches.map((match) => (
                <Card key={match.id}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <div className="font-semibold">
                                    {match.team1.players[0].team1player1} & {match.team1.players[0].team1player2    }
                                </div>
                                <div className="text-2xl font-bold text-primary">
                                    {match.team1.score}
                                </div>
                            </div>
                            <div className="text-muted-foreground font-medium">vs</div>
                            <div className="text-center">
                                <div className="font-semibold">
                                    {match.team2.players[0].team2player1} & {match.team2.players[0].team2player2}
                                </div>
                                <div className="text-2xl font-bold text-primary">
                                    {match.team2.score}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}