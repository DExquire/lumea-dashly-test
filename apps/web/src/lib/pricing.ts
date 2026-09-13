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
