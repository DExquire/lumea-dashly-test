import type { Announcement, Category, Product } from '@/types/content';
import { strapiFetch } from './client';
import { mapAnnouncement, mapCategory, mapProduct } from './mappers';
import type { StrapiAnnouncement, StrapiCategory, StrapiProduct, StrapiResponse } from './types';

export const CACHE_TAGS = {
  announcements: 'announcements',
  categories: 'categories',
  products: 'products',
} as const;

/**
 * The page renders every product of every category at once (the product rail is
 * filtered on the client), so one request per collection is enough — no
 * per-category waterfall to Strapi.
 */
const PRODUCT_POPULATE = {
  image: { fields: ['url', 'alternativeText', 'width', 'height'] },
  badges: true,
  variationGroups: { populate: { values: true } },
  categories: { fields: ['name'] },
} as const;

/**
 * Node reports a failed connection as a `TypeError: fetch failed` wrapping an
 * `AggregateError` (one entry per resolved address), so the thing worth knowing
 * — "nothing is listening" — is two levels down. Dig it out for the log line.
 */
function describeFailure(error: unknown): string {
  const seen = new Set<unknown>();

  const walk = (value: unknown): string | null => {
    if (!value || typeof value !== 'object' || seen.has(value)) {
      return null;
    }

    seen.add(value);

    const candidate = value as { code?: string; cause?: unknown; errors?: unknown[] };

    if (typeof candidate.code === 'string') {
      return candidate.code;
    }

    for (const nested of [candidate.cause, ...(candidate.errors ?? [])]) {
      const found = walk(nested);

      if (found) {
        return found;
      }
    }

    return null;
  };

  return walk(error) ?? (error instanceof Error ? error.message : String(error));
}

/**
 * Content failures must not take the whole page down: the CMS may be asleep on
 * free-tier hosting, and the task explicitly asks for a graceful empty state.
 *
 * One line per collection, not the raw error: a CMS that is simply not running
 * fails every request of every retry, and dumping each one buries whatever else
 * the dev server has to say under a screen of identical stack frames.
 */
async function withFallback<T>(label: string, load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.warn(
      `[strapi] ${label} unavailable (${describeFailure(error)}) — rendering without them`,
    );

    return fallback;
  }
}

export function getAnnouncements(): Promise<Announcement[]> {
  return withFallback(
    'announcements',
    async () => {
      const response = await strapiFetch<StrapiResponse<StrapiAnnouncement[]>>('/announcements', {
        params: {
          sort: ['sortOrder:asc', 'createdAt:asc'],
          fields: ['message', 'sortOrder'],
          pagination: { pageSize: 50 },
        },
        tags: [CACHE_TAGS.announcements],
      });

      return response.data.flatMap((item) => mapAnnouncement(item) ?? []);
    },
    [],
  );
}

export function getCategories(): Promise<Category[]> {
  return withFallback(
    'categories',
    async () => {
      const response = await strapiFetch<StrapiResponse<StrapiCategory[]>>('/categories', {
        params: {
          sort: ['sortOrder:asc', 'createdAt:asc'],
          fields: ['name', 'sortOrder'],
          pagination: { pageSize: 50 },
        },
        tags: [CACHE_TAGS.categories],
      });

      return response.data.flatMap((item) => mapCategory(item) ?? []);
    },
    [],
  );
}

export function getProducts(): Promise<Product[]> {
  return withFallback(
    'products',
    async () => {
      const response = await strapiFetch<StrapiResponse<StrapiProduct[]>>('/products', {
        params: {
          sort: ['sortOrder:asc', 'createdAt:asc'],
          populate: PRODUCT_POPULATE,
          pagination: { pageSize: 100 },
        },
        tags: [CACHE_TAGS.products],
      });

      return response.data.flatMap((item) => mapProduct(item) ?? []);
    },
    [],
  );
}

export interface HomePageContent {
  announcements: Announcement[];
  categories: Category[];
  products: Product[];
}

export async function getHomePageContent(): Promise<HomePageContent> {
  const [announcements, categories, products] = await Promise.all([
    getAnnouncements(),
    getCategories(),
    getProducts(),
  ]);

  return { announcements, categories, products };
}
