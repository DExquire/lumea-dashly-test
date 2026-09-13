/**
 * Single place where environment variables are read and validated, so the rest
 * of the app never touches `process.env` directly.
 */

const DEFAULT_STRAPI_URL = 'http://localhost:1337';
const DEFAULT_SITE_URL = 'http://localhost:3000';
const DEFAULT_REVALIDATE_SECONDS = 60;

function normalizeUrl(value: string | undefined, fallback: string): string {
  const candidate = (value ?? '').trim() || fallback;

  return candidate.replace(/\/+$/, '');
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export const env = {
  /** Base URL of the Strapi instance, without a trailing slash. */
  strapiUrl: normalizeUrl(process.env.NEXT_PUBLIC_STRAPI_URL, DEFAULT_STRAPI_URL),

  /** Optional read-only API token, for a Strapi instance with private endpoints. */
  strapiApiToken: process.env.STRAPI_API_TOKEN?.trim() || undefined,

  /** Canonical site URL, used for `metadataBase` and Open Graph tags. */
  siteUrl: normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL, DEFAULT_SITE_URL),

  /** How long CMS responses stay cached before Next re-fetches them. */
  revalidateSeconds: toPositiveInt(
    process.env.NEXT_PUBLIC_REVALIDATE_SECONDS,
    DEFAULT_REVALIDATE_SECONDS,
  ),
} as const;
