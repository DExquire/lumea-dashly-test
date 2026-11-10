'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Category } from '@/types/content';
import styles from './CategoryFilter.module.scss';

interface CategoryFilterProps {
  categories: Category[];
  activeCategoryId: string | null;
  onSelect: (categoryId: string) => void;
}

/**
 * Category names above the products. Both the names and their order come from
 * the CMS, so nothing here is hardcoded.
 *
 * These are filter buttons rather than tabs: `aria-pressed` communicates the
 * active state to assistive tech without the roving-tabindex a real tablist
 * would require.
 *
 * Two elements, not one. `.root` is the scroll box and `.pill` is the white
 * stadium the design draws: the pill is as wide as its chips and travels
 * inside the box, so on a phone it starts 12 in from the edge with its right
 * end past the screen — exactly as the frame draws it — and scrolling it to
 * the end brings that end into view with the same 12 of air after it. Painting
 * the stadium on the scroll box itself pins it to the screen instead, and then
 * its end can never be reached.
 *
 * `data-at-start` / `data-at-end` are the only state here, and they exist
 * because the room kept beside the pill for its shadow is also room the pill
 * is seen in. An end that is parked wants that room, to draw its cap and the
 * shadow around it; an end that is mid-travel must not have it, or the stadium
 * shows outside the column the cards below are cut at. The two flags let the
 * stylesheet keep each strip for exactly as long as its end is resting there.
 */
export function CategoryFilter({ categories, activeCategoryId, onSelect }: CategoryFilterProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  /**
   * Half a pixel of tolerance at both ends: a trackpad can leave the row on a
   * fractional offset, and a flag that flipped there would flicker the strip.
   * A row that does not overflow reads as resting at both ends, which is what
   * it is — then neither strip is clipped and the shadow is whole all round.
   */
  const measure = useCallback(() => {
    const box = boxRef.current;

    if (!box) {
      return;
    }

    const travel = box.scrollWidth - box.clientWidth;
    const atStart = box.scrollLeft <= 0.5;
    const atEnd = box.scrollLeft >= travel - 0.5;

    setEdges((was) => (was.atStart === atStart && was.atEnd === atEnd ? was : { atStart, atEnd }));
  }, []);

  /* The row can start or stop overflowing without ever being scrolled — a
     window resize does it, and so does the CMS gaining a category. */
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);

    return () => window.removeEventListener('resize', measure);
  }, [measure, categories.length]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      ref={boxRef}
      className={styles.root}
      data-at-start={edges.atStart || undefined}
      data-at-end={edges.atEnd || undefined}
      onScroll={measure}
    >
      <div className={styles.pill} role="group" aria-label="Product categories">
        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;

          return (
            <button
              key={category.id}
              type="button"
              className={`${styles.item} ${isActive ? styles.active : ''}`}
              aria-pressed={isActive}
              onClick={() => onSelect(category.id)}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
