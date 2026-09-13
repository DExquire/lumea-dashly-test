import { formatDiscount, formatPrice } from '@/lib/format';
import type { Pricing } from '@/types/content';
import styles from './Price.module.scss';

interface PriceProps {
  pricing: Pricing;
}

/**
 * Price block of a product card.
 *
 * The crossed-out price and the discount badge only render when the product is
 * actually discounted — no empty space is reserved for them, which is what the
 * task asks for when a product has no discount.
 */
export function Price({ pricing }: PriceProps) {
  const { current, original, discountPercent } = pricing;
  const hasDiscount = original !== null && original > current;

  return (
    <div className={styles.root}>
      <div className={styles.amounts}>
        {hasDiscount && (
          <s className={styles.original}>
            <span className={styles.srOnly}>Was </span>
            {formatPrice(original)}
          </s>
        )}

        <p className={styles.currentRow}>
          <span className={styles.currentLabel}>Price</span>
          <span className={styles.current}>{formatPrice(current)}</span>
        </p>
      </div>

      {hasDiscount && discountPercent !== null && (
        <p className={styles.discount}>{formatDiscount(discountPercent)}</p>
      )}
    </div>
  );
}
