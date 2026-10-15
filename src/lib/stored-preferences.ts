"use client";

import { useCallback, useSyncExternalStore } from "react";

type Listener = () => void;

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

// A `storage` event only fires for writes made by *other* tabs, so it keeps
// the preference in sync across tabs but not within this one.
if (typeof window !== "undefined") {
  window.addEventListener("storage", emit);
}

export function readStoredPreference(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function writeStoredPreference(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
  emit();
}

/**
 * Reads a string-valued localStorage preference as state.
 *
 * The snapshot is the raw stored string, so it stays referentially stable
 * between reads (which `useSyncExternalStore` requires) and the server
 * snapshot is the fallback. That means the first client render matches the
 * server HTML, and React swaps in the stored value right after hydration —
 * no `setState` inside an effect and no hydration mismatch.
 */
export function useStoredPreference(
  key: string,
  fallback: string,
): [string, (value: string) => void] {
  const subscribe = useCallback((onStoreChange: Listener) => {
    listeners.add(onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(
    () => readStoredPreference(key) ?? fallback,
    [key, fallback],
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  const setValue = useCallback(
    (next: string) => writeStoredPreference(key, next),
    [key],
  );

  return [value, setValue];
}
