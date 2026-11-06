import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { getMatchSession, getReadableMatchGroup } from "@/lib/match-access";
import { insertMatchRow, invalidateMatchSnapshot, MATCH_PAGE_SIZE, MATCH_SHEET, readGroupMatches } from "@/lib/match-store";
import type { Match, Team } from "@/types/match";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = MATCH_SHEET;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const group = await getReadableMatchGroup(searchParams.get("groupId"));
    if (group instanceof NextResponse) return group;
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? MATCH_PAGE_SIZE);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json({ error: "Invalid pagination." }, { status: 400 });
    }
    const matches = await readGroupMatches(group._id);
    const offset = (page - 1) * limit;
    return NextResponse.json({
      matches: matches.slice(offset, offset + limit),
      page,
      totalPages: Math.max(1, Math.ceil(matches.length / limit)),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Match read failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Scores could not be loaded. Check the score sheet configuration." }, { status: 502 });
  }
}

function isTeam(team: unknown): team is Team {
  if (!team || typeof team !== "object") return false;
  const { score, players } = team as Team;
  return Number.isSafeInteger(score) && score >= 0 &&
    Array.isArray(players) && players.length >= 1 && players.length <= 2 &&
    players.every((player) => player && typeof player.name === "string" &&
      player.name.trim().length > 0 && Number.isSafeInteger(player.bonusPoints ?? 0));
}

export async function POST(request: NextRequest) {
  try {
    const session = await getMatchSession();
    if (!session || typeof session.userId !== "string") {
      return NextResponse.json({ error: "Sign in again before saving a score." }, { status: 401 });
    }

    const body = await request.json().catch(() => null) as Partial<Match> | null;
    if (!body || !isTeam(body.team1) || !isTeam(body.team2) ||
        typeof body.groupId !== "string" || !/^[a-z0-9]{32}$/.test(body.groupId) ||
        (body.checkpoints !== undefined && !Array.isArray(body.checkpoints))) {
      return NextResponse.json({ error: "Enter valid players and scores for both teams." }, { status: 400 });
    }

    const profile = await fetchQuery(api.users.getProfile, { workosId: session.userId });
    if (!profile || profile.groupId !== body.groupId) {
      return NextResponse.json({ error: "You must be a member of this club to record scores." }, { status: 403 });
    }
    if (!SHEET_ID) {
      return NextResponse.json({ error: "Score storage is not configured (GOOGLE_SHEET_ID)." }, { status: 503 });
    }

    const { team1, team2 } = body;
    const winner = team1.score === team2.score ? "draw" : team1.score > team2.score ? "team1" : "team2";
    const match: Match = {
      id: `match_${randomUUID()}`,
      createdAt: new Date().toISOString(),
      winner,
      team1,
      team2,
      checkpoints: body.checkpoints ?? [],
      groupId: body.groupId,
      userId: profile._id,
      userName: profile.name,
    };

    await insertMatchRow(SHEET_ID, [
      match.id, match.createdAt, winner, team1.score, team2.score,
      team1.players[0].name, team1.players[0].bonusPoints ?? 0,
      team1.players[1]?.name ?? "", team1.players[1]?.bonusPoints ?? 0,
      team2.players[0].name, team2.players[0].bonusPoints ?? 0,
      team2.players[1]?.name ?? "", team2.players[1]?.bonusPoints ?? 0,
      JSON.stringify(match.checkpoints), match.groupId, match.userId, match.userName,
    ]);
    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("Match save failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Score could not be saved. Check the score sheet credentials and editor access." }, { status: 502 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const matchId = body.id;

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();

    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID!,
      range: `${SHEET_NAME}!A:Q`,
    });

    const rows = readResponse.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === matchId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const updatedValues = [[
      matchId,
      body.createdAt || new Date().toISOString(),
      body.team1.score > body.team2.score ? "team1" : "team2",
      body.team1.score,
      body.team2.score,
      body.team1.players[0]?.name || "",
      body.team1.players[0]?.bonusPoints || 0,
      body.team1.players[1]?.name || "",
      body.team1.players[1]?.bonusPoints || 0,
      body.team2.players[0]?.name || "",
      body.team2.players[0]?.bonusPoints || 0,
      body.team2.players[1]?.name || "",
      body.team2.players[1]?.bonusPoints || 0,
      JSON.stringify(body.checkpoints || []),
      body.groupId,
      body.userId,
      body.userName
    ]];

    const rangeToUpdate = `${SHEET_NAME}!A${rowIndex + 1}:Q${rowIndex + 1}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID!,
      range: rangeToUpdate,
      valueInputOption: "RAW",
      requestBody: { values: updatedValues },
    });

    invalidateMatchSnapshot();
    return NextResponse.json({ ...body, id: matchId });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("id");

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();

    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID!,
      range: `${SHEET_NAME}!A:Q`,
    });

    const rows = readResponse.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === matchId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID!,
      range: `${SHEET_NAME}!A${rowIndex + 1}:Q${rowIndex + 1}`,
    });

    invalidateMatchSnapshot();
    return NextResponse.json({ success: true, id: matchId });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
