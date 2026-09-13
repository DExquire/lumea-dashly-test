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
 * Content failures must not take the whole page down: the CMS may be asleep on
 * free-tier hosting, and the task explicitly asks for a graceful empty state.
 */
async function withFallback<T>(label: string, load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.error(`[strapi] failed to load ${label}:`, error);

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
