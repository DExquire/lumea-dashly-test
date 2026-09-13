import { Hero } from '@/components/sections/Hero/Hero';
import { HowItWorks } from '@/components/sections/HowItWorks/HowItWorks';
import { routineSteps } from '@/content/routine-steps';
import { getHomePageContent } from '@/lib/strapi/queries';
import styles from './page.module.scss';

/**
 * Home page.
 *
 * Content is fetched on the server — one request per collection, no per-category
 * waterfall — so the products are in the initial HTML (good for SEO) and the
 * layout never shifts while they load.
 */
export default async function HomePage() {
  const { announcements, categories, products } = await getHomePageContent();

  return (
    <>
      <a className={styles.skipLink} href="#how-it-works">
        Skip to content
      </a>

      <main className={styles.main}>
        <Hero announcements={announcements} />
        <HowItWorks steps={routineSteps} products={products} categories={categories} />
      </main>
    </>
  );
}
