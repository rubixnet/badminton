import type { Match } from "@/types/match";

export function mapStandardRowToMatch(row: any): Match | null {
    try {
        if (!row[0]) return null;
        return {
            id: row[0],
            createdAt: row[1],
            winner: row[2] as "team1" | "team2" | "draw",
            team1: {
                score: parseInt(row[3] || "0"),
                players: [
                    { name: row[5] || "", bonusPoints: parseInt(row[6] || "0") },
                    ...(row[7] ? [{ name: row[7], bonusPoints: parseInt(row[8] || "0") }] : []),
                ]
            },
            team2: {
                score: parseInt(row[4] || "0"),
                players: [
                    { name: row[9] || "", bonusPoints: parseInt(row[10] || "0") },
                    ...(row[11] ? [{ name: row[11], bonusPoints: parseInt(row[12] || "0") }] : []),
                ]
            },

            checkpoints: row[13] ? JSON.parse(row[13]) : [],
            groupId: row[14],
            userId: row[15],
        } as Match;
    } catch (e) { return null; }
}

export function mapGoogleVisualizationRowToMatch(row: any): Match | null {
    try {
        const cellsData = row.c;
        if (!cellsData[0]?.v) return null;

        return {
            id: cellsData[0]?.v,
            createdAt: cellsData[1]?.v,
            winner: cellsData[2]?.v as "team1" | "team2" | "draw",
            team1: {
                score: parseInt(cellsData[3]?.v || "0"),
                players: [
                    { name: cellsData[5]?.v || "", bonusPoints: parseInt(cellsData[6]?.v || "0") },
                    ...(cellsData[7]?.v ? [{ name: cellsData[7]?.v, bonusPoints: parseInt(cellsData[8]?.v || "0") }] : []),
                ]
            },
            team2: {
                score: parseInt(cellsData[4]?.v || "0"),
                players: [
                    { name: cellsData[9]?.v || "", bonusPoints: parseInt(cellsData[10]?.v || "0") },
                    ...(cellsData[11]?.v ? [{ name: cellsData[11]?.v, bonusPoints: parseInt(cellsData[12]?.v || "0") }] : []),
                ]
            },
            checkpoints: cellsData[13]?.v ? JSON.parse(cellsData[13]?.v) : [],
            groupId: cellsData[14]?.v,
            userId: cellsData[15]?.v,
        } as Match;
    } catch (e) { return null; }
}
