"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Match } from "@/types/match";

interface MatchFormProps {
  onSubmit: (match: Match) => void;
  initialData?: Match;
  onCancel?: () => void;
}

export function MatchForm({ onSubmit, initialData, onCancel }: MatchFormProps) {
    const [player1, setPlayer1] = useState(initialData?.player1 ?? "");
    const [player2, setPlayer2] = useState(initialData?.player2 ?? "");
    const [player1Score, setPlayer1Score] = useState(
        initialData?.player1Score?.toString() ?? "0",
    );
    const [player2Score, setPlayer2Score] = useState(
        initialData?.player2Score?.toString() ?? "0",
    );

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        onSubmit({
            id: initialData?.id ?? crypto.randomUUID(),
            player1: player1.trim() || "Player 1",
            player2: player2.trim() || "Player 2",
            player1Score: Number(player1Score) || 0,
            player2Score: Number(player2Score) || 0,
        });

        if (!initialData) {
            setPlayer1("");
            setPlayer2("");
            setPlayer1Score("0");
            setPlayer2Score("0");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="player1">Player 1</Label>
                <Input
                    id="player1"
                    value={player1}
                    onChange={(e) => setPlayer1(e.target.value)}
                    placeholder="Player 1"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="player2">Player 2</Label>
                <Input
                    id="player2"
                    value={player2}
                    onChange={(e) => setPlayer2(e.target.value)}
                    placeholder="Player 2"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="player1Score">Player 1 Score</Label>
                    <Input
                        id="player1Score"
                        type="number"
                        min={0}
                        value={player1Score}
                        onChange={(e) => setPlayer1Score(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="player2Score">Player 2 Score</Label>
                    <Input
                        id="player2Score"
                        type="number"
                        min={0}
                        value={player2Score}
                        onChange={(e) => setPlayer2Score(e.target.value)}
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