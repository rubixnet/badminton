import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { mapStandardRowToMatch } from "@/lib/match-mapping";
import type { Match } from "@/types/match";

export const MATCH_SHEET = "Sheet1";
export const MATCH_PAGE_SIZE = 20;
const CACHE_MS = 10_000;
type Snapshot = Map<string, Match[]>;
let cached: { data: Snapshot; expires: number } | undefined;
let pending: Promise<Snapshot> | undefined;

export function invalidateMatchSnapshot() {
  cached = undefined;
  pending = undefined;
}

export async function insertMatchRow(spreadsheetId: string, values: (string | number)[]) {
  const sheets = await getGoogleSheetsClient();
  const { data } = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  }, { timeout: 10_000 });
  const sheetId = data.sheets?.find((sheet) => sheet.properties?.title === MATCH_SHEET)?.properties?.sheetId;
  if (sheetId == null) throw new Error("Score tab not found");

  // Row 1 contains the settings cell Q1; insert directly below it.
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [
      { insertDimension: { range: { sheetId, dimension: "ROWS", startIndex: 1, endIndex: 2 } } },
      { updateCells: {
        start: { sheetId, rowIndex: 1, columnIndex: 0 },
        fields: "userEnteredValue",
        rows: [{ values: values.map((value) => ({
          userEnteredValue: typeof value === "number" ? { numberValue: value } : { stringValue: value },
        })) }],
      } },
    ] },
  }, { timeout: 10_000, retry: false });
  invalidateMatchSnapshot();
}

async function readSnapshot(): Promise<Snapshot> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
  const sheets = await getGoogleSheetsClient();
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: MATCH_SHEET,
  }, { timeout: 10_000 });
  const groups: Snapshot = new Map();
  const seen = new Set<string>();
  for (const row of result.data.values ?? []) {
    // Older appends could place an entire record at M instead of A.
    const candidates = [row];
    if (typeof row[12] === "string" && /^match_[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(row[12])) {
      candidates.push(row.slice(12));
    }
    for (const candidate of candidates) {
      const match = mapStandardRowToMatch(candidate);
      if (!match?.groupId || !Number.isFinite(Date.parse(match.createdAt)) || seen.has(match.id)) continue;
      seen.add(match.id);
      const matches = groups.get(match.groupId) ?? [];
      matches.push(match);
      groups.set(match.groupId, matches);
    }
  }
  for (const matches of groups.values()) {
    matches.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
  return groups;
}

export async function readGroupMatches(groupId: string) {
  if (cached && cached.expires > Date.now()) return cached.data.get(groupId) ?? [];
  if (!pending) {
    const request = readSnapshot().then((data) => {
      if (pending === request) cached = { data, expires: Date.now() + CACHE_MS };
      return data;
    }).finally(() => {
      if (pending === request) pending = undefined;
    });
    pending = request;
  }
  return (await pending).get(groupId) ?? [];
}
