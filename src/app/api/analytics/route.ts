import { NextRequest, NextResponse } from "next/server";
import { getReadableMatchGroup } from "@/lib/match-access";
import { readGroupMatches } from "@/lib/match-store";

export async function GET(request: NextRequest) {
  try {
    const group = await getReadableMatchGroup(request.nextUrl.searchParams.get("groupId"));
    if (group instanceof NextResponse) return group;

    return NextResponse.json({
      matches: await readGroupMatches(group._id),
      groupName: group.name,
      isPublic: group.isPublic ?? false,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Analytics read failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Analytics could not be loaded. Check the score sheet configuration." }, { status: 502 });
  }
}
