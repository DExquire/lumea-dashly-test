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
      style={cssVars({
        '--image-width': `${step.image.width}px`,
        '--image-ratio': step.image.width / step.image.height,
        '--description-width': step.descriptionWidth ? `${step.descriptionWidth}px` : undefined,
        '--card-min-height': step.minHeight ? `${step.minHeight}px` : undefined,
        '--media-gap': step.mediaGap === undefined ? undefined : `${step.mediaGap}px`,
        '--card-pad-top': step.paddingTop === undefined ? undefined : `${step.paddingTop}px`,
        '--card-pad-bottom': step.paddingBottom === undefined ? undefined : `${step.paddingBottom}px`,
        '--card-pad-top-expanded-only':
          step.paddingTopExpandedOnly === undefined ? undefined : `${step.paddingTopExpandedOnly}px`,
        '--m-title-size': step.mobile && `${step.mobile.titleSize}px`,
        '--m-title-weight': step.mobile && `${step.mobile.titleWeight}`,
        '--m-title-lh': step.mobile && `${step.mobile.titleLineHeight}`,
        '--m-title-row-min': step.mobile && `${step.mobile.titleRowMin}px`,
        '--m-tagline-size': step.mobile && `${step.mobile.taglineSize}px`,
        '--m-tagline-weight': step.mobile && `${step.mobile.taglineWeight}`,
        '--m-description-width': step.mobile && `${step.mobile.descriptionWidth}px`,
        '--m-description-size': step.mobile && `${step.mobile.descriptionSize}px`,
        '--m-description-lh':
          step.mobile && `${step.mobile.descriptionLineHeight / step.mobile.descriptionSize}`,
        '--m-description-weight': step.mobile && `${step.mobile.descriptionWeight}`,
        '--m-image-width': step.mobile && `${step.mobile.image.width}px`,
        '--m-image-height': step.mobile && `${step.mobile.image.height}px`,
        '--m-image-x': step.mobile && `${step.mobile.image.x}px`,
        '--m-image-y': step.mobile && `${step.mobile.image.y}px`,
        '--m-image-radius': step.mobile && `${step.mobile.image.radius}px`,
        '--m-cta-inset': step.mobile && `${step.mobile.ctaInset}px`,
        '--m-cta-gap': step.mobile && `${step.mobile.ctaGap}px`,
        '--media-offset-x': step.mediaOffsetX === undefined ? undefined : `${step.mediaOffsetX}px`,
      })}
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

        {/* `data-step-cta` is what the stack hides once the card has settled —
            see `.stackItem[data-stacked]` in `HowItWorks.module.scss`. An
            attribute rather than the class, because the rule lives in the other
            stylesheet and a module's class name is hashed. */}
        <button type="button" className={styles.cta} data-step-cta onClick={onCtaClick}>
          <span className={styles.ctaLabel}>{step.ctaLabel}</span>
          <ArrowUpRightIcon className={styles.ctaIcon} />
        </button>
      </div>

      <figure className={styles.media} data-align={step.image.align}>
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
