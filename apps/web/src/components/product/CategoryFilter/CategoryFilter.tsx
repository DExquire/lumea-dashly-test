'use client';

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
 */
export function CategoryFilter({ categories, activeCategoryId, onSelect }: CategoryFilterProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={styles.root} role="group" aria-label="Product categories">
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
