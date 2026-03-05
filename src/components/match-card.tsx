import { Card } from "@/components/ui/card"
import type { Match } from "@/types/match";


interface MatchCardProps {
    match: Match
}

export function MatchCard({ match }: MatchCardProps) {




    const getTeamInitials = (team: Match["team1"]) => {
        return team.players.map((player) => player.team1player1[0] + player.team1player2[0])
    }

    const winningTeam = match.team1.score > match.team2.score ? "team1" : "team2";
    const winningTeamInitials = winningTeam === "team1" ? getTeamInitials(match.team1) : getTeamInitials(match.team2);

    const pointDifference = Math.abs(match.team1.score - match.team2.score);

    return (

        <Card>
            <div className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center gap-2 w-20">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-10 text-primary text-lg font-bold ring-1 ring-border">
                            {getTeamInitials(match.team1).join("")}
                        </div>
                    </div>

                    <div className="flex-1 flex items-center px-2 md:px-4">
                        <div className="text-center flex-1">
                            <div className="text-3xl font-normal text-foreground">{match.team1.score}</div>

                        </div>
                        <div className="text-center flex-1">
                            <div className="text-3xl font-normal text-foreground">{match.team2.score}</div>

                        </div>
                    </div>


                    <div className="flex-flex-col items-center gap-2 w-20">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-10 text-primary text-lg font-old ring-1 ring-border">
                            {getTeamInitials(match.team2).join("")}
                        </div>
                    </div>

                </div>

                <div className="text-center mt-3 text-foreground text-sm font-normal px-2">
                    Team {winningTeamInitials} won by {pointDifference} point{pointDifference > 1 ? "s" : ""}
                </div>

            </div>
        </Card>
    )

}