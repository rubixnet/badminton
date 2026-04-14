import { NextRequest, NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/google-sheets";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { groupId } = await req.json();
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID!,
      range: `${SHEET_NAME}!A:O`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(r => r[0] === params.id);

    if (rowIndex === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (rows[rowIndex][14] !== groupId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const ss = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID! });
    const sheetId = ss.data.sheets?.find(s => s.properties?.title === SHEET_NAME)?.properties?.sheetId || 0;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID!,
      requestBody: {
        requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 } } }]
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Delete failed" }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID!,
      range: `${SHEET_NAME}!A:O`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(r => r[0] === params.id);

    if (rowIndex === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (rows[rowIndex][14] !== body.groupId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const values = [[
      params.id, body.createdAt, body.winner,
      body.team1.score, body.team2.score,
      body.team1.players[0]?.name, body.team1.players[0]?.bonusPoints || 0,
      body.team1.players[1]?.name || "", body.team1.players[1]?.bonusPoints || 0,
      body.team2.players[0]?.name, body.team2.players[0]?.bonusPoints || 0,
      body.team2.players[1]?.name || "", body.team2.players[1]?.bonusPoints || 0,
      JSON.stringify(body.checkpoints || []),
      body.groupId, body.userId
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID!,
      range: `${SHEET_NAME}!A${rowIndex + 1}:P${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Update failed" }, { status: 500 }); }
}