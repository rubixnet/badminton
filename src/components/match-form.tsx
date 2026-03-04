"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Match } from "@/types/match";
import { Toast } from "@base-ui/react";
import { toastManager } from "@/components/ui/toast"

interface MatchFormProps {
    onSubmit: (match: Match) => void;
    initialData?: Match;
    onCancel?: () => void;
}

export function MatchForm({ onSubmit, initialData, onCancel }: MatchFormProps) {
    const [team1player1, setTeam1player1] = useState(initialData?.team1player1 ?? "");
    const [team1player2, setTeam1player2] = useState(initialData?.team1player2 ?? "");
    const [team2player1, setTeam2player1] = useState(initialData?.team2player1 ?? "");
    const [team2player2, setTeam2player2] = useState(initialData?.team2player2 ?? "");
    const [team1score, setTeam1score] = useState(initialData?.team1score.toString() ?? "0");
    const [team2score, setTeam2score] = useState(initialData?.team2score.toString() ?? "0");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const team1ScoreNum = parseInt(team1score);
        const team2ScoreNum = parseInt(team2score);


        if (team1ScoreNum === team2ScoreNum) {
            toastManager.add({
            description: "There was a problem with your request.",
            title: "Uh oh! Something went wrong.",
            type: "error",
            });

            alert("Team 1 and Team 2 cannot have the same score.");
            return;
        }

        onSubmit({
            id: initialData?.id ?? crypto.randomUUID(),
            team1player1: team1player1.trim() || "Player 1",
            team1player2: team1player2.trim() || "Player 2",
            team2player1: team2player1.trim() || "Player 1",
            team2player2: team2player2.trim() || "Player 2",
            team1score: team1ScoreNum,
            team2score: team2ScoreNum,
        });

        if (!initialData) {
            setTeam1player1("");
            setTeam1player2("");
            setTeam2player1("");
            setTeam2player2("");
            setTeam1score("0");
            setTeam2score("0");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            <h1>Team 1</h1>
            <div className="space-y-2 flex gap-2">
                <div>
                    <Label htmlFor="team1player1">Player 1</Label>
                    <Input
                        id="team1player1"
                        value={team1player1}
                        onChange={(e) => setTeam1player1(e.target.value)}
                        placeholder="Team 1 Player 1"
                    />
                </div>

                <div>
                    <Label htmlFor="team1player2">Player 2</Label>
                    <Input
                        id="team1player2"
                        value={team1player2}
                        onChange={(e) => setTeam1player2(e.target.value)}
                        placeholder="Team 1 Player 2"
                    />
                </div>
            </div>



            <div className="grid grid-cols-2 gap-3">


                <div className="space-y-2">
                    <Label htmlFor="team1score">Team 1 Score</Label>
                    <Input
                        id="team1score"
                        type="number"
                        min={0}
                        value={team1score}
                        onChange={(e) => setTeam1score(e.target.value)}
                    />
                </div>
            </div>

            <h1>Team 2</h1>
            <div className="space-y-2 flex gap-2">
                <div>
                    <Label htmlFor="team2player1">Player 1</Label>
                    <Input
                        id="team2player1"
                        value={team2player1}
                        onChange={(e) => setTeam2player1(e.target.value)}
                        placeholder="Team 2 Player 1"
                    />
                </div>

                <div>
                    <Label htmlFor="team2player2">Player 2</Label>
                    <Input
                        id="team2player2"
                        value={team2player2}
                        onChange={(e) => setTeam2player2(e.target.value)}
                        placeholder="Team 2 Player 2"
                    />
                </div>



            </div>

            <div className="grid grid-cols-2 gap-3">


                <div className="space-y-2">
                    <Label htmlFor="team2score">Team 2 Score</Label>
                    <Input
                        id="team2score"
                        type="number"
                        min={0}
                        value={team2score}
                        onChange={(e) => setTeam2score(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit">Save Match</Button>
            </div>
        </form>
    );
}