import { existsSync } from 'node:fs';

/**
 * Where to find a browser for the checks.
 *
 * Playwright keeps its own Chromium in a cache directory, and that cache is a
 * normal casualty of clearing space on a laptop — after which every check fails
 * with "Executable doesn't exist" and the only advice on offer is to download
 * a fresh ~150MB copy. Any Chrome or Chromium already on the machine runs these
 * scripts just as well, so look for one before asking for a download.
 *
 * `CHROMIUM_PATH` still wins, for CI images that ship their own build.
 */
const CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/opt/pw-browsers/chromium',
];

/** Launch options for `chromium.launch()`, empty when Playwright's own copy is used. */
export function chromiumLaunchOptions() {
  const configured = process.env.CHROMIUM_PATH;

  if (configured) {
    return { executablePath: configured };
  }

  const found = CANDIDATES.find((candidate) => existsSync(candidate));

  return found ? { executablePath: found } : {};
}
