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

function mapVariationGroups(
  groups: StrapiVariationGroupComponent[] | null | undefined,
): VariationGroup[] {
  return (groups ?? []).flatMap((group) => {
    const name = trimmed(group.name);
    const options = (group.values ?? []).flatMap((value) => {
      const label = trimmed(value.label);

      return label ? [{ id: String(value.id), label }] : [];
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
