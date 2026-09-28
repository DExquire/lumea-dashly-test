/**
 * Visual + geometry check against the Figma frames.
 *
 * Renders the page at the two design widths (1440 and 375), saves full-page
 * screenshots and measures the elements whose size and position are specified
 * in the design, printing the delta for each one. This turns "pixel perfect"
 * into something measurable instead of something eyeballed.
 *
 * Usage:
 *   npm run dev                                          # in another terminal
 *   node scripts/visual-check.mjs [http://localhost:3000] [outDir]
 *
 * Any Chrome or Chromium already installed is used (see `find-chromium.mjs`);
 * `npx playwright install chromium` is only needed when there is none, and
 * `CHROMIUM_PATH` overrides the search.
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { chromiumLaunchOptions } from './find-chromium.mjs';

const url = process.argv[2] ?? 'http://localhost:3000';
const outDir = process.argv[3] ?? path.join(process.cwd(), '.visual');


/** CSS-module class names compile to `<File>-module-scss-module__<hash>__<part>`. */
const sel = (moduleName, part) => `[class*="${moduleName}-module"][class*="__${part}"]`;

/** Expected geometry, straight from the Figma file. */
const EXPECTATIONS = {
  desktop: [
    { name: 'announcement bar', selector: sel('AnnouncementBar', 'viewport'), height: 44 },
    { name: 'header row', selector: sel('Header', 'bar'), height: 78 },
    { name: 'logo font-size', selector: sel('Header', 'logo'), fontSize: 40 },
    { name: 'nav link font-size', selector: sel('Header', 'navLink'), fontSize: 16 },
    { name: 'icon button', selector: sel("Header", "searchButton"), width: 40, height: 40 },
    { name: 'h1 font-size', selector: 'h1', fontSize: 125, lineHeight: 100 },
    { name: 'hero subtitle', selector: sel('Hero', 'subtitle'), fontSize: 28 },
    { name: 'hero CTA', selector: `${sel('Hero', 'ctaGroup')} a`, width: 365, height: 84 },
    { name: 'hero portrait', selector: sel('Hero', 'portrait'), width: 562, height: 374 },
    { name: 'essentials card', selector: sel('Hero', 'essentials'), width: 246 },
    { name: 'trust box', selector: sel('Hero', 'trust'), width: 331, height: 58 },
    { name: 'section heading', selector: 'h2', fontSize: 38 },
    { name: 'step card', selector: sel('StepCard', 'root'), width: 500 },
    { name: 'step title', selector: sel('StepCard', 'title'), fontSize: 50 },
    { name: 'step tagline', selector: sel('StepCard', 'tagline'), fontSize: 32 },
    { name: 'step description', selector: sel('StepCard', 'description'), fontSize: 18 },
    { name: 'step CTA', selector: sel('StepCard', 'cta'), fontSize: 24 },
    { name: 'product card', selector: sel('ProductCard', 'root'), width: 264 },
    { name: 'product title', selector: sel('ProductCard', 'title'), fontSize: 18 },
    { name: 'price row', selector: sel('Price', 'root'), height: 44 },
    { name: 'variation chip', selector: sel('VariationSelector', 'chip'), height: 40 },
    /* The badge is tilted, so these are the painted box the design shows
       (43x23 for a 43x21 pill turned -3deg), not its CSS width and height. */
    { name: 'chip discount badge', selector: sel('VariationSelector', 'discount'), width: 44, height: 23 },
  ],
  mobile: [
    { name: 'announcement bar', selector: sel('AnnouncementBar', 'viewport'), height: 44 },
    { name: 'h1 font-size', selector: 'h1', fontSize: 40, lineHeight: 36 },
    { name: 'hero subtitle', selector: sel('Hero', 'subtitle'), fontSize: 18 },
    { name: 'hero CTA', selector: `${sel('Hero', 'ctaGroup')} a`, height: 54 },
    { name: 'burger', selector: sel('Header', 'menuButton'), width: 44, height: 44 },
    { name: 'step card', selector: sel('StepCard', 'root'), width: 347 },
  ],
};

