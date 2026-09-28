import type { RoutineStep } from "@/types/content";

/**
 * The four "How it works" step cards.
 *
 * Per the task these belong to the page design, not to the CMS — but they are
 * still data: the section renders whatever this array contains, so the order or
 * wording can change in one place without touching a component.
 *
 * `peek` is how far a card comes to rest below the one above it once the pile
 * is assembled — the height of its own step in the ladder, in px, and the one
 * knob for the collapsed state. Each card has its own, desktop and mobile
 * separately; step 01 has none, because nothing rests above it. Changing one
 * moves that card and everything under it and leaves the cards above it alone.
 * Deleting the line hands the card back to the section's own figure,
 * `$stack-peek-desktop` / `$stack-peek-mobile` in `styles/_tokens.scss`.
 */
export const routineSteps: RoutineStep[] = [
  {
    id: "cleanse",
    mobile: {
      titleSize: 40,
      titleWeight: 400,
      titleLineHeight: 0.8,
      titleRowMin: 58,
      taglineSize: 32,
      taglineWeight: 700,
      descriptionWidth: 320,
      descriptionSize: 18,
      descriptionLineHeight: 23.4,
      descriptionWeight: 700,
      image: { width: 300, height: 110, x: 47, y: 310, radius: 13.33 },
      ctaInset: 0,
      // The link's own node is at y251 on the frame, and our three-line
      // description box ends at 220.17 (Figma's is 69 tall against our 70.2 —
      // it measures a text box by the font's ink, the browser by line boxes).
      ctaGap: 30.83,
    },
    number: "01",
    numeral: 1,
    title: "Cleanse",
    tagline: "Start with a fresh canvas.",
    description:
      "Gently remove makeup, SPF and daily impurities without stripping your skin.",
    ctaLabel: "Shop cleansers",
    descriptionWidth: 320,
    tone: "neutral",
    image: {
      src: "/images/step-cleanse.webp",
      alt: "Cleansing gel poured onto a cotton pad",
      width: 320,
      height: 213,
      align: "start",
    },
  },
  {
    id: "treat",
    /* How far this card rests below the one above it in the pile. */
    peek: 90,
    mobile: {
      peek: 130,
      titleSize: 36,
      titleWeight: 400,
      titleLineHeight: 0.8,
      titleRowMin: 0,
      taglineSize: 32,
      taglineWeight: 400,
      descriptionWidth: 320,
      // A size down and lighter than the other three, straight off the node:
      // this is the longest of the four paragraphs and the card is the same 420
      // tall with its photo pinned at 310, so the design buys the room back in
      // the type rather than in the layout.
      descriptionSize: 16,
      descriptionLineHeight: 17.6,
      descriptionWeight: 400,
      image: { width: 300, height: 110, x: 47, y: 310, radius: 17.71 },
      ctaInset: -6,
      ctaGap: 45.2,
    },
    number: "02",
    numeral: 2,
    title: "Treat",
    tagline: "Target what your skin needs.",
    description:
      "Serums and treatments deliver targeted ingredients to help with dryness, dullness, texture and blemishes.",
    ctaLabel: "Shop treatments",
    descriptionWidth: 372,
    // 30 and 41, measured as a pair. This card's text sat 2px above the design
    // all the way down — its title's ink at 1920 against 1922, its CTA rule at
    // 2163 against 2165 — while the card's own top edge was already right at
    // 1874. The 2px therefore belong to the padding above the text. They are
    // taken straight back out of the gap under the CTA, so the photo does not
    // move (the design has its top edge where it already was) and the card is
    // exactly as tall as before, which is what the pile is measured against.
    mediaGap: 30,
    paddingTop: 41,
    paddingTopExpandedOnly: 2,
    paddingBottom: 37,
    tone: "mint",
    image: {
      src: "/images/step-treat.webp",
      alt: "Treatment applied to the face with a cotton pad",
      width: 388,
      height: 160,
      align: "start",
    },
  },
  {
    id: "moisturise",
    /* How far this card rests below the one above it in the pile. */
    peek: 105,
    mobile: {
      peek: 130,
      titleSize: 36,
      titleWeight: 400,
      titleLineHeight: 0.8,
      titleRowMin: 0,
      taglineSize: 26,
      taglineWeight: 400,
      descriptionWidth: 301,
      descriptionSize: 18,
      descriptionLineHeight: 23.4,
      descriptionWeight: 700,
      image: {
        width: 104.77,
        height: 156.96,
        x: 218.05,
        y: 244.51,
        radius: 30,
      },
      ctaInset: -6,
      ctaGap: 42.83,
    },
    number: "03",
    numeral: 3,
    title: "Moisturise",
    tagline: "Lock in lasting hydration.",
    description:
      "Moisturisers help strengthen the skin barrier, lock in hydration and leave skin soft and balanced.",
    ctaLabel: "Shop moisturisers",
    // This photo reaches up beside the CTA rather than starting under it, and
    // it is the card's text that is drawn over it — see `.head, .body` in the
    // stylesheet — so the link's rule stays whole across the overlap.
    mediaGap: 0,
    mediaOffsetX: 22,
    descriptionWidth: 300,
    paddingTop: 40,
    paddingBottom: 31,
    tone: "neutral",
    image: {
      src: "/images/step-moisturise.webp",
      alt: "Woman applying moisturiser after a shower",
      width: 300,
      height: 156,
      align: "end",
    },
  },
  {
    id: "protect",
    /* How far this card rests below the one above it in the pile. */
    peek: 105,
    mobile: {
      peek: 130,
      titleSize: 50,
      titleWeight: 700,
      titleLineHeight: 1,
      titleRowMin: 0,
      taglineSize: 32,
      taglineWeight: 400,
      descriptionWidth: 320,
      descriptionSize: 18,
      descriptionLineHeight: 23.4,
      descriptionWeight: 700,
      image: { width: 185.61, height: 92.04, x: 8, y: 310, radius: 30 },
      ctaInset: -6,
      ctaGap: 42.83,
    },
    number: "04",
    numeral: 4,
    title: "Protect",
    tagline: "Your essential final step.",
    description:
      "Daily SPF helps protect your skin from UV damage and keeps it looking healthy every day.",
    ctaLabel: "Shop SPF",
    // 20 and 42, the same pair as step 02 and for the same reason: the text was
    // 1px high (title ink 2969 against 2970, CTA rule 3212 against 3213) and
    // that pixel comes out of the gap under the CTA so the photo stays put.
    mediaGap: 20,
    paddingTop: 42,
    paddingTopExpandedOnly: 1,
    paddingBottom: 37,
    tone: "blush",
    image: {
      src: "/images/step-protect.webp",
      alt: "Sunscreen being smoothed onto the forehead",
      width: 391,
      height: 194,
      align: "start",
    },
  },
];
