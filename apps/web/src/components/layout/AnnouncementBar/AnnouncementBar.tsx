'use client';

import { useState } from 'react';
import { useRotatingIndex } from '@/hooks/useRotatingIndex';
import type { Announcement } from '@/types/content';
import styles from './AnnouncementBar.module.scss';

interface AnnouncementBarProps {
  announcements: Announcement[];
  /** How long each message stays visible. */
  intervalMs?: number;
}

/**
 * The only part of the hero managed through Strapi: messages are added, edited,
 * removed and reordered in the CMS.
 *
 * All messages stay in the DOM stacked in a single grid cell, so the bar is as
 * tall as its tallest message from the first paint — switching messages can
 * never change the header height or shift the layout. When the CMS has no
 * messages the bar is not rendered at all.
 */
export function AnnouncementBar({ announcements, intervalMs }: AnnouncementBarProps) {
  const [isPaused, setIsPaused] = useState(false);
  const activeIndex = useRotatingIndex({
    length: announcements.length,
    paused: isPaused,
    ...(intervalMs ? { intervalMs } : {}),
  });

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.root}
      // Pausing on hover / keyboard focus gives people time to read a message
      // (and to copy a promo code) instead of losing it mid-sentence.
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <ul className={styles.viewport} aria-label="Announcements">
        {announcements.map((announcement, index) => (
          <li
            key={announcement.id}
            className={styles.message}
            data-active={index === activeIndex ? '' : undefined}
          >
            {announcement.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
