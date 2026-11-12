/**
 * Responsive images.
 *
 * Content refers to bundled photos by their public-style path (e.g. "/assets/img/01-opening/x.jpg").
 * The files live in src/assets/img, so at build time Astro's image service turns each one into
 * WebP versions at several widths; components then render `srcset` + `sizes` and the browser
 * downloads the smallest file that is still sharp on that screen.
 *
 * Only import this from Astro code (it uses `astro:assets`); React islands receive the results as props.
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { Img } from './types';

/** Candidate widths for srcset. Each image only gets the ones up to its natural / requested width. */
export const WIDTHS = [400, 640, 960, 1280, 1600, 2000, 2400] as const;
const QUALITY = 72;
/** Full-screen images (hero photos, requested ≥ 1170px wide) use lighter compression: artefacts show most there. */
export const LARGE_MIN_WIDTH = 1170;
const LARGE_QUALITY = 82;
export const qualityFor = (requestedWidth?: number) => ((requestedWidth ?? 0) >= LARGE_MIN_WIDTH ? LARGE_QUALITY : QUALITY);
const LOCAL_PREFIX = '/assets/img/';

const files = import.meta.glob<ImageMetadata>('/src/assets/img/**/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });

/** srcset widths for an image `natural` px wide that will never be shown wider than `max` px. */
export function widthsFor(natural: number, max: number): number[] {
  const cap = Math.min(natural, max);
  return [...new Set([...WIDTHS.filter((w) => w < cap), cap])];
}

const isLocal = (v: unknown): v is Img => !!v && typeof v === 'object' && typeof (v as Img).src === 'string' && (v as Img).src.startsWith(LOCAL_PREFIX);

async function optimise(image: Img): Promise<void> {
  const meta = files[`/src${image.src}`];
  if (!meta) {
    console.warn(`[images] not found in src/assets/img: ${image.src}`);
    return;
  }
  const widths = widthsFor(meta.width, image.w ?? 2400);
  const out = await getImage({ src: meta, widths, format: 'webp', quality: qualityFor(image.w) });
  const largest = widths[widths.length - 1];
  image.src = out.src;
  image.srcset = out.srcSet.attribute;
  image.width = largest;
  image.height = Math.round((meta.height / meta.width) * largest);
}

/**
 * Walk any content object and optimise every bundled image found in it (in place).
 * Sanity images already carry a CDN srcset from the loader and are left alone.
 */
export async function optimiseImages<T>(root: T): Promise<T> {
  const found = new Set<Img>();
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (isLocal(node) && !node.srcset) found.add(node);
    for (const value of Object.values(node as Record<string, unknown>)) walk(value);
  };
  walk(root);
  await Promise.all([...found].map(optimise));
  return root;
}