/**
 * Exact page geometry, read out of the Figma file itself rather than measured
 * off an export: `absoluteBoundingBox` of each node in `Hero Section`, minus the
 * frame's own origin. The 1440 frame starts at the top of the page, so a node's
 * frame coordinates are its page coordinates.
 *
 * Sizes alone were never enough — the hero photo was the right width for days
 * while sitting in the wrong place and 11px too short, because nothing here
 * checked where an element actually lands.
 */
const FIGMA_BOXES = [
  { name: 'announcement bar', selector: sel('AnnouncementBar', 'viewport'), x: 491, y: 44, width: 458, height: 44 },
  { name: 'header row', selector: sel('Header', 'bar'), box: 'content', x: 80, y: 100, width: 1280, height: 78 },
  { name: 'h1 first line', selector: 'h1', box: 'content', x: 100, y: 186 },
  { name: 'hero CTA', selector: `${sel('Hero', 'ctaGroup')} a`, x: 100, y: 529, width: 365, height: 84 },
  { name: 'hero portrait', selector: sel('Hero', 'portrait'), x: 486, y: 438, width: 562, height: 374 },
  { name: 'hero detail photo', selector: sel('Hero', 'detail'), x: 1127, y: 468, width: 184, height: 129 },
  { name: 'essentials card', selector: sel('Hero', 'essentials'), x: 1094, y: 586, width: 246, height: 201 },
  { name: 'essentials title', selector: sel('Hero', 'essentialsTitle'), x: 1114, y: 611, height: 24 },
  { name: 'essentials text', selector: sel('Hero', 'essentialsText'), x: 1114, y: 647 },
  { name: 'essentials button', selector: `${sel('Hero', 'essentials')} a`, x: 1114, y: 716, width: 206, height: 54 },
  { name: 'trust plate', selector: sel('Hero', 'trust'), fromBottom: true, x: 922, y: 840, width: 331, height: 58 },
  { name: 'trust label box', selector: sel('Hero', 'trust'), box: 'content', x: 969, width: 237 },
  // `Rectangle 10` — the open frame around the plate, drawn as `.trust::before`.
  { name: 'trust outline', selector: sel('Hero', 'trust'), pseudo: '::before', fromBottom: true, x: 911, y: 831, width: 356, height: 76 },
];

/**
 * The four step cards, measured off the design's own 1440 export. Each photo has
 * its own size there and every description runs to three lines — a single shared
 * maximum for all four cards reproduces none of them.
 */
const FIGMA_STEPS = [
  { name: '01 Cleanse', width: 320, height: 213, lines: 3 },
  { name: '02 Treat', width: 388, height: 160, lines: 3 },
  { name: '03 Moisturise', width: 300, height: 156, lines: 3 },
  { name: '04 Protect', width: 391, height: 194, lines: 3 },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 375, height: 812 },
};

async function measure(page, expectations) {
  return page.evaluate((items) => {
    return items.map((item) => {
      const element = document.querySelector(item.selector);

      if (!element) {
        /**
         * The announcement bar, the product cards and everything inside them are
         * CMS content. With Strapi unreachable there is nothing to render, which
         * is a missing dependency rather than a layout failure — the page is
         * built to degrade to exactly this.
         */
        const fromCms = ['AnnouncementBar', 'ProductCard', 'Price', 'VariationSelector'].some(
          (name) => item.selector.includes(name)
        );
        const hasProducts = Boolean(
          document.querySelector('[class*="ProductCard-module"][class*="__root"]')
        );

        return {
          name: item.name,
          missing: true,
          note: fromCms && !hasProducts ? 'CMS offline' : null,
        };
      }

      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);

      return {
        name: item.name,
        expected: item,
        actual: {
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
          fontSize: Number.parseFloat(styles.fontSize),
          lineHeight: Number.parseFloat(styles.lineHeight),
        },
      };
    });
  }, expectations);
}

