'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseStackingCardsResult {
  /** Attach to each card wrapper, in document order. */
  registerCard: (index: number) => (element: HTMLElement | null) => void;
  /** Index of the card currently on top of the stack. */
  activeIndex: number;
  /** Scrolls a partially covered card back into full view. */
  scrollToCard: (index: number) => void;
}

const TOLERANCE_PX = 2;

/**
 * Drives the "How it works" step cards.
 *
 * The stacking itself is CSS (`position: sticky` per card), so it stays smooth,
 * works in both scroll directions and survives any viewport height without JS
 * doing layout work. This hook only *reads* the resulting geometry, and writes
 * back the two things a stylesheet cannot work out for itself:
 *
 * - `activeIndex`   — which step is on top, so the product rail can follow it;
 * - `data-stacked`  — whether a card has reached its slot, which is what makes
 *                     it tighten into the pile;
 * - `--card-slack`  — how much shorter it is than the last card, which is what
 *                     makes the assembled pile leave as one block;
 * - `scrollToCard`  — the "tap a covered card to reveal it" behaviour.
 */
export function useStackingCards(): UseStackingCardsResult {
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const slackRef = useRef<number[]>([]);
  const stackedRef = useRef<boolean[]>([]);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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

    // Read everything first, write afterwards. Interleaving the two would force
    // a style recalculation per card on every scroll frame.
    const tops: number[] = [];
    const heights: number[] = [];
    const restings: (number | null)[] = [];

    cards.forEach((card, index) => {
      if (!card) {
        tops[index] = Number.POSITIVE_INFINITY;
        heights[index] = 0;
        restings[index] = null;

        return;
      }

      const rect = card.getBoundingClientRect();

      tops[index] = rect.top;
      heights[index] = rect.height;
      restings[index] = stickyTopFor(index);
    });

    let nextActive = 0;

    cards.forEach((card, index) => {
      if (!card) {
        return;
      }

      const resting = restings[index];

      // Without stacking (short window) the step that reads as current is
      // simply the last one whose top has passed the upper third of the screen.
      const threshold = resting ?? window.innerHeight / 3;

      if (tops[index] <= threshold + TOLERANCE_PX) {
        nextActive = index;
      }
    });

    /**
     * The one measurement the CSS cannot express.
     *
     * A sticky card is released at `container bottom − its own bottom margin −
     * its own height`. The bottom margins in the stylesheet are a ladder derived
     * from the peek, which equalises that moment only while the cards are the
     * same height — and they never are, because each step carries its own text.
     * The tallest card would reach the limit first and slide out on its own,
     * dragging the pile apart: the gaps stop being one peek each and the covered
     * taglines get sliced. Handing each card the difference between the last
     * card's height and its own makes `margin + height` identical across the
     * stack, so all four release on the same pixel and the assembled pile leaves
     * as one block, still a peek apart. The next card takes the same amount off
     * its negative top margin, so the column's own length is unchanged.
     *
     * The *last* card is the reference on purpose: measured against it its own
     * slack is zero, so the pile comes to rest with the bottom card flush to the
     * bottom of the column instead of floating above it, and the two columns of
     * the section end on the same line.
     */
    const last = heights[heights.length - 1] ?? 0;

    cards.forEach((card, index) => {
      if (!card) {
        return;
      }

      const slack = restings[index] === null ? 0 : Math.round(last - heights[index]);

      if (slackRef.current[index] !== slack) {
        slackRef.current[index] = slack;
        card.style.setProperty('--card-slack', `${slack}px`);
        cards[index + 1]?.style.setProperty('--prev-slack', `${slack}px`);
      }

      /**
       * A card tightens once it has arrived — and stays tight while the pile
       * slides away, which is why this is "has reached its slot" and not "is
       * exactly at its slot". Tying it to the card's own arrival rather than to
       * a progress figure for the whole stack is what keeps the padding from
       * creeping with the scroll: each card settles once, in its own moment,
       * over a transition the stylesheet owns.
       */
      const stacked = restings[index] !== null && tops[index] <= restings[index] + TOLERANCE_PX;

      if (stackedRef.current[index] !== stacked) {
        stackedRef.current[index] = stacked;
        card.toggleAttribute('data-stacked', stacked);
      }
    });

    setActiveIndex(nextActive);
  }, [stickyTopFor]);

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

  return { registerCard, activeIndex, scrollToCard };
}
