import { NextRequest, NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { mapGoogleVisualizationRowToMatch as mapgoogle } from "@/lib/match-mapping";
import type { Match } from "@/types/match";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const offset = (page - 1) * limit;

    if (!SHEET_ID || !groupId) return NextResponse.json({ matches: [] });

    const tq = encodeURIComponent(
      `SELECT * WHERE O = '${groupId}' ORDER BY B DESC LIMIT ${limit} OFFSET ${offset}`
    );
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=${tq}&sheet=${SHEET_NAME}`;

    const result = await fetch(url, { cache: "no-store" });
    const text = await result.text();

    if (text.trim().startsWith("<!DOCTYPE")) {
      return NextResponse.json(
        { matches: [], error: "Privacy settings blocking query engine" },
        { status: 403 }
      );
    }

    try {
      const jsonStr = text.substring(47).slice(0, -2);
      const json = JSON.parse(jsonStr);

      if (json.status === "error") {
        return NextResponse.json({ matches: [], error: "Query syntax error" }, { status: 500 });
      }

      const matches = json.table.rows
        .map(mapgoogle)
        .filter((m: any): m is Match => m !== null);

      return NextResponse.json({
        matches,
        page,
        totalPages: matches.length < limit ? page : page + 1,
      });
    } catch (e) {
      return NextResponse.json({ matches: [], error: "Invalid data format" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ matches: [], error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sheets = await getGoogleSheetsClient();
    const matchId = `match_${Date.now()}`;

    const values = [[
      matchId,
      body.createdAt || new Date().toISOString(),
      body.team1.score > body.team2.score ? "team1" : "team2",
      body.team1.score,
      body.team2.score,
      body.team1.players[0]?.name,
      body.team1.players[0]?.bonusPoints || 0,
      body.team1.players[1]?.name || "",
      body.team1.players[1]?.bonusPoints || 0,
      body.team2.players[0]?.name,
      body.team2.players[0]?.bonusPoints || 0,
      body.team2.players[1]?.name || "",
      body.team2.players[1]?.bonusPoints || 0,
      JSON.stringify(body.checkpoints || []),
      body.groupId,
      body.userId
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID!,
      range: `${SHEET_NAME}!A:P`,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    return NextResponse.json({ id: matchId, ...body });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}