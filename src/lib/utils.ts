import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Date-only label for match timestamps.
 *
 * `toLocaleDateString()` derives both the locale and the time zone from the
 * runtime, so the server and the browser can render different strings for the
 * same value and trip a hydration mismatch. Pinning the locale and reading the
 * instant in UTC makes the output identical on both sides.
 */
const matchDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDateLabel(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return matchDateFormatter.format(date);
}

const shortMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

const weekdayDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** "Jan" - for calendar month headers. */
export function formatMonthLabel(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return shortMonthFormatter.format(date);
}

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Fri, Jan 5, 2026" - for calendar tooltips and aria labels. */
export function formatFullDateLabel(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return fullDateFormatter.format(date);
}

/** "Fri, Jan 5" - for calendar day cells and tooltips. */
export function formatWeekdayLabel(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return weekdayDateFormatter.format(date);
}

/**
 * The browser origin, or an empty string during SSR.
 *
 * Callers use this for absolute URLs that only get read in event handlers
 * (copy-link, share), never during render, so an empty string on the server is
 * harmless and avoids touching `window` in the render path.
 */
export function readOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}
