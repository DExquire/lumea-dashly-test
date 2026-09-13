import type { RoutineStep } from '@/types/content';

/**
 * The four "How it works" step cards.
 *
 * Per the task these belong to the page design, not to the CMS — but they are
 * still data: the section renders whatever this array contains, so the order or
 * wording can change in one place without touching a component.
 */
export const routineSteps: RoutineStep[] = [
  {
    id: 'cleanse',
    number: '01',
    numeral: 1,
    title: 'Cleanse',
    tagline: 'Start with a fresh canvas.',
    description: 'Gently remove makeup, SPF and daily impurities without stripping your skin.',
    ctaLabel: 'Shop cleansers',
    tone: 'neutral',
    image: {
      src: '/images/step-cleanse.webp',
      alt: 'Cleansing gel poured onto a cotton pad',
      ratio: 320 / 213,
      align: 'start',
    },
  },
  {
    id: 'treat',
    number: '02',
    numeral: 2,
    title: 'Treat',
    tagline: 'Target what your skin needs.',
    description:
      'Serums and treatments deliver targeted ingredients to help with dryness, dullness, texture and blemishes.',
    ctaLabel: 'Shop treatments',
    tone: 'mint',
    image: {
      src: '/images/step-treat.webp',
      alt: 'Treatment applied to the face with a cotton pad',
      ratio: 388 / 160,
      align: 'end',
    },
  },
  {
    id: 'moisturise',
    number: '03',
    numeral: 3,
    title: 'Moisturise',
    tagline: 'Lock in lasting hydration.',
    description:
      'Moisturisers help strengthen the skin barrier, lock in hydration and leave skin soft and balanced.',
    ctaLabel: 'Shop moisturisers',
    tone: 'neutral',
    image: {
      src: '/images/step-moisturise.webp',
      alt: 'Woman applying moisturiser after a shower',
      ratio: 300 / 156,
      align: 'end',
    },
  },
  {
    id: 'protect',
    number: '04',
    numeral: 4,
    title: 'Protect',
    tagline: 'Your essential final step.',
    description:
      'Daily SPF helps protect your skin from UV damage and keeps it looking healthy every day.',
    ctaLabel: 'Shop SPF',
    tone: 'blush',
    image: {
      src: '/images/step-protect.webp',
      alt: 'Sunscreen being smoothed onto the forehead',
      ratio: 391 / 194,
      align: 'start',
    },
  },
];
