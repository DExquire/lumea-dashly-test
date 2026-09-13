'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseStackingCardsOptions {
  /** Number of cards in the stack. */
  count: number;
}

interface UseStackingCardsResult {
  /** Attach to each card wrapper, in document order. */
  registerCard: (index: number) => (element: HTMLElement | null) => void;
  /** Index of the card currently on top of the stack. */
  activeIndex: number;
  /** 0 → nothing stacked yet, 1 → the whole stack is collapsed. */
  progress: number;
  /** Scrolls a partially covered card back into full view. */
  scrollToCard: (index: number) => void;
}

const TOLERANCE_PX = 2;

/**
 * Drives the "How it works" step cards.
 *
 * The stacking itself is CSS (`position: sticky` per card), so it stays smooth,
 * works in both scroll directions and survives any viewport height without JS
 * doing layout work. This hook only *reads* the resulting geometry to expose:
 *
 * - `activeIndex` — which step is on top, so the product rail can follow it;
 * - `progress`    — how far the stack has collapsed, used to tighten the
 *                   section padding while the cards pile up;
 * - `scrollToCard` — the "tap a covered card to reveal it" behaviour.
 */
export function useStackingCards({ count }: UseStackingCardsOptions): UseStackingCardsResult {
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  /**
   * The resting offset is read from the card's own resolved `top` instead of
   * being duplicated here as a constant: the CSS owns those numbers, they come
   * from a media query, and a copy in JS silently goes stale the moment the
   * design changes. `null` means this card is not sticky at all — on a window
   * too short for the pile the cards stay in flow.
   */
  const stickyTopFor = useCallback((index: number) => {
    const card = cardsRef.current[index];

    if (!card) {
      return null;
    }

    const resting = Number.parseFloat(window.getComputedStyle(card).top);

    return Number.isFinite(resting) ? resting : null;
  }, []);

  const measure = useCallback(() => {
    const cards = cardsRef.current;
    let nextActive = 0;
    let stackedCount = 0;

    cards.forEach((card, index) => {
      if (!card) {
        return;
      }

      const { top } = card.getBoundingClientRect();
      const resting = stickyTopFor(index);

      // Without stacking (short window) the step that reads as current is
      // simply the last one whose top has passed the upper third of the screen.
      const threshold = resting ?? window.innerHeight / 3;

      if (top <= threshold + TOLERANCE_PX) {
        nextActive = index;
        stackedCount = resting === null ? 0 : index;
      }
    });

    setActiveIndex(nextActive);
    setProgress(count > 1 ? stackedCount / (count - 1) : 0);
  }, [count, stickyTopFor]);

  const scheduleMeasure = useCallback(() => {
    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    // Measured on the next frame rather than synchronously: the first paint
    // stays untouched and no state is set inside the effect body.
    scheduleMeasure();

    window.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      window.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [scheduleMeasure]);

  // Ref setters are cached per index so React does not detach and re-attach
  // every card ref on each render.
  const settersRef = useRef(new Map<number, (element: HTMLElement | null) => void>());

  const registerCard = useCallback((index: number) => {
    const cached = settersRef.current.get(index);

    if (cached) {
      return cached;
    }

    const setter = (element: HTMLElement | null) => {
      cardsRef.current[index] = element;
    };

    settersRef.current.set(index, setter);

    return setter;
  }, []);

  const scrollToCard = useCallback(
    (index: number) => {
      const card = cardsRef.current[index];

      if (!card) {
        return;
      }

      // The card's position in the flow, not where it currently sits: once it is
      // stuck, its rectangle already reports the resting offset and the scroll
      // would be a no-op. Aligning the flow position with the slot lands exactly
      // on the moment the card joins the stack — fully visible, with the ones
      // after it still below.
      let flowTop = 0;

      for (let node: HTMLElement | null = card; node; node = node.offsetParent as HTMLElement | null) {
        flowTop += node.offsetTop;
      }

      const target = flowTop - (stickyTopFor(index) ?? 0);

      window.scrollTo({ top: Math.max(target, 0), behavior: 'smooth' });
    },
    [stickyTopFor],
  );

  return { registerCard, activeIndex, progress, scrollToCard };
}
