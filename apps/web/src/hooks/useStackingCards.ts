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
 * How far a card has to climb back off its slot before it counts as released.
 *
 * Joining and leaving the pile cannot share one threshold. A card resting on
 * its slot reports a `top` that wanders by a fraction of a pixel — sub-pixel
 * layout, a smooth-scroll frame landing mid-pixel, a trackpad easing out — and
 * with a single line to cross that wander flipped the attribute back and forth
 * several times a second. Every flip retightens the padding and takes the link
 * out and puts it back, which is the jitter you see at the boundary. Letting it
 * leave only once it is 14px clear puts that wander well inside the dead band.
 */
const RELEASE_PX = 14;

/**
 * The least a card gets to itself, in pixels of scroll, after reaching its slot.
 *
 * A floor rather than the rule: normally a card holds its full form until the
 * next one actually reaches its bottom edge (see `cover` below), which is both
 * later than this and tied to the layout instead of to a number. This only
 * matters where there is no next card — step 04 — and as the value that
 * reproduces the old behaviour: with `--stack-dwell: 0` the cards are a 26px gap
 * apart, `cover` lands 26px after arrival, and the fold falls back to this lead
 * exactly as it did before.
 */
const SETTLE_LEAD_PX = 120;

/**
 * How much empty page has to show under a card before it counts as read.
 *
 * A card must not start rearranging itself while part of it is still below the
 * fold — that is the whole complaint the dwell exists to answer, and the dwell
 * alone cannot promise it: where a card parks is a sum of the stack offset and
 * the peek ladder, and on a short enough window the lower cards simply do not
 * fit between their slot and the bottom of the screen. So the fold is gated on
 * the card's own rectangle as well, and the gate is skipped — rather than
 * deadlocking the stack — for a card that could never satisfy it where it
 * parks. Entry only: once folded a card stays folded, so a window resize
 * cannot pop the pile back open.
 */
