'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CategoryFilter } from '@/components/product/CategoryFilter/CategoryFilter';
import { ProductRail } from '@/components/product/ProductRail/ProductRail';
import { CloseIcon } from '@/components/ui/icons';
import { StepNumber } from '@/components/ui/icons/StepNumber';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { useIsClient } from '@/hooks/useMediaQuery';
import type { Category, Product, RoutineStep } from '@/types/content';
import styles from './MobileProductsSheet.module.scss';

interface MobileProductsSheetProps {
  /** Called once the closing animation has finished. */
  onClose: () => void;
  /** Heading of the overlay: "Shop " plus the active category, e.g. "Shop cleansers". */
  title: string;
  steps: RoutineStep[];
  activeStepIndex: number;
  onStepChange: (index: number) => void;
  categories: Category[];
  activeCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
  products: Product[];
}

/**
 * Mobile products overlay, opened by the CTA of a step card.
 *
 * The component is only mounted while the overlay is open, and it owns its own
 * enter/exit animation: closing first plays the transition and calls `onClose`
 * when it ends, so the exit is actually visible.
 *
 * Page scroll is locked for as long as it is open, which is what returns the
 * visitor to exactly the place they opened it from.
 */
export function MobileProductsSheet({
  onClose,
  title,
  steps,
  activeStepIndex,
  onStepChange,
  categories,
  activeCategoryId,
  onCategorySelect,
  products,
}: MobileProductsSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // One frame between mount and the "open" state so the transition runs.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  const requestClose = useCallback(() => {
    setIsClosing(true);
    setIsVisible(false);
  }, []);

  useLockBodyScroll(true);
  useFocusTrap(dialogRef, isVisible, requestClose);

  if (!isClient) {
    return null;
  }

  return createPortal(
    <div className={styles.root} data-state={isVisible ? 'open' : 'closed'}>
      <div className={styles.backdrop} onClick={requestClose} aria-hidden="true" />

      <div
        className={styles.sheet}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && isClosing) {
            onClose();
          }
        }}
      >
        <div className={styles.header}>
          <button
            type="button"
            className={styles.close}
            onClick={requestClose}
            aria-label="Close products"
          >
            <CloseIcon />
          </button>

          <p className={styles.title}>{title}</p>
        </div>

        <div className={styles.content}>
          {/* The wrapper is what sticks to the top of the scrolling area — see
              `.filterBar`; the pill itself carries its own shadow. */}
          <div className={styles.filterBar}>
            <CategoryFilter
              categories={categories}
              activeCategoryId={activeCategoryId}
              onSelect={onCategorySelect}
            />
          </div>

          {/* Wrapped so the roller can bleed past the panel's padding — see
              `.rail`. */}
          <div className={styles.rail}>
            <ProductRail products={products} label={`${title} products`} imageSizes="152px" />
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerLabel} id="sheet-steps-label">
            Shop products for:
          </p>

          <div className={styles.steps} role="group" aria-labelledby="sheet-steps-label">
            {steps.map((step, index) => {
              const isActive = index === activeStepIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  className={`${styles.step} ${isActive ? styles.stepActive : ''}`}
                  aria-pressed={isActive}
                  onClick={() => onStepChange(index)}
                >
                  <StepNumber step={step.numeral} className={styles.stepNumeral} />
                  <span className={styles.stepTitle}>{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
