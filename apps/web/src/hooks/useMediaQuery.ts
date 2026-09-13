'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a media query through `useSyncExternalStore`, which is the
 * React-sanctioned way to read an external source: no state updates inside an
 * effect, and the server snapshot (`false`) keeps hydration stable.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQueryList = window.matchMedia(query);

      mediaQueryList.addEventListener('change', onStoreChange);

      return () => mediaQueryList.removeEventListener('change', onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** True when the user asked the OS to reduce motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** True once the component is running in the browser. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
