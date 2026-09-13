'use client';

import { useEffect } from 'react';

/**
 * Freezes page scrolling while an overlay is open, without the layout shift a
 * disappearing scrollbar would cause: the scrollbar width is compensated with
 * padding, and the scroll position is restored on unlock.
 */
export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) {
      return;
    }

    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [locked]);
}
