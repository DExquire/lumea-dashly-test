'use client';

import { useState } from 'react';
import { CategoryFilter } from '@/components/product/CategoryFilter/CategoryFilter';
import { MobileProductsSheet } from '@/components/product/MobileProductsSheet/MobileProductsSheet';
import { ProductRail } from '@/components/product/ProductRail/ProductRail';
import { StarIcon } from '@/components/ui/icons';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useProductFilter } from '@/hooks/useProductFilter';
import { useStackingCards } from '@/hooks/useStackingCards';
import { cssVars } from '@/lib/cssVars';
import type { Category, Product, RoutineStep } from '@/types/content';
import { StepCard } from './StepCard';
import styles from './HowItWorks.module.scss';

interface HowItWorksProps {
  steps: RoutineStep[];
  products: Product[];
  categories: Category[];
}

const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * "How it works": the stack of step cards on the left and the products on the
 * right (desktop) or behind a step CTA (mobile).
 *
 * One responsive implementation drives both. The stacking itself is CSS
 * (`position: sticky` per card), so it is smooth in both scroll directions and
 * works at any viewport height; `useStackingCards` only reads the geometry to
 * know which step is on top and how far the stack has collapsed.
 */
export function HowItWorks({ steps, products, categories }: HowItWorksProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [sheetStepIndex, setSheetStepIndex] = useState<number | null>(null);

  const { availableCategories, activeCategoryId, setActiveCategoryId, visibleProducts } =
    useProductFilter(products, categories);

  const { registerCard, activeIndex, progress, scrollToCard } = useStackingCards({
    count: steps.length,
  });

  const handleCtaClick = (index: number) => {
    if (isDesktop) {
      // On desktop the products are already visible, so bring the step itself
      // fully into view instead of opening anything.
      scrollToCard(index);

      return;
    }

    setSheetStepIndex(index);
  };

  const activeStep = steps[activeIndex] ?? steps[0];
  const sheetStep = sheetStepIndex === null ? null : steps[sheetStepIndex];

  return (
    <section
      className={styles.root}
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      style={cssVars({ '--stack-progress': progress })}
    >
      <div className={styles.inner}>
        <div className={styles.titleWrap}>
          <h2 className={styles.heading} id="how-it-works-heading">
            <span>How it</span>
            <StarIcon className={styles.star} />
            <span className={styles.headingAccent}>works</span>
          </h2>

          <p className={styles.subheading}>4 simple steps to healthier-looking skin</p>
        </div>

        <div className={styles.layout}>
          <ol className={styles.stack} style={cssVars({ '--card-count': steps.length })}>
            {steps.map((step, index) => (
              <li
                key={step.id}
                className={styles.stackItem}
                ref={registerCard(index)}
                style={cssVars({ '--card-index': index })}
              >
                <StepCard
                  step={step}
                  isActive={index === activeIndex}
                  onReveal={() => scrollToCard(index)}
                  onCtaClick={() => handleCtaClick(index)}
                />
              </li>
            ))}
          </ol>

          {/* Desktop: products sit next to the stack in their own scroll
              container, so cards never spill over the step cards. */}
          <aside className={styles.products} aria-label="Products">
            <p className={styles.productsLabel}>{activeStep?.ctaLabel}</p>

            <CategoryFilter
              categories={availableCategories}
              activeCategoryId={activeCategoryId}
              onSelect={setActiveCategoryId}
            />

            <ProductRail
              products={visibleProducts}
              label={`${activeStep?.title ?? 'Routine'} products`}
            />
          </aside>
        </div>
      </div>

      {sheetStep && (
        <MobileProductsSheet
          onClose={() => setSheetStepIndex(null)}
          title={sheetStep.ctaLabel}
          steps={steps}
          activeStepIndex={sheetStepIndex ?? 0}
          onStepChange={setSheetStepIndex}
          categories={availableCategories}
          activeCategoryId={activeCategoryId}
          onCategorySelect={setActiveCategoryId}
          products={visibleProducts}
        />
      )}
    </section>
  );
}
