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
  /**
   * The small tilted badge the design pins to the top edge of a chip — "-10 %"
   * on 50 ml, "-20%" on 100 ml. Free text rather than a number: the design
   * spells the two differently, and an editor may want "2 for 1" there.
   * `null` when the option carries no badge, which is most of them.
   */
  discount: string | null;
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
  /**
   * Width of the copy box on desktop, when the design gives this card its own.
   * Every step has a separate text node in Figma and they are not all the same
   * width — step 01 breaks after "SPF and" at 320 while 02 and 04 run to 360 —
   * so a single shared maximum silently rewraps somebody's paragraph.
   */
  descriptionWidth?: number;
  /**
   * Floor for the card's height on desktop, when a step should be taller than
   * its own content makes it. Cards are free to differ — the stack measures them
   * and compensates — so this is only for deliberately giving one more room, not
   * something the layout needs.
   */
  minHeight?: number;
  /**
   * Space between the CTA and the photo, in px. The design keeps every other
   * gap inside a card constant but not this one — 10 on step 01, 32 on 02,
   * 21 on 04 — so it belongs to the step, not to the stylesheet.
   */
  mediaGap?: number;
  /**
   * Padding above and below the card's content, when this step's is not the
   * common 32/39. Measured on the design, step 02 carries 39 above its numeral
   * and 37 under its photo.
   */
  paddingTop?: number;
  paddingBottom?: number;
  /**
   * The part of `paddingTop`, in px, that belongs to the expanded card only.
   *
   * A card loses 25px of padding at each end the moment it joins the pile, and
   * what is left has to keep the number, the title and the tagline inside the
   * 105px of it the card above leaves showing — steps 02 and 03 had 1px and 0px
   * to spare. The pixels added to `paddingTop` to put the expanded card's text
   * where the design draws it would have spent that margin and clipped the
   * tagline, so they are taken back out again as the card settles.
   */
  paddingTopExpandedOnly?: number;
  /**
   * How far this card comes to rest below the one above it once the pile is
   * assembled, in px — the height of its own step in the ladder.
   *
   * Left out, it lifts by the section's figure: `$stack-peek-desktop` and
   * `$stack-peek-mobile` in `styles/_tokens.scss`, 105 and 130. Setting it moves
   * this card and everything under it by the difference and leaves the cards
   * above it where they were; the column's own length does not change either
   * way. The first step's value is never used — nothing rests above it.
   */
  peek?: number;
  /**
   * The mobile frame's own numbers for this step.
   *
   * Its four cards are not one card with four texts: the title is 40, 36, 36
   * and 50, the tagline 32 except step 03's 26, and the photograph is a
   * different size, corner and place on every one of them — 300x110 bottom
   * right on 01 and 02, a 105x157 portrait two thirds across on 03, a 186x92
   * strip on the left on 04. All four cards are 420 tall regardless, so the
   * picture is placed against the card's own box rather than flowing under the
   * copy.
   */
  mobile?: {
    titleSize: number;
    titleWeight: number;
    titleLineHeight: number;
    /** Step 01's title row is a fixed 58 in the frame; the rest are content-tall. */
    titleRowMin: number;
    taglineSize: number;
    /** 700 on step 01, 400 on the other three. */
    taglineWeight: number;
    descriptionWidth: number;
    /** 18/23.4 700 on 01, 03 and 04; 16/17.6 400 on 02, whose copy is the
     *  longest and has to hold three lines in the same 420px card. */
    descriptionSize: number;
    descriptionLineHeight: number;
    descriptionWeight: number;
    /** Offset from the card's top-left corner, in px. */
    image: { width: number; height: number; x: number; y: number; radius: number };
    /** The CTA sits on the inner padding, which is 14 on step 01 and 8 elsewhere. */
    ctaInset: number;
    /** Overrides `peek` below `lg`, where the cards are shorter and the frame
     *  lifts them 130 rather than 105. */
    peek?: number;
    /** Space above the CTA: 32 on step 01, 44 on the rest (their copy block has
     *  12 of its own padding under it). */
    ctaGap: number;
  };
  /**
   * Horizontal nudge for the photo, in px, positive to the right. Step 03's
   * photo is not aligned to the card's padding box in the design: it sits at
   * x182 and runs to 482, 22px past the 40px side padding, while still staying
   * inside the card.
   */
  mediaOffsetX?: number;
  /** Card background from the design: plain, mint (02) or blush (04). */
  tone: 'neutral' | 'mint' | 'blush';
  image: {
    src: string;
    alt: string;
    /**
     * Size of the image box on desktop, in Figma pixels. Each step has its own
     * (320x213, 388x160, 300x156, 391x194): the photos are not one size cropped
     * differently, so clamping them all to a single maximum makes every card the
     * wrong height.
     */
    width: number;
    height: number;
    /** Horizontal placement of the image inside the card. */
    align: 'start' | 'end';
  };
}
