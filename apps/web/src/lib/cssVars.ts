import type { CSSProperties } from 'react';

/**
 * Passes CSS custom properties through React's `style` prop with type safety —
 * used to hand values that JS measures (stack progress, card index) over to CSS,
 * which keeps all the actual styling in the stylesheets.
 */
export function cssVars(variables: Record<`--${string}`, string | number>): CSSProperties {
  return variables as CSSProperties;
}
