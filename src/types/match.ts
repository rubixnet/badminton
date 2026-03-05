export interface Match {
    id: string;
    createdAt: string;
    team1: {
        score: number;
        players: {
            team1player1: string;
            team1player2: string;
        }[];
    };
    team2: {
        score: number;
        players: {
            team2player1: string;
            team2player2: string;
        }[];
    };
    winner?: string;
}