/**
 * Page-absolute box of each node, compared against the Figma coordinates. A
 * pseudo-element has no rect of its own, so its box is reconstructed from its
 * host's padding box and its resolved insets — which is exactly how the browser
 * lays it out.
 */
async function measureBoxes(page, items) {
  return page.evaluate((list) => {
    const round = (n) => Math.round(n * 100) / 100;

    /**
     * The announcement bar's messages come from Strapi. With the CMS offline the
     * bar renders nothing and everything under it sits 56px higher (its 44px box
     * plus the 12px gap below it), which would otherwise be reported as nine
     * separate position failures instead of one missing dependency.
     */
    const barPresent = Boolean(
      document.querySelector('[class*="AnnouncementBar-module"][class*="__viewport"]')
    );
    const offset = barPresent ? 0 : 56;

    return list.map((item) => {
      const element = document.querySelector(item.selector);

      if (!element) {
        return { name: item.name, missing: true, note: barPresent ? null : 'CMS offline' };
      }

      const rect = element.getBoundingClientRect();
      let box = {
        x: rect.left + window.scrollX,
        // Anything anchored to the bottom of the hero keeps its place when the
        // bar is absent, so the correction applies only to the rest.
        y: rect.top + window.scrollY + (item.fromBottom ? 0 : offset),
        width: rect.width,
        height: rect.height,
      };

      // Some Figma nodes are the content row of an element that also carries the
      // page gutter (the header) or an optical indent (the h1), so the box worth
      // comparing is the content box rather than the border box.
      if (item.box === 'content') {
        const styles = window.getComputedStyle(element);
        const left = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.borderLeftWidth);
        const right = Number.parseFloat(styles.paddingRight) + Number.parseFloat(styles.borderRightWidth);
        const top = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.borderTopWidth);
        const bottom = Number.parseFloat(styles.paddingBottom) + Number.parseFloat(styles.borderBottomWidth);

        box = {
          x: box.x + left,
          y: box.y + top,
          width: box.width - left - right,
          height: box.height - top - bottom,
        };
      }

      if (item.pseudo) {
        const styles = window.getComputedStyle(element, item.pseudo);

        if (styles.content === 'none') {
          return { name: item.name, missing: true };
        }

        const left = Number.parseFloat(styles.left);
        const top = Number.parseFloat(styles.top);
        const right = Number.parseFloat(styles.right);
        const bottom = Number.parseFloat(styles.bottom);

        box = {
          x: box.x + left,
          y: box.y + top,
          width: box.width - left - right,
          height: box.height - top - bottom,
        };
      }

      return {
        name: item.name,
        expected: item,
        actual: {
          x: round(box.x),
          y: round(box.y),
          width: round(box.width),
          height: round(box.height),
        },
      };
    });
  }, items);
}

/** Photo box and copy wrapping of every step card, in document order. */
async function measureSteps(page, expected) {
  return page.evaluate(
    ({ list, cardSelector, mediaSelector, descSelector }) => {
      const cards = [...document.querySelectorAll(cardSelector)];

      return list.map((item, index) => {
        const card = cards[index];

        if (!card) {
          return { name: item.name, missing: true };
        }

        const media = card.querySelector(mediaSelector)?.getBoundingClientRect();
        const description = card.querySelector(descSelector);
        const styles = description && window.getComputedStyle(description);
        const lines =
          description && styles
            ? Math.round(
                description.getBoundingClientRect().height / Number.parseFloat(styles.lineHeight)
              )
            : null;

        return {
          name: item.name,
          expected: item,
          actual: {
            width: media ? Math.round(media.width * 100) / 100 : null,
            height: media ? Math.round(media.height * 100) / 100 : null,
            lines,
          },
        };
      });
    },
    {
      list: expected,
      cardSelector: sel('StepCard', 'root'),
      mediaSelector: sel('StepCard', 'media'),
      descSelector: sel('StepCard', 'description'),
    }
  );
}

