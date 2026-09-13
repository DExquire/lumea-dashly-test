'use client';

import Image from 'next/image';
import { useState } from 'react';
import { VariationSelector } from '@/components/product/VariationSelector/VariationSelector';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Price } from '@/components/ui/Price/Price';
import { HeartIcon } from '@/components/ui/icons';
import type { Product } from '@/types/content';
import styles from './ProductCard.module.scss';

interface ProductCardProps {
  product: Product;
  /** `sizes` hint for next/image, so mobile never downloads a desktop-sized image. */
  imageSizes?: string;
  /** The first visible card can be eager-loaded to help LCP. */
  priority?: boolean;
}

const DEFAULT_IMAGE_SIZES = '(min-width: 1024px) 248px, 70vw';

/**
 * The single reusable product card — same component on desktop and inside the
 * mobile overlay.
 *
 * Every block is conditional, so the card renders correctly with any amount of
 * CMS data: no badges, no discount, no volume, no variations, or several
 * variation groups at once. Nothing reserves empty space for missing data.
 */
export function ProductCard({
  product,
  imageSizes = DEFAULT_IMAGE_SIZES,
  priority = false,
}: ProductCardProps) {
  const { title, image, volume, pricing, badges, variationGroups } = product;
  const [isSaved, setIsSaved] = useState(false);

  return (
    <article className={styles.root}>
      <div className={styles.media}>
        {image ? (
          <Image
            className={styles.image}
            src={image.url}
            alt={image.alt}
            fill
            sizes={imageSizes}
            priority={priority}
          />
        ) : (
          <div className={styles.imageFallback} aria-hidden="true" />
        )}

        {badges.length > 0 && (
          <ul className={styles.badges}>
            {badges.map((badge) => (
              <li key={badge.id}>
                <Badge label={badge.label} tone={badge.tone} />
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className={styles.favourite}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Remove ${title} from saved items` : `Save ${title}`}
          onClick={() => setIsSaved((saved) => !saved)}
        >
          <HeartIcon className={styles.favouriteIcon} />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <h4 className={styles.title}>
            {title}
            {volume && <span className={styles.volume}>{volume}</span>}
          </h4>

          {variationGroups.length > 0 && (
            <div className={styles.variations}>
              {variationGroups.map((group) => (
                <VariationSelector key={group.id} group={group} productId={product.id} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.bottom}>
          <Price pricing={pricing} />

          <div className={styles.actions}>
            <Button variant="accent" size="sm" className={styles.action}>
              Add to bag
            </Button>
            <Button variant="secondary" size="sm" className={styles.action}>
              View details
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
