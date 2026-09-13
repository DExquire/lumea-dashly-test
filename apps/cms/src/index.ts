import type { Core } from '@strapi/strapi';
import { grantPublicReadAccess } from './bootstrap/public-permissions';
import { seedDemoContent } from './bootstrap/seed';

export default {
  /**
   * Runs before the application is initialized.
   */
  register() {},

  /**
   * Runs before the application starts serving requests: opens the read-only
   * endpoints the frontend needs and fills an empty database with demo content.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicReadAccess(strapi);

    try {
      await seedDemoContent(strapi);
    } catch (error) {
      strapi.log.error('[seed] failed to create demo content');
      strapi.log.error(error);
    }
  },
};
