/**
 * <img> attributes for an Img (works in Astro and React islands — no build-time imports).
 * `sizes` tells the browser how wide the image is drawn so it can pick the right srcset file.
 */
import { MOBILE_MAX } from './breakpoints';
import type { Img } from './types';

const PHONE = `(max-width: ${MOBILE_MAX}px)`;

/** Layout-based `sizes` presets used across the site. */
export const SIZES = {
  full: '100vw',
  /** wide content image inside the page gutter */
  content: '(max-width: 1400px) 92vw, 1320px',
  /** two columns on desktop */
  half: `${PHONE} 92vw, 46vw`,
  /** three columns on desktop (auto-fill cards never grow past ~440px) */
  third: `${PHONE} 92vw, (max-width: 1100px) 46vw, 440px`,
  /** four columns on desktop, two on phones */
  quarter: `${PHONE} 46vw, (max-width: 1100px) 31vw, 24vw`,
  /** hero photo wall tiles (3 cols on phones, 5 on desktop) */
  mosaic: `${PHONE} 34vw, 20vw`,
  /** horizontal event cards */
  card: `${PHONE} 80vw, 42vw`,
  /** filmstrip thumbnails */
  thumb: '300px',
} as const;

type Attrs = { src: string; srcset?: string; sizes?: string; width?: number; height?: number };

/** For .astro templates (lower-case `srcset`). */
export function imgAttrs(image: Img, sizes: string): Attrs {
  return { src: image.src, srcset: image.srcset, sizes: image.srcset ? sizes : undefined, width: image.width, height: image.height };
}

/** For React islands (`srcSet`). */
export function imgProps(image: Img, sizes: string): Omit<Attrs, 'srcset'> & { srcSet?: string } {
  return { src: image.src, srcSet: image.srcset, sizes: image.srcset ? sizes : undefined, width: image.width, height: image.height };
}
