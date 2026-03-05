import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import type { Match } from '@/types/match';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";

export async function GET(request: NextRequest) {
    try {
        if (!SHEET_ID) {
            console.error("missing google sheet id");
            return NextResponse.json({ error: "Google Sheet ID is not configured" }, { status: 500 });
        }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const sheets = await getGoogleSheetsClient();


    const countResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:A`
    });
    
    const totalRows = countResponse.data.values ? countResponse.data.values.length : 0
    
    if (totalRows <= 1) {
        return NextResponse.json({ matches: [], total: 0, page, totalPages: 0 });
    }

    const dataRows = totalRows - 1
    const totalPages = Math.ceil(dataRows / limit);

    const startIndex = 2 + (page - 1) * limit
    const endIndex = Math.min(startIndex + limit - 1, totalRows)

    if (startIndex > totalRows) {
        return NextResponse.json({ matches: [], total: dataRows, page, totalPages });
    }

    const range = `${SHEET_NAME}!A${startIndex}:H${endIndex}`;

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range,
    })

    const rows = (response.data.values || []).reverse();

    const matches: Match[] = rows.map((row: string[]) => {
        const team1player2 = row[4]?.trim();
        const team2player2 = row[7]?.trim();

        return {
            id: row[0],
            createdAt: row[1],
            team1: {
                score: parseInt(row[2]) || 0,
                players: [
                    {
                        team1player1: row[3],
                        ...(team1player2 ? { team1player2 } : {})
                    },
                ] as any
            },
            team2: {
                score: parseInt(row[5]) || 0,
                players: [
                    {
                        team2player1: row[6],
                        ...(team2player2 ? { team2player2 } : {})
                    },
                ] as any
            }
        };
    })

    return NextResponse.json({ matches, total: dataRows, page, totalPages });
    } catch (error) {
        console.error('Error fetching matches:', error);
        return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
}


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const sheets = await getGoogleSheetsClient();

        const match = {
            id: `match-${Date.now()}`,
            createdAt: body.createdAt,
            team1 : body.team1,
            team2 : body.team2,
            winner: { "1": "team1", "-1": "team2" }[Math.sign(body.team1.score - body.team2.score)]
        }; 

        const values = [[match.id, match.createdAt, match.team1.score, match.team1.players[0].team1player1, match.team1.players[0].team1player2, match.team2.score, match.team2.players[0].team2player1, match.team2.players[0].team2player2]];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:H`,
            valueInputOption: "RAW",
            requestBody: { values}
        });

        return NextResponse.json({ match });
    } catch (error) {
        console.error('Error creating match:', error);
        return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
    }
}

