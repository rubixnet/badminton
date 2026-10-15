import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Match } from "@/types/match";

export interface SessionUser {
  userId: string;
  email: string;
  name?: string;
  isOnboarded?: boolean;
  groupId?: string;
}

export interface GroupMatches {
  matches: Match[];
  strictMode: boolean;
}

export interface FormSettings {
  bonusEnabled: boolean;
}

/**
 * `/api/analytics` is backed by a live Google Sheets query, so a shared entry
 * that every consumer on the page reads is cheaper than one request per
 * component, and `refetchOnWindowFocus` is off so leaving and returning to the
 * tab does not re-hit the sheet.
 */
const GROUP_MATCHES_STALE_TIME = 60_000;
const SESSION_STALE_TIME = 60_000;
const FORM_SETTINGS_STALE_TIME = 5 * 60_000;

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`GET ${url} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export const groupMatchesKey = (groupId: string) =>
  ["group-matches", groupId] as const;
export const sessionKey = ["session"] as const;
export const formSettingsKey = ["form-settings"] as const;

async function fetchGroupMatches(groupId: string): Promise<GroupMatches> {
  const data = await readJson<{ matches?: Match[]; strictMode?: boolean }>(
    `/api/analytics?groupId=${encodeURIComponent(groupId)}`,
    { cache: "no-store" },
  );
  return { matches: data.matches ?? [], strictMode: data.strictMode ?? false };
}

export function useGroupMatches(groupId: string | undefined) {
  return useQuery({
    queryKey: groupMatchesKey(groupId ?? ""),
    queryFn: () => fetchGroupMatches(groupId as string),
    enabled: Boolean(groupId),
    staleTime: GROUP_MATCHES_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

async function fetchSession(): Promise<SessionUser> {
  return readJson<SessionUser>("/api/auth/me", { credentials: "include" });
}

export function useSession(
  options: { enabled?: boolean } = {},
): UseQueryResult<SessionUser, Error> {
  return useQuery({
    queryKey: sessionKey,
    queryFn: fetchSession,
    enabled: options.enabled ?? true,
    staleTime: SESSION_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

async function fetchFormSettings(): Promise<FormSettings> {
  const data = await readJson<{ bonusEnabled?: boolean }>("/api/settings", {
    cache: "no-store",
  });
  return { bonusEnabled: data.bonusEnabled ?? false };
}

export function useFormSettings(
  options: { enabled?: boolean } = {},
): UseQueryResult<FormSettings, Error> {
  return useQuery({
    queryKey: formSettingsKey,
    queryFn: fetchFormSettings,
    enabled: options.enabled ?? true,
    staleTime: FORM_SETTINGS_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
