/**
 * Raw Strapi 5 payload shapes. Strapi 5 returns flat entities (no `attributes`
 * wrapper), with `documentId` as the stable public identifier.
 */

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiImageFormat {
  url: string;
  width: number;
  height: number;
}

export interface StrapiMedia {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  formats: Record<string, StrapiImageFormat> | null;
}

export interface StrapiEntity {
  id: number;
  documentId: string;
}

export interface StrapiBadgeComponent {
  id: number;
  label: string | null;
  tone: string | null;
}

export interface StrapiVariationValueComponent {
  id: number;
  label: string | null;
  discountLabel?: string | null;
}

export interface StrapiVariationGroupComponent {
  id: number;
  name: string | null;
  values: StrapiVariationValueComponent[] | null;
}

export interface StrapiCategory extends StrapiEntity {
  name: string | null;
  sortOrder: number | null;
}

export interface StrapiProduct extends StrapiEntity {
  title: string | null;
  volume: string | null;
  price: number | string | null;
  salePrice: number | string | null;
  discountPercent: number | string | null;
  sortOrder: number | null;
  image: StrapiMedia | null;
  badges: StrapiBadgeComponent[] | null;
  variationGroups: StrapiVariationGroupComponent[] | null;
  categories: StrapiCategory[] | null;
}

export interface StrapiAnnouncement extends StrapiEntity {
  message: string | null;
  sortOrder: number | null;
}