const BOTTOM_GAP_PX = 32;

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
  /** Each card's distance from the top of the list — see `measure`. */
  const offsetsRef = useRef<number[]>([]);
  /**
   * Each card's height in its full form.
   *
   * The folded card is ~109px shorter, so the live height cannot be used to
   * work out when the next card reaches its bottom edge: the edge would jump
   * the moment the fold started and take the condition that caused it with it.
   * Captured on every frame the card is not folded, like the offsets.
   */
  const expandedRef = useRef<number[]>([]);
  /** The scroll each card actually folded at — see `line` in `measure`. */
  const foldAtRef = useRef<number[]>([]);
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
    const flowTops: number[] = [];
    let listTop = 0;

    cards.forEach((card, index) => {
      if (!card) {
        tops[index] = Number.POSITIVE_INFINITY;
        heights[index] = 0;
        restings[index] = null;
        flowTops[index] = Number.POSITIVE_INFINITY;

        return;
      }

      const rect = card.getBoundingClientRect();

      tops[index] = rect.top;
      heights[index] = rect.height;
      restings[index] = stickyTopFor(index);

      /**
       * Where the card sits inside the list, which is the one thing about it
       * that does not move once it sticks.
       *
       * `rect.top` stops answering the moment the card arrives — from then on
       * it reports the resting offset and nothing else — so "how far past its
       * arrival are we" cannot be read from it, and that is exactly what
       * `SETTLE_LEAD_PX` has to count. The `offsetTop` chain is no help either:
       * these cards are `position: sticky`, and a sticky element's offset
       * follows it up the page as it sticks.
       *
       * The list itself is in normal flow, so the distance from its top to the
       * card is a constant of the layout. It is read while the card is still
       * free and kept for the stretch where it is not — and refreshed every
       * frame it is free again, so a resize or a change in the slack ladder
       * corrects it without anything having to invalidate it.
       */
      const list = card.parentElement;

      listTop = list ? list.getBoundingClientRect().top : 0;

      if (restings[index] === null || rect.top > restings[index]! + TOLERANCE_PX) {
        offsetsRef.current[index] = rect.top - listTop;
      }

      flowTops[index] = offsetsRef.current[index] ?? Number.NaN;

      /**
       * The tallest this card has been seen while out of the pile, not the
       * height it happens to have on this frame: a card that has just been
       * released is still growing back over the fold's own transition, and
       * reading it mid-animation would hand the card above it a dwell a hundred
       * pixels short — enough to move the threshold under the attribute and
       * flip it. `resize` empties the cache, which is the one event that can
       * legitimately make a card shorter.
       */
      if (stackedRef.current[index] !== true) {
        expandedRef.current[index] = Math.max(expandedRef.current[index] ?? 0, rect.height);
      }
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
     *
     * Live heights, not the full ones kept in `expandedRef`, and deliberately:
     * the last card is the only one whose box really shrinks when it folds — the
     * others hand the room they lose straight back as bottom margin — so its own
     * 110px has to be in this subtraction or the pile comes apart on the way out
     * (tried it: a covered tagline sliced by 3px, and the stack released a card
     * at a time). It does mean every bottom margin in the column moves while
     * that last card folds. That is safe as long as the page does not scroll
     * itself in response — see `overflow-anchor` on the section.
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
      const restingTop = restings[index];
      const wasStacked = stackedRef.current[index] === true;
      const offset = flowTops[index];
      const expanded = expandedRef.current[index] ?? heights[index];
      /** The scroll at which this card lands on its slot. */
      const arrival = Number.isFinite(offset) ? offset - (restingTop ?? 0) : Number.NaN;
      /**
       * How long the card then has to itself: the distance in the flow between
       * its own bottom edge and the top of the card below it.
       *
       * That distance is the dwell, not a number chosen here. A parked card is
       * covered from the moment the next card's top reaches its bottom, and the
       * two are one flow gap apart, so waiting out the gap is waiting until the
       * room this card is about to give up is actually needed — and folding on
       * that pixel means the card has shed its 59px before anything can bite
       * into them. The step closes and the next step comes up as one movement.
       * The size of the stretch belongs to the stylesheet (`--stack-dwell`).
       *
       * The last card has no card below it, so it takes the gap above it
       * instead — the same stretch, so the pile's rhythm does not change on its
       * final step.
       */
      const nextOffset = flowTops[index + 1];
      const dwell = Number.isFinite(nextOffset)
        ? nextOffset - offset - expanded
        : flowTops[index - 1] !== undefined
          ? offset - flowTops[index - 1] - (expandedRef.current[index - 1] ?? 0)
          : Number.NaN;
      const foldAt =
        arrival + (Number.isFinite(dwell) ? Math.max(SETTLE_LEAD_PX, dwell) : SETTLE_LEAD_PX);
      /**
       * Which is latched on the way in, and it is the latched figure the card is
       * let out on.
       *
       * Everything `foldAt` is built from is a height or an offset of a card
       * that is not moving at the time — but one of them, the card below, starts
       * its own fold a few frames later, and recomputing the line while the
       * thing that defines it is in motion put a two-pixel hole in it: the card
       * turned, unturned and turned again inside three frames of scroll, which
       * is the fold transition starting backwards. The way out is measured from
       * where the way in actually was.
       */
      const line = wasStacked ? (foldAtRef.current[index] ?? foldAt) : foldAt;
      /* How far the list's own top has travelled above the window, which is the
         same quantity `arrival` and `cover` are expressed in. */
      const travelled = -listTop;
      /**
       * Whether the card can be seen whole where it parks at all, and whether it
       * is right now. A card too tall for the space between its slot and the
       * bottom of the window is let through — see `BOTTOM_GAP_PX`.
       */
      const fitsWhole =
        restingTop !== null && restingTop + expanded + BOTTOM_GAP_PX <= window.innerHeight;
      const seenWhole =
        !fitsWhole || tops[index] + expanded <= window.innerHeight - BOTTOM_GAP_PX;
      const stacked =
        restingTop === null
          ? false
          : Number.isFinite(arrival)
            ? travelled >= line - (wasStacked ? RELEASE_PX : 0) && (wasStacked || seenWhole)
            : // No offset captured yet (the card was already stuck on the first
              // frame): fall back to the plain "has it arrived" test.
              tops[index] <= restingTop + (wasStacked ? RELEASE_PX : TOLERANCE_PX);

      if (stackedRef.current[index] !== stacked) {
        stackedRef.current[index] = stacked;

        if (stacked) {
          foldAtRef.current[index] = foldAt;
        } else {
          delete foldAtRef.current[index];
        }

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

  /**
   * A resize is the one thing that can make a card legitimately shorter, so it
   * is also the only thing allowed to throw away the heights kept above.
   */
  const remeasure = useCallback(() => {
    /* Only the cards that are out of the pile, because only they can be read
       again straight away. A folded card would answer with its folded box and
       hand the column a slack 110px out, which is the shiver this cache exists
       to prevent; it keeps the figure it had until it is released. */
    cardsRef.current.forEach((_, index) => {
      if (stackedRef.current[index] !== true) {
        delete expandedRef.current[index];
      }
    });

    scheduleMeasure();
  }, [scheduleMeasure]);

  useEffect(() => {
    // Measured on the next frame rather than synchronously: the first paint
    // stays untouched and no state is set inside the effect body.
    scheduleMeasure();

    window.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', remeasure);

    /**
     * And on the cards' own heights, because one of them changes without the
     * page scrolling.
     *
     * `--card-slack` is a difference between the last card's height and each
     * other card's, and the last card is the one that really shrinks when it
     * folds — over half a second of transition, during which no scroll event
     * need fire at all. Measured only on scroll, the slack then described a
     * layout that no longer existed: the margins still carried the last card's
     * full height while the card itself was 110px shorter, so the cards stopped
     * reaching the bottom of their container together and the pile came apart a
     * card at a time. Watching the boxes keeps the two in step without polling.
     */
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleMeasure);

    cardsRef.current.forEach((card) => {
      if (card) {
        observer?.observe(card);
      }
    });

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', remeasure);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [remeasure, scheduleMeasure]);

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
      // after it still below. The offset inside the list is the measurement
      // that survives sticking; see `measure`.
      const list = card.parentElement;
      const offset = offsetsRef.current[index];
      const flowTop =
        list && Number.isFinite(offset)
          ? list.getBoundingClientRect().top + window.scrollY + offset
          : card.getBoundingClientRect().top + window.scrollY;

      const target = flowTop - (stickyTopFor(index) ?? 0);

      window.scrollTo({ top: Math.max(target, 0), behavior: 'smooth' });
    },
    [stickyTopFor],
  );

  return { registerCard, activeIndex, scrollToCard };
}
