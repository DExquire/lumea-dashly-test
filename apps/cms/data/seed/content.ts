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
  discountLabel?: string;
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
    discountPercent: 15,
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
          { label: '50 ml', discountLabel: '-10 %' },
          { label: '100 ml', discountLabel: '-20%' },
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
        values: ['Cleanser + Serum + Cream', 'Cleanser + Serum + SPF'],
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
    variationGroups: [{ name: 'Choose finish', values: ['Invisible Finish', 'Tinted Finish'] }],
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
