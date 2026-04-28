import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { mapGoogleVisualizationRowToMatch } from "@/lib/match-mapping";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!SHEET_ID || !groupId) {
      return NextResponse.json({ matches: [] });
    }

    const group = await fetchQuery(api.group.getGroupById, { groupId: groupId as any });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (!group.isPublic) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        if (!token) {
          return NextResponse.json({ error: "Unauthorized access to private group" }, { status: 401 });
        }

        await jwtVerify(token, JWT_SECRET);
      } catch (e) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }
    }

    const tq = encodeURIComponent(`SELECT * WHERE O = '${groupId}' ORDER BY B DESC`);
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=${tq}&sheet=${SHEET_NAME}`;

    const res = await fetch(url, { cache: 'no-store' }); 
    const text = await res.text();
    
    if (text.trim().startsWith("<!DOCTYPE")) {
      return NextResponse.json(
        { matches: [], error: "Privacy settings blocking query engine" },
        { status: 403 }
      );
    }

    const jsonStr = text.substring(47).slice(0, -2);
    const json = JSON.parse(jsonStr);

    if (json.status === "error") {
        return NextResponse.json({ matches: [], error: "Query syntax error" }, { status: 500 });
    }

    const matches = json.table.rows.map(mapGoogleVisualizationRowToMatch).filter(Boolean);

    return NextResponse.json({ 
      matches, 
      groupName: group.name,
      isPublic: group.isPublic || false 
    });

  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: 'Failed to retrieve analytics' }, { status: 500 });
  }
}