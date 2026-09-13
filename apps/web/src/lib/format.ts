const CURRENCY = 'GBP';
const LOCALE = 'en-GB';

const priceFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 23.8 -> "£23.80" */
export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

/** 15 -> "-15%" */
export function formatDiscount(percent: number): string {
  return `-${Math.round(percent)}%`;
}
