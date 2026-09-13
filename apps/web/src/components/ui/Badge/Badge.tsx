import type { BadgeTone } from '@/types/content';
import styles from './Badge.module.scss';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return <span className={`${styles.root} ${styles[tone]}`}>{label}</span>;
}
