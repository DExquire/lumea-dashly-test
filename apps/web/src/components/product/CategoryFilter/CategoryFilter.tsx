'use client';

import { useState } from 'react';

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
 * `data-scrolled` is the one piece of state here, and it exists because the
 * room kept beside the pill for its shadow is also room the pill travels
 * through: at rest it shows the stadium's cap and the shadow around it, and
 * the moment the row is dragged it would show the stadium itself, outside the
 * column the cards below are cut at. The flag lets the stylesheet hide that
 * strip for exactly as long as the row is off its resting position.
 */
export function CategoryFilter({ categories, activeCategoryId, onSelect }: CategoryFilterProps) {
  const [scrolled, setScrolled] = useState(false);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.root}
      data-scrolled={scrolled || undefined}
      onScroll={(event) => {
        /* Half a pixel rather than zero: a trackpad can leave the row resting
           on a fractional offset, and flipping the flag there would flicker. */
        const off = event.currentTarget.scrollLeft > 0.5;

        setScrolled((was) => (was === off ? was : off));
      }}
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
