import qs from 'qs';
import { env } from '@/lib/env';

const REQUEST_TIMEOUT_MS = 20_000;
const RETRY_DELAYS_MS = [1_000, 3_000];

export class StrapiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'StrapiRequestError';
  }
}

interface StrapiFetchOptions {
  /** Strapi query params (`populate`, `filters`, `sort`, `pagination`, ...). */
  params?: Record<string, unknown>;
  /** Overrides the default ISR window. */
  revalidate?: number;
  /** Cache tags, so a webhook can revalidate exactly this data. */
  tags?: string[];
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const query = params ? qs.stringify(params, { encodeValuesOnly: true }) : '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${env.strapiUrl}/api${normalizedPath}${query ? `?${query}` : ''}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Thin fetch wrapper around the Strapi REST API.
 *
 * Retries on network errors and 5xx responses: free-tier hosting (Render) puts
 * the CMS to sleep, and the first request after that can take several seconds
 * or fail outright.
 */
export async function strapiFetch<T>(path: string, options: StrapiFetchOptions = {}): Promise<T> {
  const url = buildUrl(path, options.params);
  const headers: HeadersInit = { Accept: 'application/json' };

  if (env.strapiApiToken) {
    headers.Authorization = `Bearer ${env.strapiApiToken}`;
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        next: {
          revalidate: options.revalidate ?? env.revalidateSeconds,
          ...(options.tags ? { tags: options.tags } : {}),
        },
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      const error = new StrapiRequestError(
        `Strapi responded with ${response.status} for ${path}`,
        response.status,
      );

      // 4xx means the request itself is wrong — retrying cannot help.
      if (response.status < 500) {
        throw error;
      }

      lastError = error;
    } catch (error) {
      if (error instanceof StrapiRequestError && error.status && error.status < 500) {
        throw error;
      }

      lastError = error;
    }

    const nextDelay = RETRY_DELAYS_MS[attempt];

    if (nextDelay !== undefined) {
      await delay(nextDelay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new StrapiRequestError(`Strapi request failed for ${path}`);
}

/** Turns a relative Strapi media path into an absolute URL. */
export function toAbsoluteMediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${env.strapiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}
