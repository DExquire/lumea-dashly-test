'use client';

import { useMemo, useState } from 'react';
import type { Category, Product } from '@/types/content';

interface UseProductFilterResult {
  /** Categories that actually contain products, in CMS order. */
  availableCategories: Category[];
  activeCategoryId: string | null;
  setActiveCategoryId: (categoryId: string) => void;
  visibleProducts: Product[];
}

/**
 * Category filtering for the product rail. Shared by the desktop rail and the
 * mobile overlay so the behaviour cannot drift between the two.
 *
 * Categories come from the CMS and can be renamed, reordered or deleted at any
 * time, so the active category is resolved against the current list on every
 * render instead of being stored as an index.
 */
export function useProductFilter(products: Product[], categories: Category[]): UseProductFilterResult {
  const [requestedCategoryId, setRequestedCategoryId] = useState<string | null>(null);

  const availableCategories = useMemo(
    () => categories.filter((category) => products.some((p) => p.categoryIds.includes(category.id))),
    [categories, products],
  );

  const activeCategoryId = useMemo(() => {
    if (requestedCategoryId && availableCategories.some((c) => c.id === requestedCategoryId)) {
      return requestedCategoryId;
    }

    return availableCategories[0]?.id ?? null;
  }, [availableCategories, requestedCategoryId]);

  const visibleProducts = useMemo(() => {
    if (!activeCategoryId) {
      // No categories at all — still show the products instead of an empty rail.
      return products;
    }

    return products.filter((product) => product.categoryIds.includes(activeCategoryId));
  }, [activeCategoryId, products]);

  return {
    availableCategories,
    activeCategoryId,
    setActiveCategoryId: setRequestedCategoryId,
    visibleProducts,
  };
}
