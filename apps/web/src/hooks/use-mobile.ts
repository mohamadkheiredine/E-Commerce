import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

const getSnapshot = () => window.matchMedia(QUERY).matches;

/** Server render and first client paint agree on "not mobile"; no hydration mismatch. */
const getServerSnapshot = () => false;

/**
 * `useSyncExternalStore` is the React-sanctioned way to read browser state like a
 * media query: it subscribes to the external source directly instead of copying it
 * into React state from inside an effect, which is what the previous version did and
 * what React 19's lint rules now reject.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
