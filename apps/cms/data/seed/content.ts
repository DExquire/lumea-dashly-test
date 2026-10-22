/**
 * Demo content used to bootstrap an empty database, so a fresh clone shows a
 * populated page immediately. Everything here is editable in the admin panel
 * afterwards — nothing in the frontend depends on these exact values.
 *
 * The products mirror the ones in the Figma frame, and the set is deliberately
 * varied to exercise every fallback: a percent discount, an explicit sale price,
 * no discount at all, several variation groups, one group, none, and a product
 * with no image.
 */

export interface SeedAnnouncement {
  message: string;
  sortOrder: number;
}

export interface SeedCategory {
  key: string;
  name: string;
  sortOrder: number;
}

export interface SeedVariationValue {
  label: string;
  /** Discount this value carries, in percent. Drives the price. */
  discountPercent?: number;
  /** Overrides the badge text; derived from `discountPercent` when omitted. */
  discountLabel?: string;
  /**
   * File name inside `data/seed/images` for the small square thumbnail the
   * design draws to the left of the label on a full-width chip. Omit it and the
   * chip is text only. The same file may be reused across values and products —
   * it is uploaded once.
   */
  icon?: string;
}

export interface SeedProduct {
  title: string;
  volume?: string;
  price: number;
  salePrice?: number;
  discountPercent?: number;
  badges?: { label: string; tone: 'neutral' | 'sale' | 'new' | 'bestseller' }[];
  /**
   * A value is either a plain label or a label with the small tilted badge the
   * design pins to the top edge of the chip ("-10 %"). The badge is free text
   * rather than a number: the design writes one as "-10 %" and the next as
   * "-20%", and an editor may want "2 for 1" there just as easily.
   */
  variationGroups?: { name: string; values: (string | SeedVariationValue)[] }[];
  categoryKeys: string[];
  /** File name inside `data/seed/images`. */
  image?: string;
  sortOrder: number;
}

export const seedAnnouncements: SeedAnnouncement[] = [
  { message: 'Get 15% off with code LUMEAFIRST15', sortOrder: 0 },
  { message: 'Free delivery on orders over £40', sortOrder: 1 },
  { message: 'New: barrier-repair serum in stock', sortOrder: 2 },
];

export const seedCategories: SeedCategory[] = [
  { key: 'cleansers', name: 'Cleansers', sortOrder: 0 },
  { key: 'face-wash', name: 'Face Wash', sortOrder: 1 },
  { key: 'makeup-removers', name: 'Makeup Removers', sortOrder: 2 },
];

export const seedProducts: SeedProduct[] = [
  {
    // Regular price + percent: the frontend calculates £23.80.
    title: 'Hyaluronic Acid Serum',
    volume: '30 ml',
    price: 28,
    discountPercent: 15,
    badges: [{ label: 'Sale', tone: 'sale' }],
    variationGroups: [
      { name: 'Choose formula', values: ['Hyaluronic Acid 2%', 'Hyaluronic + B5'] },
    ],
    categoryKeys: ['cleansers', 'face-wash'],
    image: 'product-serum.webp',
    sortOrder: 0,
  },
  {
    // Two badges and two variation groups.
    title: 'Daily Moisturiser',
    volume: '50 ml',
    price: 32,
    /**
     * No product-level discount here, deliberately, even though the Figma card
     * draws this one at "£32.00 / £27.20 / -15%".
     *
     * The mock is a still: nothing in it reacts to a click, and the chips below
     * advertise -10 % and -20 %. Keep the product's own -15 % and the card
     * contradicts itself the moment the shopper uses it — picking the "-10 %"
     * chip puts the price UP, from 27.20 to 28.80, because a variation discount
     * replaces the product's rather than stacking on it. With the product
     * discount gone, 30 ml is the plain £32.00 and every chip only ever takes
     * money off.
     */
    badges: [
      { label: 'New', tone: 'new' },
      { label: 'Bestseller', tone: 'bestseller' },
    ],
    variationGroups: [
      { name: 'Skin type', values: ['Dry', 'Normal', 'Sensitive'] },
      {
        name: 'Size',
        values: [
          '30 ml',
          // The label is kept alongside the number because the design spells the
          // two badges differently — "-10 %" with a space, "-20%" without.
          { label: '50 ml', discountPercent: 10, discountLabel: '-10 %' },
          { label: '100 ml', discountPercent: 20, discountLabel: '-20%' },
        ],
      },
    ],
    categoryKeys: ['cleansers'],
    image: 'product-moisturiser.webp',
    sortOrder: 1,
  },
  {
    title: 'Daily Face Cleanser',
    volume: '150 ml',
    price: 20,
    discountPercent: 15,
    badges: [{ label: 'Bestseller', tone: 'bestseller' }],
    variationGroups: [{ name: 'Choose formula', values: ['Gentle Hydrating', 'Deep Cleansing'] }],
    categoryKeys: ['cleansers', 'face-wash', 'makeup-removers'],
    image: 'product-cleanser.webp',
    sortOrder: 2,
  },
  {
    // Old price + sale price: the frontend calculates the -20% badge.
    title: 'Cleanse + Treat + Hydrate',
    volume: '3 products',
    price: 65,
    salePrice: 52,
    badges: [{ label: 'Bestseller', tone: 'bestseller' }],
    variationGroups: [
      {
        name: 'Set includes',
        /**
         * The thumbnail is the design's own: its two chips carry the same photo
         * (`pexels-tima-miroshnichenko-6763849`, drawn 26.98x28 with a 4px
         * radius), so both values point at the same file here. The field is per
         * value all the same, so an editor can give them different pictures
         * without a schema change.
         */
        values: [
          { label: 'Cleanser + Serum + Cream', icon: 'variation-set-includes.webp' },
          { label: 'Cleanser + Serum + SPF', icon: 'variation-set-includes.webp' },
        ],
      },
    ],
    categoryKeys: ['cleansers', 'makeup-removers'],
    image: 'product-set.webp',
    sortOrder: 3,
  },
  {
    title: 'Daily Sun Protection',
    volume: '50 ml',
    price: 26,
    salePrice: 22,
    badges: [{ label: 'New', tone: 'new' }],
    variationGroups: [
      {
        name: 'Choose finish',
        /**
         * Same story as "Set includes": the design puts one photo on both of
         * its chips (the dropper shot, drawn 30.04x26.97 with the same 4px
         * radius), so both values point at the same file.
         */
        values: [
          { label: 'Invisible Finish', icon: 'variation-choose-finish.webp' },
          { label: 'Tinted Finish', icon: 'variation-choose-finish.webp' },
        ],
      },
    ],
    categoryKeys: ['cleansers'],
    image: 'product-spf.webp',
    sortOrder: 4,
  },
  {
    // No discount, no badges, no variations and no image: the card has to render
    // correctly without reserving space for any of them.
    title: 'Soothing Face Mist',
    volume: '100 ml',
    price: 18,
    categoryKeys: ['face-wash'],
    sortOrder: 5,
  },
];
