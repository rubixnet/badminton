import type { Match } from "@/types/match";

type MatchLike = Pick<Match, "team1" | "team2">;

function collectNames(matches: MatchLike[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  const pushName = (raw: unknown) => {
    if (typeof raw !== "string") return;
    const name = raw.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(name);
  };
  for (const match of matches) {
    match.team1?.players?.forEach((p) => pushName(p?.name));
    match.team2?.players?.forEach((p) => pushName(p?.name));
  }
  return names.sort((a, b) => a.localeCompare(b));
}

/**
 * The single source of player profiles: the same match records that power
 * the Profiles dropdown and player analytics pages. Cache-first so the list
 * is instant when match data was loaded before.
 */
export async function fetchProfilePlayers(groupId: string): Promise<string[]> {
  const cacheKey = `badminton_analytics_matches_${groupId}`;

  try {
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.matches)) {
        const cached = collectNames(parsed.matches as MatchLike[]);
        if (cached.length > 0) return cached;
      }
    }
  } catch {
    // Corrupt cache — fall through to network.
  }

  try {
    const res = await fetch(`/api/analytics?groupId=${encodeURIComponent(groupId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data && Array.isArray(data.matches)) {
      return collectNames(data.matches as MatchLike[]);
    }
  } catch (error) {
    console.error("Failed to load player profiles:", error);
  }

  return [];
}
