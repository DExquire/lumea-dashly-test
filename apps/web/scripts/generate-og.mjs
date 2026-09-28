/**
 * Renders `public/og-image.jpg` (1200×630) from the live hero section, so the
 * Open Graph preview always matches the actual page instead of being a stale
 * hand-made asset.
 *
 * Usage: node scripts/generate-og.mjs [http://localhost:3000]
 */

import path from 'node:path';
import { chromium } from 'playwright';
import { chromiumLaunchOptions } from './find-chromium.mjs';

const url = process.argv[2] ?? 'http://localhost:3000';
const output = path.join(process.cwd(), 'public', 'og-image.jpg');

const browser = await chromium.launch(
  chromiumLaunchOptions(),
);

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // The dev server injects its own overlay badge; it must not end up baked into
  // a shipped asset when the image is regenerated against `next dev`.
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.waitForTimeout(400);

  // JPEG keeps the file well under the 300 KB that scrapers are happy to
  // fetch; the hero is photographic, so there is nothing for PNG to gain.
  await page.screenshot({ path: output, type: 'jpeg', quality: 88 });

  console.log(`Wrote ${output}`);
} finally {
  await browser.close();
}
