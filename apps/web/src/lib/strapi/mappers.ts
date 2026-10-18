import { resolvePricing } from '@/lib/pricing';
import type {
  Announcement,
  BadgeTone,
  Category,
  MediaAsset,
  Product,
  ProductBadge,
  VariationGroup,
} from '@/types/content';
import { toAbsoluteMediaUrl } from './client';
import type {
  StrapiAnnouncement,
  StrapiBadgeComponent,
  StrapiCategory,
  StrapiMedia,
  StrapiProduct,
  StrapiVariationGroupComponent,
} from './types';

const BADGE_TONES = new Set<BadgeTone>(['sale', 'new', 'bestseller', 'neutral']);

function isBadgeTone(value: string | null): value is BadgeTone {
  return value !== null && BADGE_TONES.has(value as BadgeTone);
}

function trimmed(value: string | null | undefined): string | null {
  const result = value?.trim();

  return result ? result : null;
}

function mapMedia(media: StrapiMedia | null | undefined, fallbackAlt: string): MediaAsset | null {
  if (!media?.url) {
    return null;
  }

  return {
    url: toAbsoluteMediaUrl(media.url),
    // Product images carry meaning, so they need a real alt. The CMS value wins,
    // the product title is the fallback.
    alt: trimmed(media.alternativeText) ?? fallbackAlt,
    width: media.width,
    height: media.height,
  };
}

function mapBadges(badges: StrapiBadgeComponent[] | null | undefined): ProductBadge[] {
  return (badges ?? []).flatMap((badge) => {
    const label = trimmed(badge.label);

    if (!label) {
      return [];
    }

    return [
      {
        id: String(badge.id),
        label,
        tone: isBadgeTone(badge.tone) ? badge.tone : 'neutral',
      },
    ];
  });
}

/**
 * A decimal field arrives as a string over the REST API, and a value outside
 * 0..100 is an editing slip rather than a discount — treat it as none.
 */
function percent(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 100) {
    return null;
  }

  return Math.round(parsed);
}

function mapVariationGroups(
  groups: StrapiVariationGroupComponent[] | null | undefined,
): VariationGroup[] {
  return (groups ?? []).flatMap((group) => {
    // The colon after a group label is drawn by the stylesheet, so an editor who
    // types "Size:" gets one colon rather than two.
    const name = trimmed(group.name)?.replace(/:$/, '').trimEnd() ?? null;
    const options = (group.values ?? []).flatMap((value) => {
      const label = trimmed(value.label);

      if (!label) {
        return [];
      }

      const discountPercent = percent(value.discountPercent);

      return [
        {
          id: String(value.id),
          label,
          discountPercent,
          /**
           * The badge text. An editor who typed one wins — the design spells
           * its two badges differently, "-10 %" with a space and "-20%"
           * without, and that is not something a formatter should flatten.
           * Left empty, it is derived from the number, so nobody has to type
           * the same discount twice.
           */
          discount:
            trimmed(value.discountLabel) ??
            (discountPercent !== null ? `-${discountPercent}%` : null),
        },
      ];
    });

    // A group without a name or without options would render as an empty row.
    if (!name || options.length === 0) {
      return [];
    }

    return [{ id: String(group.id), name, options }];
  });
}

export function mapCategory(raw: StrapiCategory): Category | null {
  const name = trimmed(raw.name);

  return name ? { id: raw.documentId, name } : null;
}

export function mapProduct(raw: StrapiProduct): Product | null {
  const title = trimmed(raw.title);

  if (!title) {
    return null;
  }

  return {
    id: raw.documentId,
    title,
    volume: trimmed(raw.volume),
    image: mapMedia(raw.image, title),
    pricing: resolvePricing({
      price: raw.price,
      salePrice: raw.salePrice,
      discountPercent: raw.discountPercent,
    }),
    badges: mapBadges(raw.badges),
    variationGroups: mapVariationGroups(raw.variationGroups),
    categoryIds: (raw.categories ?? []).map((category) => category.documentId),
  };
}

export function mapAnnouncement(raw: StrapiAnnouncement): Announcement | null {
  const message = trimmed(raw.message);

  return message ? { id: raw.documentId, message } : null;
}
