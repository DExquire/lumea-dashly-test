/**
 * Domain model the UI works with. It is deliberately decoupled from the raw
 * Strapi payload shape: the mappers in `lib/strapi/mappers.ts` translate one
 * into the other, so a CMS field rename never leaks into components.
 */

export interface MediaAsset {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export type BadgeTone = 'sale' | 'new' | 'bestseller' | 'neutral';

export interface ProductBadge {
  id: string;
  label: string;
  tone: BadgeTone;
}

export interface VariationOption {
  id: string;
  label: string;
}

/**
 * A group of variations, e.g. `Choose formula → Hyaluronic Acid 2% / + B5` or
 * `Size → 30 ml / 50 ml`. Both the group name and its options come from the CMS,
 * so different products can expose completely different variation types.
 */
export interface VariationGroup {
  id: string;
  name: string;
  options: VariationOption[];
}

export interface Pricing {
  /** What the customer pays. */
  current: number;
  /** Crossed-out price. `null` when the product has no discount. */
  original: number | null;
  /** Rounded discount percent. `null` when the product has no discount. */
  discountPercent: number | null;
}

export interface Product {
  id: string;
  title: string;
  /** Volume / quantity, e.g. "30 ml". `null` when not set in the CMS. */
  volume: string | null;
  image: MediaAsset | null;
  pricing: Pricing;
  badges: ProductBadge[];
  variationGroups: VariationGroup[];
  /** Ids of every category the product belongs to (a product can be in many). */
  categoryIds: string[];
}

export interface Category {
  id: string;
  name: string;
}

export interface Announcement {
  id: string;
  message: string;
}

/**
 * One of the four "How it works" step cards (01 Cleanse ... 04 Protect).
 *
 * Per the task these are part of the page design rather than CMS content, so
 * they live in `content/routine-steps.ts` — but they are still typed and passed
 * as data, never hardcoded inside the components.
 */
export interface RoutineStep {
  id: string;
  /** Displayed step number, e.g. "01". */
  number: string;
  /** 1–4, selects the cropped display numeral from the design. */
  numeral: 1 | 2 | 3 | 4;
  title: string;
  /** Handwritten one-liner under the title. */
  tagline: string;
  description: string;
  /** CTA label, e.g. "Shop cleansers". */
  ctaLabel: string;
  /** Card background from the design: plain, mint (02) or blush (04). */
  tone: 'neutral' | 'mint' | 'blush';
  image: {
    src: string;
    alt: string;
    /** Aspect ratio of the image box on desktop, as in Figma. */
    ratio: number;
    /** Horizontal placement of the image inside the card. */
    align: 'start' | 'end';
  };
}
