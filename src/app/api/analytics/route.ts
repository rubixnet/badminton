import { NextRequest, NextResponse } from "next/server";
import { mapGVizRowToMatch } from "@/lib/match-mapping";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!SHEET_ID || !groupId) return NextResponse.json({ matches: [] });

    const tq = encodeURIComponent(`SELECT * WHERE O = '${groupId}' ORDER BY B DESC`);
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=${tq}&sheet=${SHEET_NAME}`;

    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));

    const matches = json.table.rows.map(mapGVizRowToMatch).filter(Boolean);

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: 'Analytics failed' }, { status: 500 });
  }
}