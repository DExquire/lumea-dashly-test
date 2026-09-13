/**
 * Visual + geometry check against the Figma frames.
 *
 * Renders the page at the two design widths (1440 and 375), saves full-page
 * screenshots and measures the elements whose size and position are specified
 * in the design, printing the delta for each one. This turns "pixel perfect"
 * into something measurable instead of something eyeballed.
 *
 * Usage:
 *   npx playwright install chromium   # once
 *   node scripts/visual-check.mjs [http://localhost:3000] [outDir]
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

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

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 375, height: 812 },
};

async function measure(page, expectations) {
  return page.evaluate((items) => {
    return items.map((item) => {
      const element = document.querySelector(item.selector);

      if (!element) {
        return { name: item.name, missing: true };
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

function report(label, rows) {
  console.log(`\n=== ${label} ===`);

  let failures = 0;

  for (const row of rows) {
    if (row.missing) {
      console.log(`  MISSING  ${row.name}`);
      failures += 1;
      continue;
    }

    const diffs = [];

    for (const key of ['width', 'height', 'fontSize', 'lineHeight']) {
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

  // Honour a preinstalled Chromium (CI images often ship one) instead of
  // requiring `playwright install` in every environment.
  const executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
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
