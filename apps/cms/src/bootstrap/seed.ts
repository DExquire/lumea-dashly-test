import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';
import {
  seedAnnouncements,
  seedCategories,
  seedProducts,
  type SeedProduct,
} from '../../data/seed/content';

/** Resolved from the project root, so it works for both `src` and the build output. */
const SEED_IMAGES_DIR = path.join(process.cwd(), 'data', 'seed', 'images');

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

async function uploadSeedImage(strapi: Core.Strapi, fileName: string): Promise<number | null> {
  const filePath = path.join(SEED_IMAGES_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    strapi.log.warn(`[seed] image not found, product will render without one: ${fileName}`);

    return null;
  }

  const stats = fs.statSync(filePath);
  const extension = path.extname(fileName).toLowerCase();

  const [uploaded] = await strapi.plugin('upload').service('upload').upload({
    data: {},
    files: {
      filepath: filePath,
      originalFileName: fileName,
      originalFilename: fileName,
      mimetype: MIME_TYPES[extension] ?? 'application/octet-stream',
      size: stats.size,
    },
  });

  return uploaded?.id ?? null;
}

function buildProductData(
  product: SeedProduct,
  categoryIds: Record<string, string>,
  imageId: number | null,
) {
  // Optional fields are omitted rather than set to `null`: an empty field in
  // Strapi means "not filled in", which is exactly what the frontend fallbacks
  // are built around.
  return {
    title: product.title,
    price: product.price,
    sortOrder: product.sortOrder,
    ...(product.volume ? { volume: product.volume } : {}),
    ...(product.salePrice !== undefined ? { salePrice: product.salePrice } : {}),
    ...(product.discountPercent !== undefined
      ? { discountPercent: product.discountPercent }
      : {}),
    badges: (product.badges ?? []).map((badge) => ({ label: badge.label, tone: badge.tone })),
    variationGroups: (product.variationGroups ?? []).map((group) => ({
      name: group.name,
      // A value is written in the seed either as a plain label or as an object
      // carrying the chip's tilted discount badge.
      values: group.values.map((value) =>
        typeof value === 'string'
          ? { label: value }
          : {
              label: value.label,
              ...(value.discountLabel ? { discountLabel: value.discountLabel } : {}),
            },
      ),
    })),
    categories: product.categoryKeys
      .map((key) => categoryIds[key])
      .filter((id): id is string => Boolean(id)),
    ...(imageId ? { image: imageId } : {}),
  };
}

/**
 * Fills an empty database with demo content. Runs only when there is nothing to
 * show yet (or when `SEED_FORCE=true`), so editor changes are never overwritten
 * on restart.
 */
export async function seedDemoContent(strapi: Core.Strapi): Promise<void> {
  const force = process.env.SEED_FORCE === 'true';
  const existingProducts = await strapi.documents('api::product.product').count({});

  if (existingProducts > 0 && !force) {
    return;
  }

  if (force) {
    strapi.log.info('[seed] SEED_FORCE=true — replacing the demo content');

    for (const uid of [
      'api::product.product',
      'api::category.category',
      'api::announcement.announcement',
    ] as const) {
      const existing = await strapi.documents(uid).findMany({ fields: ['id'] });

      await Promise.all(
        existing.map((entry) => strapi.documents(uid).delete({ documentId: entry.documentId })),
      );
    }
  } else {
    strapi.log.info('[seed] empty database detected — creating demo content');
  }

  const existingAnnouncements = await strapi.documents('api::announcement.announcement').count({});

  if (existingAnnouncements === 0) {
    await Promise.all(
      seedAnnouncements.map((announcement) =>
        strapi.documents('api::announcement.announcement').create({ data: announcement }),
      ),
    );
  }

  const categoryIds: Record<string, string> = {};

  for (const category of seedCategories) {
    const existing = await strapi
      .documents('api::category.category')
      .findFirst({ filters: { name: category.name } });

    const record =
      existing ??
      (await strapi.documents('api::category.category').create({
        data: { name: category.name, sortOrder: category.sortOrder },
      }));

    categoryIds[category.key] = record.documentId;
  }

  for (const product of seedProducts) {
    const imageId = product.image ? await uploadSeedImage(strapi, product.image) : null;

    await strapi.documents('api::product.product').create({
      data: buildProductData(product, categoryIds, imageId),
    });
  }

  strapi.log.info(
    `[seed] created ${seedCategories.length} categories, ${seedProducts.length} products, ${seedAnnouncements.length} announcements`,
  );
}