function report(label, rows) {
  console.log(`\n=== ${label} ===`);

  let failures = 0;

  for (const row of rows) {
    if (row.missing) {
      if (row.note === 'CMS offline') {
        console.log(`  skipped  ${row.name} — not rendered, the CMS is not reachable`);
        continue;
      }

      console.log(`  MISSING  ${row.name}`);
      failures += 1;
      continue;
    }

    const diffs = [];

    for (const key of ['x', 'y', 'width', 'height', 'fontSize', 'lineHeight', 'lines']) {
      const expected = row.expected[key];

      if (expected === undefined) {
        continue;
      }

      const actual = row.actual[key];
      const delta = Math.round((actual - expected) * 100) / 100;

      if (Math.abs(delta) > 1) {
        diffs.push(`${key}: ${actual} vs ${expected} (${delta > 0 ? '+' : ''}${delta})`);
      }
    }

    if (diffs.length === 0) {
      console.log(`  ok       ${row.name}`);
    } else {
      console.log(`  DIFF     ${row.name} — ${diffs.join(', ')}`);
      failures += 1;
    }
  }

  return failures;
}

/**
 * The two Figma frames are only the endpoints. The desktop hero is a fixed
 * composition — artwork placed in % of the content column, copy at an offset
 * from its edge — so the widths *between* the frames are where it can fall
 * apart, which is exactly what the task means by "smooth intermediate widths".
 * Walk the range and require that the CTA never runs into the artwork.
 */
async function intermediateWidths(browser) {
  console.log('\n=== intermediate widths ===');

  let failures = 0;

  for (const width of [1024, 1100, 1200, 1280, 1360, 1440, 1600]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);

    const gap = await page.evaluate(
      ({ ctaSelector, portraitSelector }) => {
        const cta = document.querySelector(ctaSelector)?.getBoundingClientRect();
        const portrait = document.querySelector(portraitSelector)?.getBoundingClientRect();

        return cta && portrait ? Math.round(portrait.left - cta.right) : null;
      },
      { ctaSelector: `${sel('Hero', 'ctaGroup')} a`, portraitSelector: sel('Hero', 'portrait') }
    );

    await page.close();

    if (gap === null) {
      console.log(`  MISSING  ${width}px — hero CTA or portrait not found`);
      failures += 1;
    } else if (gap < 0) {
      console.log(`  OVERLAP  ${width}px — CTA runs ${-gap}px into the portrait`);
      failures += 1;
    } else {
      console.log(`  ok       ${width}px — ${gap}px between the CTA and the portrait`);
    }
  }

  return failures;
}

/**
 * `fullPage` screenshots do not scroll, so lazily loaded images below the fold
 * would be captured as empty boxes. Walk the page once, wait for every image to
 * finish decoding, then return to the top so the sticky stack is reset before
 * anything is measured.
 */
async function settle(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && [...document.images].some((img) => !img.complete)) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

async function run() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch(chromiumLaunchOptions());
  let failures = 0;

  try {
    for (const [label, viewport] of Object.entries(VIEWPORTS)) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });

      await page.goto(url, { waitUntil: 'networkidle' });
      // Let fonts settle so text metrics are measured against the real font.
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      await settle(page);

      await page.screenshot({
        path: path.join(outDir, `${label}-full.png`),
        fullPage: true,
      });

      await page.screenshot({ path: path.join(outDir, `${label}-viewport.png`) });

      failures += report(label, await measure(page, EXPECTATIONS[label]));

      if (label === 'desktop') {
        failures += report('figma boxes @1440', await measureBoxes(page, FIGMA_BOXES));
        failures += report('step photos @1440', await measureSteps(page, FIGMA_STEPS));
      }

      await page.close();
    }

    failures += await intermediateWidths(browser);
  } finally {
    await browser.close();
  }

  console.log(`\nScreenshots written to ${outDir}`);
  console.log(failures === 0 ? 'All measured values match the design.' : `${failures} deviation(s).`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
