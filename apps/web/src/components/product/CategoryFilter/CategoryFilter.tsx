'use client';

import { useEffect, useRef, useState } from 'react';
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
 * `data-overflowing` is the one thing the stylesheet cannot work out for
 * itself: whether the row is wider than the space it has. The mobile panel
 * squares the pill's right end when it is, because there the row is cut by the
 * edge of the screen rather than ending — see `CategoryFilter.module.scss`.
 */
export function CategoryFilter({ categories, activeCategoryId, onSelect }: CategoryFilterProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const row = rowRef.current;

    if (!row) {
      return;
    }

    // 1px of slack: sub-pixel widths make an exactly-fitting row measure a
    // fraction wider than its box.
    const measure = () => setIsOverflowing(row.scrollWidth - row.clientWidth > 1);

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(row);

    return () => observer.disconnect();
  }, [categories]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.root}
      ref={rowRef}
      data-overflowing={isOverflowing || undefined}
      role="group"
      aria-label="Product categories"
    >
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
  );
}
