import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { mapGoogleVisualizationRowToMatch as mapgoogle } from "@/lib/match-mapping";
import type { Match } from "@/types/match";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const offset = (page - 1) * limit;

    if (!SHEET_ID || !groupId) return NextResponse.json({ matches: [] });

    const group = await fetchQuery(api.group.getGroupById, { groupId: groupId as any });
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    if (!group.isPublic) {
      const cookieStore = await cookies();
      const token = cookieStore.get("session")?.value;
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      try { await jwtVerify(token, JWT_SECRET); } catch (e) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }
    }

    const tq = encodeURIComponent(
      `SELECT * WHERE O = '${groupId}' ORDER BY B DESC LIMIT ${limit} OFFSET ${offset}`
    );
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=${tq}&sheet=${SHEET_NAME}`;

    const result = await fetch(url, { cache: "no-store" });
    const text = await result.text();

    if (text.trim().startsWith("<!DOCTYPE")) {
      return NextResponse.json({ matches: [], error: "Privacy settings blocking query engine" }, { status: 403 });
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
    // POST ALWAYS REQUIRES AUTH
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      body.userId,
      body.userName
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID!,
      range: `${SHEET_NAME}!A:Q`,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    return NextResponse.json({ id: matchId, ...body });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}