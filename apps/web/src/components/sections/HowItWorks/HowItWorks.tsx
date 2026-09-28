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
 * The heading above the products, in the design's own phrasing: "Shop
 * cleansers" over a rail filtered to the "Cleansers" category.
 *
 * It follows the category rather than the step, so it always names what is
 * actually on screen — pick "Face Wash" and it reads "Shop face wash". The
 * design sets it lower-case, which is a rule rather than a spelling: a category
 * an editor writes as "SPF" would become "Shop spf", so words that are all
 * capitals are left as the CMS has them.
 */
/**
 * The distance a card has to travel past, expressed as a CSS length.
 *
 * Each card in the pile rests one "peek" below the one before it, and the
 * stylesheet needs three sums of those peeks: how far down a card sits, how far
 * the one above it sits, and the travel of the whole stack. With a single peek
 * for every card those were multiplications; per-step peeks make them sums, and
 * a sum is the one thing CSS cannot do over siblings.
 *
 * The terms are left as `var(--stack-peek)` wherever a step has no figure of
 * its own, so the section's default still comes from the stylesheet and changes
 * with the breakpoint — nothing here has to know that it is 105 on desktop and
 * 130 on mobile.
 */
function peekChain(steps: RoutineStep[], upTo: number, own: (step: RoutineStep) => number | undefined): string {
  if (upTo <= 0) {
    return '0px';
  }

  /* From the second step: a card's own peek is how far *it* rests below the one
     above, so the first card has nothing to contribute and its own figure, if
     anyone sets one, is simply unused. */
  const terms = steps.slice(1, upTo + 1).map((step) => {
    const value = own(step);

    return value === undefined ? 'var(--stack-peek)' : `${value}px`;
  });

  return `calc(${terms.join(' + ')})`;
}

const desktopPeek = (step: RoutineStep) => step.peek;
const mobilePeek = (step: RoutineStep) => step.mobile?.peek ?? step.peek;

function shopHeading(categoryName: string): string {
  const words = categoryName.split(' ').map((word) => {
    const isAcronym = word.length > 1 && word === word.toUpperCase();

    return isAcronym ? word : word.toLowerCase();
  });

  return `Shop ${words.join(' ')}`;
}

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

  const { registerCard, activeIndex, scrollToCard } = useStackingCards();

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
  /* Falls back to the step's own CTA only when the CMS has no categories at
     all, which is the one case where there is nothing to name. */
  const activeCategory = availableCategories.find((category) => category.id === activeCategoryId);
  const productsHeading = activeCategory ? shopHeading(activeCategory.name) : (activeStep?.ctaLabel ?? '');

  return (
    <section className={styles.root} id="how-it-works" aria-labelledby="how-it-works-heading">
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
          <ol
            className={styles.stack}
            style={cssVars({
              '--card-count': steps.length,
              '--stack-peek-total-lg': peekChain(steps, steps.length - 1, desktopPeek),
              '--stack-peek-total-sm': peekChain(steps, steps.length - 1, mobilePeek),
            })}
          >
            {steps.map((step, index) => (
              <li
                key={step.id}
                className={styles.stackItem}
                ref={registerCard(index)}
                style={cssVars({
                  '--card-index': index,
                  '--card-peek-before-lg': peekChain(steps, index, desktopPeek),
                  '--card-peek-before-sm': peekChain(steps, index, mobilePeek),
                  '--card-peek-before-prev-lg': peekChain(steps, index - 1, desktopPeek),
                  '--card-peek-before-prev-sm': peekChain(steps, index - 1, mobilePeek),
                })}
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
            <p className={styles.productsLabel}>{productsHeading}</p>

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
          title={productsHeading}
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
