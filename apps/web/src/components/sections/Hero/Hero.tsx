import Image from 'next/image';
import { Header } from '@/components/layout/Header/Header';
import { Button } from '@/components/ui/Button/Button';
import type { Announcement } from '@/types/content';
import styles from './Hero.module.scss';

interface HeroProps {
  announcements: Announcement[];
}

/**
 * Hero section.
 *
 * Everything here is static by design — per the task, only the announcement bar
 * is driven by the CMS. The decorative colour washes are CSS gradients rather
 * than exported images, so they scale to any viewport without extra requests.
 */
export function Hero({ announcements }: HeroProps) {
  return (
    <section className={styles.root} id="top" aria-labelledby="hero-title">
      <div className={styles.glow} aria-hidden="true" />

      <Header announcements={announcements} />

      <div className={styles.inner}>
        <div className={styles.copy}>
          <h1 className={styles.title} id="hero-title">
            Skincare made <span className={styles.titleAccent}>simple</span>
          </h1>

          <p className={styles.subtitle}>Thoughtful formulas for healthy, glowing skin</p>

          <div className={styles.ctaGroup}>
            <p className={styles.kicker}>Not sure what your skin needs?</p>
            <Button href="#how-it-works" size="lg">
              Find your routine
            </Button>
          </div>
        </div>

        <div className={styles.visuals}>
          <figure className={styles.portrait}>
            <Image
              className={styles.portraitImage}
              src="/images/hero-portrait.webp"
              alt="Woman with wet hair after cleansing her face"
              fill
              sizes="(min-width: 1024px) 562px, 100vw"
              priority
            />
          </figure>

          {/* Decorative close-up: hidden from screen readers, no alt noise. */}
          <figure className={styles.detail} aria-hidden="true">
            <Image
              className={styles.detailImage}
              src="/images/hero-detail.webp"
              alt=""
              fill
              sizes="220px"
            />
          </figure>

          <article className={styles.essentials}>
            <div className={styles.essentialsMedia}>
              <Image
                src="/images/hero-product.webp"
                alt="LUMEA essentials serum bottle"
                fill
                sizes="127px"
                className={styles.essentialsImage}
              />
            </div>

            <p className={styles.essentialsTitle}>LUMEA essentials</p>
            <p className={styles.essentialsText}>
              Simple formulas. Thoughtful ingredients. Everyday results.
            </p>

            <Button href="#how-it-works" variant="secondary">
              Shop now
            </Button>
          </article>
        </div>

        <p className={styles.trust}>Dermatologist-inspired care</p>
      </div>
    </section>
  );
}
