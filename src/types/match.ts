export interface Player {
    name: string;
    bonusPoints: number;
}

export interface Team {
    players: Player[];
    score: number;
}

export interface Checkpoint {
    team1Score: number;
    team2Score: number;
    note?: string;
    timestamp: string;
}

export interface Match {
    id: string;
    team1: Team;
    team2: Team;
    checkpoints: Checkpoint[];
    createdAt: string;
    winner?: "team1" | "team2" | "draw";
    groupId: string;
    userId: string;
    userName: string;
}
