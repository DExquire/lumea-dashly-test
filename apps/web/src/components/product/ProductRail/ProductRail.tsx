'use client';

import { ProductCard } from '@/components/product/ProductCard/ProductCard';
import type { Product } from '@/types/content';
import styles from './ProductRail.module.scss';

interface ProductRailProps {
  products: Product[];
  /** Accessible name of the scrollable region. */
  label: string;
  imageSizes?: string;
  /** Marks the first card's image as high priority (desktop hero area only). */
  prioritizeFirstImage?: boolean;
}

/**
 * Horizontal product list.
 *
 * The cards scroll inside this container only — the surrounding layout never
 * moves, and the cards cannot spill over the step cards or out of the section.
 * `tabIndex={0}` plus a label make the scroller reachable and announced for
 * keyboard and screen-reader users.
 */
export function ProductRail({
  products,
  label,
  imageSizes,
  prioritizeFirstImage = false,
}: ProductRailProps) {
  if (products.length === 0) {
    return (
      <p className={styles.empty}>
        No products in this category yet. Pick another category or check back soon.
      </p>
    );
  }

  return (
    /* The wrapper exists only to carry the rail's drop shadow, which the
       scroller itself cannot paint outside its own edges. */
    <div className={styles.frame}>
      <ul className={styles.track} tabIndex={0} role="list" aria-label={label}>
        {products.map((product, index) => (
          <li key={product.id} className={styles.item}>
            <ProductCard
              product={product}
              imageSizes={imageSizes}
              priority={prioritizeFirstImage && index === 0}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
