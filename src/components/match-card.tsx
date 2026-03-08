"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useMobile } from "@/hooks/use-mobile";
import type { Match } from "@/types/match";

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useMobile();

  const getTeamInitials = (team: Match["team1"]) => {
    return team.players.map((p) => p.name.charAt(0).toUpperCase()).join("");
  };

  const getTeamNames = (team: Match["team1"]) => {
    return team.players
      .map((p) => `${p.name}${p.bonusPoints ? ` (${p.bonusPoints > 0 ? '+' : ''}${p.bonusPoints})` : ""}`)
      .join(" & ");
  };

  const winningTeam = match.team1.score > match.team2.score ? "team1" : "team2";
  const winningTeamInitials =
    winningTeam === "team1"
      ? getTeamInitials(match.team1)
      : getTeamInitials(match.team2);
  const pointDifference = Math.abs(match.team1.score - match.team2.score);

  return (
    <Card
      className="rounded-none overflow-hidden border border-border cursor-pointer transition-all hover:bg-muted/20 shadow-none w-full bg-muted/10"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-2 w-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary text-lg font-bold ring-1 ring-border">
              {getTeamInitials(match.team1)}
            </div>
            {!isMobile && (
              <div className="text-sm text-muted-foreground text-center font-medium">
                {getTeamNames(match.team1).split(" & ")[0]}
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center px-2 md:px-4">
            <div className="text-center flex-1">
              <div className="text-3xl font-normal text-foreground">
                {match.team1.score}
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="text-3xl font-normal text-foreground">
                {match.team2.score}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 w-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary text-lg font-bold ring-1 ring-border">
              {getTeamInitials(match.team2)}
            </div>
            {!isMobile && (
              <div className="text-sm text-muted-foreground text-center font-medium">
                {getTeamNames(match.team2).split(" & ")[0]}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-3 text-foreground text-sm font-normal px-2">
          Team {winningTeamInitials} won by {pointDifference} points
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-4 px-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-2 border-b border-border">
                <span className="text-muted-foreground">Team 1:</span>
                <span className="text-foreground font-normal text-right">
                  {getTeamNames(match.team1)}
                </span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-border">
                <span className="text-muted-foreground">Team 2:</span>
                <span className="text-foreground font-normal text-right">
                  {getTeamNames(match.team2)}
                </span>
              </div>
            </div>

            {(match.checkpoints?.length ?? 0) > 0 && (
              <div>
                <h4 className="text-sm text-foreground mb-3 uppercase tracking-wide font-normal">
                  Checkpoints
                </h4>
                <div className="space-y-2">
                  {match.checkpoints?.map((checkpoint, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm border border-border rounded-md p-3 bg-muted/30"
                    >
                      <div className="flex gap-4">
                        <span className="text-foreground font-normal">
                          {checkpoint.team1Score} - {checkpoint.team2Score}
                        </span>
                        {checkpoint.note && (
                          <span className="text-muted-foreground font-normal">
                            {checkpoint.note}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(checkpoint.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground font-mono pt-2">
              {new Date(match.createdAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </Card>

  );
}
