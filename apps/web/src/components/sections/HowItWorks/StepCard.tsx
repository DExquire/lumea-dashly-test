import Image from 'next/image';
import { StepNumber } from '@/components/ui/icons/StepNumber';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import { cssVars } from '@/lib/cssVars';
import type { RoutineStep } from '@/types/content';
import styles from './StepCard.module.scss';

interface StepCardProps {
  step: RoutineStep;
  isActive: boolean;
  /** Scrolls this card back into full view when it is partially covered. */
  onReveal: () => void;
  /** CTA: opens the products overlay on mobile, focuses this step on desktop. */
  onCtaClick: () => void;
}

/**
 * A single step card of the stack.
 *
 * The heading doubles as the button that reveals a covered card: when the cards
 * are stacked, the heading strip is the only visible part and the natural thing
 * to tap. Keeping it a real `<button>` inside the `<h3>` preserves both the
 * document outline and keyboard access.
 */
export function StepCard({ step, isActive, onReveal, onCtaClick }: StepCardProps) {
  return (
    <article
      className={styles.root}
      data-tone={step.tone}
      data-active={isActive ? '' : undefined}
    >
      <div className={styles.head}>
        <h3 className={styles.heading}>
          <button type="button" className={styles.headingButton} onClick={onReveal}>
            <StepNumber step={step.numeral} className={styles.numeral} />
            <span className={styles.srOnly}>{`Step ${step.number}: `}</span>
            <span className={styles.title}>{step.title}</span>
          </button>
        </h3>

        <p className={styles.tagline}>{step.tagline}</p>
      </div>

      <div className={styles.body}>
        <p className={styles.description}>{step.description}</p>

        <button type="button" className={styles.cta} onClick={onCtaClick}>
          <span className={styles.ctaLabel}>{step.ctaLabel}</span>
          <ArrowUpRightIcon className={styles.ctaIcon} />
        </button>
      </div>

      <figure
        className={styles.media}
        data-align={step.image.align}
        style={cssVars({ '--image-ratio': step.image.ratio })}
      >
        <Image
          className={styles.image}
          src={step.image.src}
          alt={step.image.alt}
          fill
          sizes="(min-width: 1024px) 400px, 90vw"
        />
      </figure>
    </article>
  );
}
