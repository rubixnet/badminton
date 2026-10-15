import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * `useSyncExternalStore` gives the viewport value a stable server snapshot, so
 * the first client render matches the server HTML and React swaps in the real
 * width right after hydration. Seeding `useState` with `window.innerWidth`
 * instead would branch render output on a browser-only global and produce a
 * hydration mismatch on every mobile visit.
 */
function subscribe(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export { useIsMobile as useMobile };