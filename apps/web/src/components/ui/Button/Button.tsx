import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'ternary' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** The design puts an arrow next to every CTA label; opt out when needed. */
  showArrow?: boolean;
  className?: string;
}

type ButtonElementProps = BaseProps &
  Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children'> & {
    href?: undefined;
  };

type LinkElementProps = BaseProps &
  Omit<ComponentPropsWithoutRef<'a'>, 'className' | 'children' | 'href'> & {
    href: string;
  };

type ButtonProps = ButtonElementProps | LinkElementProps;

/**
 * Shared CTA.
 *
 * Renders an `<a>` when it navigates and a `<button>` when it acts, so the
 * element always matches its purpose. Every variant but `ternary` carries the
 * hover animation from the Figma prototype: a soft colour wave rising into the
 * pill from below.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  showArrow = true,
  className,
  ...rest
}: ButtonProps) {
  const classNames = [styles.root, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  /**
   * `status=ternary` is the only button in the design's set without a
   * `vibrant grad` child, and the prototype agrees: its hovered and resting
   * frames are the same pixels. It gets no wave element at all, rather than a
   * wave that is told not to move.
   */
  const hasWave = variant !== 'ternary';

  const content = (
    <>
      {hasWave && <span className={styles.wave} aria-hidden="true" />}
      <span className={styles.label}>{children}</span>
      {showArrow && <ArrowUpRightIcon className={styles.arrow} />}
    </>
  );

  if ('href' in rest && rest.href !== undefined) {
    const { href, ...anchorProps } = rest as LinkElementProps;

    return (
      <Link className={classNames} href={href} {...anchorProps}>
        {content}
      </Link>
    );
  }

  const { type = 'button', ...buttonProps } = rest as ButtonElementProps;

  return (
    <button className={classNames} type={type} {...buttonProps}>
      {content}
    </button>
  );
}
