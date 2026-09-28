import type { SVGProps } from 'react';

/**
 * Icons exported from the Figma file as SVG paths, with the hardcoded colours
 * swapped for `currentColor` so hover states are pure CSS.
 *
 * They are inline components rather than files in `public/`: no extra requests,
 * and they inherit colour and size from their context.
 */

type IconProps = SVGProps<SVGSVGElement>;

export function SearchIcon(props: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M7.92 15.48C12.0953 15.48 15.48 12.0953 15.48 7.92C15.48 3.74473 12.0953 0.36 7.92 0.36C3.74473 0.36 0.36 3.74473 0.36 7.92C0.36 12.0953 3.74473 15.48 7.92 15.48Z"
        stroke="currentColor"
        strokeWidth="0.6875"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.2653 13.2658L17.6393 17.6398"
        stroke="currentColor"
        strokeWidth="0.72"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg
      width="18"
      height="16"
      viewBox="0 0 18 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M9 15.5769C9 15.5769 0.346154 10.7308 0.346154 4.84616C0.34633 3.80608 0.706719 2.79817 1.36605 1.99378C2.02538 1.18939 2.94295 0.638179 3.96276 0.43386C4.98257 0.229541 6.04167 0.384728 6.95999 0.873035C7.87831 1.36134 8.59917 2.15263 9.00001 3.11236L8.99999 3.11237C9.40083 2.15264 10.1217 1.36135 11.04 0.873039C11.9583 0.38473 13.0174 0.229542 14.0372 0.43386C15.057 0.638178 15.9746 1.18939 16.634 1.99378C17.2933 2.79817 17.6537 3.80608 17.6538 4.84616C17.6538 10.7308 9 15.5769 9 15.5769Z"
        stroke="currentColor"
        strokeWidth="0.6875"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 20 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M16.2692 14.1923H5.58128C5.41915 14.1923 5.26216 14.1354 5.13768 14.0315C5.01321 13.9276 4.92914 13.7834 4.90014 13.6238L2.58937 0.914618C2.56037 0.755103 2.4763 0.610826 2.35182 0.506941C2.22735 0.403056 2.07036 0.346154 1.90823 0.346154H0.346154"
        stroke="currentColor"
        strokeWidth="0.692308"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.88462 17.6538C6.84049 17.6538 7.61538 16.879 7.61538 15.9231C7.61538 14.9672 6.84049 14.1923 5.88462 14.1923C4.92874 14.1923 4.15385 14.9672 4.15385 15.9231C4.15385 16.879 4.92874 17.6538 5.88462 17.6538Z"
        stroke="currentColor"
        strokeWidth="0.6875"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.2692 17.6538C17.2251 17.6538 18 16.879 18 15.9231C18 14.9672 17.2251 14.1923 16.2692 14.1923C15.3134 14.1923 14.5385 14.9672 14.5385 15.9231C14.5385 16.879 15.3134 17.6538 16.2692 17.6538Z"
        stroke="currentColor"
        strokeWidth="0.6875"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.11538 3.80769H18.2089C18.3103 3.80769 18.4105 3.82997 18.5023 3.87294C18.5942 3.91592 18.6755 3.97855 18.7405 4.0564C18.8054 4.13426 18.8525 4.22543 18.8784 4.32349C18.9042 4.42154 18.9082 4.52408 18.8901 4.62384L17.7572 10.8546C17.7282 11.0141 17.6441 11.1584 17.5197 11.2623C17.3952 11.3662 17.2382 11.4231 17.0761 11.4231H4.5"
        stroke="currentColor"
        strokeWidth="0.692308"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * `strokeWidth` is 0.9, not the 0.6875 this carried before.
 *
 * 0.6875 is what you get by taking a 1px stroke drawn on a 32px icon down to
 * 22, and at 22px it lands under a whole pixel: the diagonal renders as a chain
 * of light dots rather than a line. Measured against the design's export — the
 * ink over the arrow's box in step 01's "Shop cleansers" — ours came to 77% of
 * the design's weight; 0.875 gives 98% and 0.9375 overshoots to 104%, so 0.9 is
 * the match. The straight strokes agree: the design's horizontal bar and right
 * upright cover 0.78 and 0.76 of a pixel against our 0.68.
 */
export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M5.5 16.5L16.5 5.5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5625 5.5H16.5V14.4375"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 27 27"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M14.0514 21.3437L20.3565 25.3383C21.1624 25.8489 22.1631 25.0895 21.9239 24.1487L20.1023 16.9827C20.051 16.7831 20.057 16.5731 20.1198 16.3768C20.1825 16.1805 20.2994 16.0059 20.457 15.8731L26.111 11.1672C26.8539 10.5489 26.4704 9.31595 25.5159 9.254L18.1322 8.77479C17.9333 8.76059 17.7426 8.69017 17.5822 8.57175C17.4218 8.45333 17.2983 8.29178 17.2261 8.1059L14.4723 1.17109C14.3975 0.9738 14.2644 0.80395 14.0907 0.684095C13.917 0.564239 13.711 0.50005 13.5 0.50005C13.289 0.50005 13.083 0.564239 12.9093 0.684095C12.7356 0.80395 12.6025 0.9738 12.5277 1.17109L9.77386 8.1059C9.70171 8.29178 9.57824 8.45333 9.41783 8.57175C9.25741 8.69017 9.06666 8.76059 8.86778 8.77479L1.48406 9.254C0.52958 9.31595 0.146134 10.5489 0.889043 11.1672L6.54302 15.8731C6.70058 16.0059 6.81746 16.1805 6.88022 16.3768C6.94297 16.5731 6.94905 16.7831 6.89775 16.9827L5.20835 23.6284C4.92137 24.7573 6.12214 25.6686 7.08927 25.0559L12.9486 21.3437C13.1134 21.2388 13.3047 21.1831 13.5 21.1831C13.6954 21.1831 13.8866 21.2388 14.0514 21.3437V21.3437Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg
      width="22"
      height="14"
      viewBox="0 0 22 14"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M1 1H21M1 7H21M1 13H21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
