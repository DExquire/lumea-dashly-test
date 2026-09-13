'use client';

import { useEffect, useState } from 'react';

interface RotatingIndexOptions {
  /** Number of items to cycle through. */
  length: number;
  /** How long each item stays visible. */
  intervalMs?: number;
  /** Temporarily stops the rotation (e.g. while the user hovers the bar). */
  paused?: boolean;
}

const DEFAULT_INTERVAL_MS = 4_000;

/**
 * Cycles through indices 0..length-1 and wraps back to the first one, which is
 * what the announcement bar needs. The timer is suspended while the tab is
 * hidden, so the bar does not race through messages in the background.
 *
 * The returned value is taken modulo the current length, so removing messages
 * in the CMS can never leave the bar pointing at an index that no longer exists.
 */
export function useRotatingIndex({
  length,
  intervalMs = DEFAULT_INTERVAL_MS,
  paused = false,
}: RotatingIndexOptions): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused || length <= 1) {
      return;
    }

    let timer: number | undefined;

    const start = () => {
      timer = window.setInterval(() => {
        setTick((current) => current + 1);
      }, intervalMs);
    };

    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else if (timer === undefined) {
        start();
      }
    };

    if (!document.hidden) {
      start();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, length, paused]);

  return length > 0 ? tick % length : 0;
}
