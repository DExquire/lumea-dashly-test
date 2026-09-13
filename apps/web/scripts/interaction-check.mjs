/**
 * Behaviour checks for the parts of the task that are about interaction rather
 * than layout: the stacking cards, the mobile products overlay and the rotating
 * announcement bar.
 *
 * Usage:
 *   node scripts/interaction-check.mjs [http://localhost:3000] [outDir]
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:3000';
const outDir = process.argv[3] ?? path.join(process.cwd(), '.visual');

const sel = (moduleName, part) => `[class*="${moduleName}-module"][class*="__${part}"]`;

const results = [];

function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`  ${passed ? 'ok  ' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function stackingCards(page) {
  console.log('\n=== stacking cards (desktop) ===');

  const cards = page.locator(sel('HowItWorks', 'stackItem'));
  const count = await cards.count();

  check('four step cards', count === 4, `found ${count}`);

  const section = page.locator('#how-it-works');

  // Walk the page first: the step images load lazily, and measuring the section
  // before they are in place gives a section that is hundreds of pixels short —
  // every sample would then land in the wrong part of the scroll.
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

  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // Scroll through the section and collect how many cards are stuck at their
  // resting offset plus which step is reported as active.
  const states = [];
  // Document coordinates, not `boundingBox()` — that one is relative to the
  // viewport, so after scrolling the section into view its `y` is near zero and
  // every sample below would probe the wrong part of the page.
  const sectionBox = await section.evaluate((el) => {
    const rect = el.getBoundingClientRect();

    return { y: rect.top + window.scrollY, height: rect.height };
  });

  const samples = 12;

  for (let step = 0; step <= samples; step += 1) {
    const y = (sectionBox?.y ?? 0) + (step * (sectionBox?.height ?? 0)) / samples;

    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(250);

    const state = await page.evaluate(
      ({ itemSelector, cardSelector }) => {
        const items = Array.from(document.querySelectorAll(itemSelector));

        // Compare against each item's own resolved `top`: the offsets come from
        // a clamp() on the viewport height, which a custom property would hand
        // back unresolved.
        const stuck = items.filter((item) => {
          const resting = Number.parseFloat(window.getComputedStyle(item).top);

          return Number.isFinite(resting) && Math.abs(item.getBoundingClientRect().top - resting) < 2;
        }).length;

        const activeIndex = Array.from(document.querySelectorAll(cardSelector)).findIndex(
          (card) => card.hasAttribute('data-active'),
        );

        return { stuck, count: items.length, activeIndex, scrollY: Math.round(window.scrollY) };
      },
      { itemSelector: sel('HowItWorks', 'stackItem'), cardSelector: sel('StepCard', 'root') },
    );

    states.push(state);
  }

  const maxStuck = Math.max(...states.map((s) => s.stuck));
  const activeIndices = states.map((s) => s.activeIndex);

  const cardCount = Math.max(...states.map((s) => s.count));

  // Every card has to reach its own resting offset. A looser threshold ("at
  // least two") hides the failure mode where the stack runs out of container
  // and the last cards bunch together with their titles clipped.
  check(
    'every card reaches its place in the stack',
    maxStuck >= cardCount,
    `stacked ${maxStuck} of ${cardCount} — ${states.map((st) => st.stuck).join('')}`,
  );
  check(
    'active step follows the stack',
    Math.max(...activeIndices) >= cardCount - 1,
    `active: ${activeIndices.join(' → ')}`,
  );

  // Both checks below only mean anything once the pile is actually assembled,
  // so park the page at the first scroll position where it was.
  const assembledAt = states.find((state) => state.stuck >= cardCount)?.scrollY;

  if (assembledAt !== undefined) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), assembledAt);
    await page.waitForTimeout(300);
  }

  // In the design a covered card shows its number, title and tagline inside the
  // peek — that is what the 105px step is sized for. Anything less and the pile
  // reads as sliced text, which no amount of "cards do stack" would catch.
  const peekFits = await page.evaluate(
    ({ itemSelector, taglineSelector }) => {
      const items = [...document.querySelectorAll(itemSelector)];

      return items.slice(0, -1).map((item, index) => {
        const band = items[index + 1].getBoundingClientRect().top - item.getBoundingClientRect().top;
        const tagline = item.querySelector(taglineSelector)?.getBoundingClientRect();
        const used = tagline ? tagline.bottom - item.getBoundingClientRect().top : 0;

        return Math.round(band - used);
      });
    },
    { itemSelector: sel('HowItWorks', 'stackItem'), taglineSelector: sel('StepCard', 'tagline') },
  );

  check(
    'a covered card shows its number, title and tagline',
    peekFits.every((slack) => slack >= 0),
    `slack per covered card: ${peekFits.join(', ')}px`,
  );

  // Tapping a covered card should scroll it back into full view.
  // Scroll so later cards are stacked, then tap a covered one.
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), (sectionBox?.y ?? 0) + (sectionBox?.height ?? 0) * 0.75);
  await page.waitForTimeout(300);

  const before = await page.evaluate(() => Math.round(window.scrollY));

  await page.locator(sel('StepCard', 'headingButton')).nth(1).click();
  await page.waitForTimeout(900);

  const after = await page.evaluate(() => Math.round(window.scrollY));

  check('tapping a covered card scrolls it into view', before !== after, `${before} → ${after}`);

  await page.screenshot({ path: path.join(outDir, 'stack-mid-scroll.png') });
}

async function announcementBar(page) {
  console.log('\n=== announcement bar ===');

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

  const bar = page.locator(sel('AnnouncementBar', 'viewport'));
  const messages = page.locator(sel('AnnouncementBar', 'message'));

  const total = await messages.count();
  const firstHeight = (await bar.boundingBox())?.height ?? 0;

  const activeText = async () =>
    page.evaluate((selector) => {
      const active = document.querySelector(`${selector}[data-active]`);

      return active?.textContent?.trim() ?? '';
    }, sel('AnnouncementBar', 'message'));

  const first = await activeText();

  check('all CMS messages are rendered', total > 1, `${total} messages`);

  // The rotation interval is 4s; wait a little longer than one cycle.
  await page.waitForTimeout(4600);

  const second = await activeText();
  const secondHeight = (await bar.boundingBox())?.height ?? 0;

  check('message rotates automatically', first !== second, `"${first}" → "${second}"`);
  check(
    'bar height does not change on rotation',
    Math.abs(firstHeight - secondHeight) < 0.5,
    `${firstHeight} → ${secondHeight}`,
  );
}

async function mobileOverlay(page) {
  console.log('\n=== mobile products overlay ===');

  const stepCta = page.locator(sel('StepCard', 'cta')).first();

  await stepCta.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const scrollBefore = await page.evaluate(() => Math.round(window.scrollY));

  await stepCta.click();
  await page.waitForTimeout(600);

  const dialog = page.locator('[role="dialog"]');

  check('overlay opens from the step CTA', await dialog.isVisible());
  check(
    'page scrolling is locked while open',
    await page.evaluate(() => document.body.style.overflow === 'hidden'),
  );

  const categories = page.locator(`${sel('MobileProductsSheet', 'sheet')} ${sel('CategoryFilter', 'item')}`);
  const steps = page.locator('[role="group"][aria-labelledby="sheet-steps-label"] > button');

  check('categories are switchable inside the overlay', (await categories.count()) > 1);
  check('all four steps are switchable at the bottom', (await steps.count()) === 4);

  await page.screenshot({ path: path.join(outDir, 'mobile-overlay.png') });

  // Switching the step keeps the overlay open and moves the active state.
  await steps.nth(2).click();
  await page.waitForTimeout(300);

  check(
    'switching step updates the active state',
    await steps.nth(2).evaluate((el) => el.getAttribute('aria-pressed') === 'true'),
  );

  await page.locator(`${sel('MobileProductsSheet', 'close')}`).click();
  await page.waitForTimeout(700);

  const scrollAfter = await page.evaluate(() => Math.round(window.scrollY));

  check('overlay closes with ×', (await dialog.count()) === 0);
  check(
    'scroll position is restored after closing',
    Math.abs(scrollBefore - scrollAfter) < 4,
    `${scrollBefore} → ${scrollAfter}`,
  );
}

async function run() {
  await mkdir(outDir, { recursive: true });

  const executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});

  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await desktop.goto(url, { waitUntil: 'networkidle' });
    await stackingCards(desktop);
    await announcementBar(desktop);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });

    await mobile.goto(url, { waitUntil: 'networkidle' });
    await mobileOverlay(mobile);
    await mobile.close();
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.passed);

  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed${
      failed.length ? `, failing: ${failed.map((f) => f.name).join('; ')}` : ''
    }`,
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
