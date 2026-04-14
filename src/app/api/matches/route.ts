import { NextRequest, NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import type { Match } from "@/types/match";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";

export async function GET(request: NextRequest) {
  try {
    if (!SHEET_ID) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const sheets = await getGoogleSheetsClient();
    // First, get the total number of rows to calculate the range
    // We'll just read column A to be efficient
    const countResponse = await sheets.spreadsheets.values.get({ 
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const totalRows = countResponse.data.values?.length || 0;
    // If totalRows is 0 or 1 (header only), return empty
    if (totalRows <= 1) {
      return NextResponse.json({ matches: [], total: 0, page, totalPages: 0 });
    }

    // Calculate range for pagination (fetching from bottom up)
    // Data starts at row 2.
    // Total data rows = totalRows - 1
    // Latest match is at row `totalRows`
    // Page 1 (limit 20): Rows (totalRows - 19) to totalRows

    const dataRows = totalRows - 1;
    const totalPages = Math.ceil(dataRows / limit);

    const endIndex = totalRows - (page - 1) * limit;
    let startIndex = endIndex - limit + 1;

    // Ensure we don't go below row 2
    if (startIndex < 2) startIndex = 2;

    // If we've gone past the beginning of the data
    if (endIndex < 2) {
      return NextResponse.json({
        matches: [],
        total: dataRows,
        page,
        totalPages,
      });
    }

    const range = `${SHEET_NAME}!A${startIndex}:N${endIndex}`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range,
    });

    const rows = response.data.values || [];

    const matches: Match[] = rows
      .map((row: string[]) => {
        try {
          // Backward compatibility: Check if first column is JSON
          if (row[0] && row[0].trim().startsWith("{")) {
            return JSON.parse(row[0]);
          }

          if (!row[0]) return null;

          return {
            id: row[0],
            createdAt: row[1],
            winner: row[2] as "team1" | "team2" | "draw",
            team1: {
              score: parseInt(row[3] || "0"),
              players: [
                { name: row[5] || "", bonusPoints: parseInt(row[6] || "0") },
                ...(row[7]
                  ? [{ name: row[7], bonusPoints: parseInt(row[8] || "0") }]
                  : []),
              ],
            },
            team2: {
              score: parseInt(row[4] || "0"),
              players: [
                { name: row[9] || "", bonusPoints: parseInt(row[10] || "0") },
                ...(row[11]
                  ? [{ name: row[11], bonusPoints: parseInt(row[12] || "0") }]
                  : []),
              ],
            },
            checkpoints: row[13] ? JSON.parse(row[13]) : [],
          } as Match;
        } catch (e) {
          return null;
        }
      })
      .filter((match): match is Match => match !== null)
      .reverse(); // Reverse to show latest first within the page

    return NextResponse.json({
      matches,
      total: dataRows,
      page,
      totalPages,
    });
  } catch (error) {
    return NextResponse.json({ matches: [], total: 0, page: 1, totalPages: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!SHEET_ID) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const body = await request.json();

    const sheets = await getGoogleSheetsClient();

    // Check write access
    const settingsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!P1`,
    });
    const settingsValue = settingsResponse.data.values?.[0]?.[0];
    if (settingsValue) {
      try {
        const settings = JSON.parse(settingsValue);
        if (settings.writeAccess === false) {
          return NextResponse.json(
            { error: "New matches are currently disabled by admin" },
            { status: 403 },
          );
        }
      } catch (e) {
        // ignore
      }
    }

    const match: Match = {
      id: `match_${Date.now()}`,
      team1: body.team1,
      team2: body.team2,
      checkpoints: body.checkpoints || [],
      createdAt: body.createdAt || new Date().toISOString(),
      winner:
        body.team1.score > body.team2.score
          ? "team1"
          : body.team2.score > body.team1.score
            ? "team2"
            : "draw",
    };

    // Save to Google Sheets
    // A: ID, B: CreatedAt, C: Winner, D: T1Score, E: T2Score
    // F: T1P1Name, G: T1P1Bonus, H: T1P2Name, I: T1P2Bonus
    // J: T2P1Name, K: T2P1Bonus, L: T2P2Name, M: T2P2Bonus
    // N: Checkpoints
    const values = [
      [
        match.id,
        match.createdAt,
        match.winner,
        match.team1.score,
        match.team2.score,
        match.team1.players[0]?.name || "",
        match.team1.players[0]?.bonusPoints || 0,
        match.team1.players[1]?.name || "",
        match.team1.players[1]?.bonusPoints || 0,
        match.team2.players[0]?.name || "",
        match.team2.players[0]?.bonusPoints || 0,
        match.team2.players[1]?.name || "",
        match.team2.players[1]?.bonusPoints || 0,
        JSON.stringify(match.checkpoints),
      ],
    ];

    const range = `${SHEET_NAME}!A:N`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    return NextResponse.json(match);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const sheets = await getGoogleSheetsClient();

    // Find the row index
    const idResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const rows = idResponse.data.values || [];
    const rowIndex = rows.findIndex((row: string[]) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Row number is index + 1
    const rowNumber = rowIndex + 1;

    // We will clear the row content
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:N${rowNumber}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete match" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id)
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const sheets = await getGoogleSheetsClient();

    // Find the row index
    const idResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const rows = idResponse.data.values || [];
    const rowIndex = rows.findIndex((row: string[]) => row[0] === body.id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const rowNumber = rowIndex + 1;

    const match = body;

    const winner =
      match.team1.score > match.team2.score
        ? "team1"
        : match.team2.score > match.team1.score
          ? "team2"
          : "draw";

    const values = [
      [
        match.id,
        match.createdAt,
        winner,
        match.team1.score,
        match.team2.score,
        match.team1.players[0]?.name || "",
        match.team1.players[0]?.bonusPoints || 0,
        match.team1.players[1]?.name || "",
        match.team1.players[1]?.bonusPoints || 0,
        match.team2.players[0]?.name || "",
        match.team2.players[0]?.bonusPoints || 0,
        match.team2.players[1]?.name || "",
        match.team2.players[1]?.bonusPoints || 0,
        JSON.stringify(match.checkpoints || []),
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:N${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 },
    );
  }
}