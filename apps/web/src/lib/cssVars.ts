import type { CSSProperties } from 'react';

/**
 * Passes CSS custom properties through React's `style` prop with type safety —
 * used to hand values that JS measures (stack progress, card index) over to CSS,
 * which keeps all the actual styling in the stylesheets.
 */
export function cssVars(
  variables: Record<`--${string}`, string | number | undefined>
): CSSProperties {
  // An `undefined` entry is dropped rather than written as the string
  // "undefined", so the stylesheet's own fallback in `var(--x, …)` applies.
  return Object.fromEntries(
    Object.entries(variables).filter(([, value]) => value !== undefined)
  ) as CSSProperties;
}
