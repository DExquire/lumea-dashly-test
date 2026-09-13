'use client';

import { AnnouncementBar } from '@/components/layout/AnnouncementBar/AnnouncementBar';
import { CartIcon, HeartIcon, MenuIcon, SearchIcon } from '@/components/ui/icons';
import type { Announcement } from '@/types/content';
import styles from './Header.module.scss';

interface HeaderProps {
  announcements: Announcement[];
}

/**
 * Navigation items. The task does not include the other pages, so these stay
 * in-page anchors rather than pretending to link somewhere that doesn't exist —
 * they are still real links with real hover states.
 */
const NAV_ITEMS = [
  { label: 'Shop', href: '#how-it-works' },
  { label: 'Skincare', href: '#how-it-works' },
  { label: 'Sets', href: '#how-it-works' },
  { label: 'About', href: '#how-it-works' },
];

const CART_COUNT = 2;

export function Header({ announcements }: HeaderProps) {
  const scrollToTop = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <header className={styles.root} role="banner">
      <AnnouncementBar announcements={announcements} />

      <div className={styles.bar}>
        <a className={styles.logo} href="#top" onClick={scrollToTop}>
          LUMEA
        </a>

        <nav className={styles.nav} aria-label="Main navigation">
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <a className={styles.navLink} href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <button type="button" className={`${styles.iconButton} ${styles.menuButton}`} aria-label="Open menu">
            <MenuIcon />
          </button>

          <button type="button" className={`${styles.iconButton} ${styles.searchButton}`} aria-label="Search">
            <SearchIcon />
          </button>

          <button type="button" className={styles.iconButton} aria-label="Saved items">
            <HeartIcon />
          </button>

          <button type="button" className={styles.iconButton} aria-label={`Cart, ${CART_COUNT} items`}>
            <CartIcon />
            <span className={styles.cartCount} aria-hidden="true">
              {CART_COUNT}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
