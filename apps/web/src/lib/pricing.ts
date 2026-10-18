import type { Pricing } from '@/types/content';

export interface PricingInput {
  /** Regular ("list") price as entered in the CMS. */
  price?: number | string | null;
  /** Actual price after the discount, when the editor prefers to type it. */
  salePrice?: number | string | null;
  /** Discount percent, when the editor prefers to type that instead. */
  discountPercent?: number | string | null;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Derives the price the customer pays, the crossed-out price and the discount
 * percent from whatever the editor filled in, so the same number never has to
 * be typed twice in the CMS:
 *
 * - `price` + `discountPercent` → the current price is calculated;
 * - `price` + `salePrice`       → the discount percent is calculated;
 * - `price` only                → no discount, no crossed-out price, no badge.
 *
 * `salePrice` wins when both are filled in, because it is the exact amount the
 * editor wants to charge.
 */
export function resolvePricing(input: PricingInput): Pricing {
  const price = toNumber(input.price);
  const salePrice = toNumber(input.salePrice);
  const discountPercent = toNumber(input.discountPercent);

  const original = price !== null && price > 0 ? roundMoney(price) : null;

  if (original !== null && salePrice !== null && salePrice > 0 && salePrice < original) {
    const current = roundMoney(salePrice);

    return {
      current,
      original,
      discountPercent: Math.round(((original - current) / original) * 100),
    };
  }

  if (
    original !== null &&
    discountPercent !== null &&
    discountPercent > 0 &&
    discountPercent < 100
  ) {
    return {
      current: roundMoney(original * (1 - discountPercent / 100)),
      original,
      discountPercent: Math.round(discountPercent),
    };
  }

  return {
    current: original ?? roundMoney(salePrice ?? 0),
    original: null,
    discountPercent: null,
  };
}

/**
 * The price once the shopper has picked their variations.
 *
 * A variation value can carry its own discount, and when it does it **replaces**
 * the product's rather than stacking on top of it. Neither the brief nor the
 * Figma prototype says which it should be — the prototype carries no interaction
 * on the chips at all — so the deciding argument is that the card has to agree
 * with itself: the chip reads "-10 %" and, with replacement, so does the price
 * row. Stacking would put "-10 %" on the chip and "-24%" under it, which reads
 * as a bug even though the arithmetic is honest. To stack instead, the single
 * line to change is `percent` below:
 *
 *   const percent = 100 - (1 - (pricing.discountPercent ?? 0) / 100) * (1 - own / 100) * 100;
 *
 * Taking the product's resolved pricing rather than the raw CMS fields keeps the
 * untouched case bit-for-bit identical: with nothing discounted the very same
 * object comes back, so no rounding can drift.
 *
 * With several groups discounted at once the largest wins, so the order the
 * groups happen to be in cannot change the price.
 */
export function resolveVariationPricing(
  pricing: Pricing,
  selectedDiscountPercents: readonly (number | null)[],
): Pricing {
  const own = selectedDiscountPercents.reduce<number | null>((best, value) => {
    if (value === null || value <= 0 || value >= 100) {
      return best;
    }

    return best === null || value > best ? value : best;
  }, null);

  if (own === null) {
    return pricing;
  }

  /* The list price: what the product costs before any discount at all. */
  const list = pricing.original ?? pricing.current;
  const percent = own;

  return {
    current: roundMoney(list * (1 - percent / 100)),
    original: list,
    discountPercent: Math.round(percent),
  };
}
