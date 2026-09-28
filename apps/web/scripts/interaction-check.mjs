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
import { chromiumLaunchOptions } from './find-chromium.mjs';

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

  // A card in the pile is covered only as far as the card in front of it is
  // wide, so anything reaching past its own edge — a photo hung on the right,
  // a shadow given a negative margin — surfaces as a stray strip beside the
  // stack instead of being hidden behind the next card.
  const bleed = await page.evaluate((cardSelector) => {
    const worst = { amount: 0, what: '' };

    for (const card of document.querySelectorAll(cardSelector)) {
      const edge = card.getBoundingClientRect();

      for (const child of card.querySelectorAll('*')) {
        // Shapes inside an <svg> report boxes in their own coordinate space
        // (a <defs> sits at the origin), so only the <svg> element itself —
        // which is laid out like any other box — is meaningful here.
        if (child.ownerSVGElement) {
          continue;
        }

        const box = child.getBoundingClientRect();

        if (box.width === 0 || box.height === 0) {
          continue;
        }

        const over = Math.round(Math.max(box.right - edge.right, edge.left - box.left));

        if (over > worst.amount) {
          worst.amount = over;
          worst.what = `${child.tagName.toLowerCase()}.${`${child.className}`.replace(/.*__/, '')}`;
        }
      }
    }

    return worst;
  }, sel('StepCard', 'root'));

  check(
    'nothing inside a card reaches past its edge',
    bleed.amount <= 1,
    bleed.amount > 1 ? `${bleed.what} sticks out ${bleed.amount}px` : 'every card clips to its own width',
  );

  /**
   * Once assembled, the pile has to *leave* as one block.
   *
   * A sticky card is released at `container bottom − its bottom margin − its own
   * height`, so cards of different heights release at different moments: the
   * tallest one slides out first and the steps between the others drift apart
   * and — worse — collapse, slicing the taglines of the cards it uncovers. This
   * is the last section on the page, so that broken state is not a moment in
   * passing, it is the final thing on screen. Sweep the whole tail in small
   * steps and require the step to stay one peek the entire way down.
   */
  const release = await page.evaluate(
    async ({ itemSelector, from }) => {
      const steps = () => {
        const tops = [...document.querySelectorAll(itemSelector)].map(
          (item) => item.getBoundingClientRect().top,
        );

        return tops.slice(1).map((top, index) => Math.round(top - tops[index]));
      };

      const limit = () => document.documentElement.scrollHeight - window.innerHeight;

      window.scrollTo({ top: from, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 150));

      const peek = steps()[0];
      let worst = { step: Number.POSITIVE_INFINITY, scrollY: from };

      for (let y = from; y <= limit(); y += 40) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        for (const step of steps()) {
          if (step < worst.step) {
            worst = { step, scrollY: Math.round(window.scrollY) };
          }
        }
      }

      return { peek, worst };
    },
    { itemSelector: sel('HowItWorks', 'stackItem'), from: assembledAt ?? 0 },
  );

  check(
    'the assembled pile leaves as one block',
    assembledAt !== undefined && release.worst.step >= release.peek - 2,
    `smallest step below the assembled ${release.peek}px is ${release.worst.step}px (at scrollY ${release.worst.scrollY})`,
  );

  /**
   * The last screen of the page.
   *
   * This is the final section, so wherever the two columns happen to stop is
   * what the visitor is left looking at. The pile comes to rest at the bottom of
   * its column and the taller products column is pushed up to the same line, so
   * the two have to finish together — and the section's trailing band has to
   * keep both of them off the window edge, or the bottom row of product buttons
   * reads as cut off rather than as the end of the page.
   */
  const ending = await page.evaluate(
    async ({ cardSelector, productsSelector }) => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 250));

      const cards = [...document.querySelectorAll(cardSelector)];
      const products = document.querySelector(productsSelector);

      return {
        card: Math.round(cards[cards.length - 1].getBoundingClientRect().bottom),
        products: Math.round(products.getBoundingClientRect().bottom),
        viewport: window.innerHeight,
      };
    },
    { cardSelector: sel('StepCard', 'root'), productsSelector: sel('HowItWorks', 'products') },
  );

  check(
    'both columns end on the same line, clear of the window edge',
    Math.abs(ending.card - ending.products) <= 2 && ending.viewport - ending.products >= 24,
    `last card ${ending.card}px, products ${ending.products}px, window ${ending.viewport}px`,
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

  /**
   * The rail inside the sheet is taller than the sheet, and a flex column with
   * `overflow-y: auto` will happily take that difference out of its other
   * children: the category filter once collapsed to the 8px of its own padding
   * with its chips spilling out above it, sliced in half, and the cards were cut
   * off with no way to scroll to them. Behaviour checks all passed through it,
   * so these two assert the geometry instead.
   */
  const sheetLayout = await page.evaluate(
    (s) => {
      // Scoped to the sheet: the desktop column carries its own filter, hidden
      // at this width, and an unscoped query would measure that one at 0.
      const content = document.querySelector(s.content);
      const filter = content.querySelector(s.filter);

      const card = content.querySelector(s.card);

      return {
        filterHeight: filter.getBoundingClientRect().height,
        scrollable: content.scrollHeight - content.clientHeight,
        cardHeight: card.getBoundingClientRect().height,
        viewHeight: content.clientHeight,
      };
    },
    {
      content: sel('MobileProductsSheet', 'content'),
      filter: sel('CategoryFilter', 'root'),
      card: sel('ProductCard', 'root'),
    },
  );

  check(
    'the category filter is not squeezed by the rail',
    sheetLayout.filterHeight > 40,
    `filter is ${Math.round(sheetLayout.filterHeight)}px tall`,
  );
  /* The overlay's card is 355 tall and fits the panel outright, so there is
     normally nothing to scroll — what matters is that the whole of it is
     reachable one way or the other, which is what the squeezed layout broke. */
  check(
    'the whole card is reachable',
    sheetLayout.cardHeight <= sheetLayout.viewHeight || sheetLayout.scrollable > 0,
    `card ${Math.round(sheetLayout.cardHeight)}px in ${Math.round(sheetLayout.viewHeight)}px` +
      (sheetLayout.scrollable > 0 ? `, ${Math.round(sheetLayout.scrollable)}px of scroll` : ''),
  );

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

  const browser = await chromium.launch(chromiumLaunchOptions());

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
