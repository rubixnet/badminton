import { NextRequest, NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/google-sheets";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    if (!SHEET_ID) {
      return NextResponse.json({ error: "Config error" }, { status: 500 });
    }

    const id = params.id;
    const sheets = await getGoogleSheetsClient();

    // 1. Find the row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: string[]) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Get Sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === SHEET_NAME,
    );
    const sheetIdToUse = sheet?.properties?.sheetId || 0;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetIdToUse,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: "Failed to delete match" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    if (!SHEET_ID)
      return NextResponse.json({ error: "Config error" }, { status: 500 });

    const id = params.id;
    const body = await request.json();
    const sheets = await getGoogleSheetsClient();

    // 1. Find the row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: string[]) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Construct the row data
    // A: ID, B: CreatedAt, C: Winner, D: T1Score, E: T2Score
    // F: T1P1Name, G: T1P1Bonus, H: T1P2Name, I: T1P2Bonus
    // J: T2P1Name, K: T2P1Bonus, L: T2P2Name, M: T2P2Bonus
    // N: Checkpoints

    const match = body;
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
        JSON.stringify(match.checkpoints || []),
      ],
    ];

    // Update the row (rowIndex + 1 because Sheets is 1-indexed)
    const range = `${SHEET_NAME}!A${rowIndex + 1}:N${rowIndex + 1}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 },
    );
  }
}