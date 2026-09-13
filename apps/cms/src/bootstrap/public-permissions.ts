import type { Core } from '@strapi/strapi';

/**
 * Read-only endpoints the frontend needs. Granting them in `bootstrap` means a
 * fresh clone works right after `npm run develop` — no manual clicking through
 * Settings → Roles → Public.
 */
const PUBLIC_READ_ACTIONS = [
  'api::announcement.announcement.find',
  'api::announcement.announcement.findOne',
  'api::category.category.find',
  'api::category.category.findOne',
  'api::product.product.find',
  'api::product.product.findOne',
] as const;

export async function grantPublicReadAccess(strapi: Core.Strapi): Promise<void> {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' }, select: ['id'] });

  if (!publicRole) {
    strapi.log.warn('[bootstrap] public role not found, skipping permission setup');

    return;
  }

  const existing = await strapi.db.query('plugin::users-permissions.permission').findMany({
    where: { role: publicRole.id, action: { $in: [...PUBLIC_READ_ACTIONS] } },
    select: ['action'],
  });

  const existingActions = new Set(existing.map((permission: { action: string }) => permission.action));
  const missing = PUBLIC_READ_ACTIONS.filter((action) => !existingActions.has(action));

  if (missing.length === 0) {
    return;
  }

  await Promise.all(
    missing.map((action) =>
      strapi.db
        .query('plugin::users-permissions.permission')
        .create({ data: { action, role: publicRole.id } }),
    ),
  );

  strapi.log.info(`[bootstrap] granted public read access to: ${missing.join(', ')}`);
}
