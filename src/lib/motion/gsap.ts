/**
 * Single entry point for GSAP on the site.
 * Import gsap / ScrollTrigger from here (never from 'gsap' directly) so the plugin
 * is registered exactly once and every animation shares the same eases and media queries.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { DESKTOP_MEDIA } from '../breakpoints';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  // exact copies of the curves the original CSS used, so motion feels identical
  CustomEase.create('siteOut', '0.2,0.7,0.2,1'); // cubic-bezier(.2,.7,.2,1): the site's "settle" curve
  CustomEase.create('cssEase', '0.25,0.1,0.25,1'); // CSS `ease`
  CustomEase.create('cssEaseOut', '0,0,0.58,1'); // CSS `ease-out`
  // ignore the address-bar show/hide resize on mobile so pinned/scrubbed sections don't jump
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** Shared easing vocabulary (keeps motion consistent with the original CSS curves). */
export const EASE = {
  /** cubic-bezier(.2,.7,.2,1): the site's standard "settle" curve */
  out: 'siteOut',
  /** CSS `ease`, used for fades */
  css: 'cssEase',
  /** CSS `ease-out` */
  cssOut: 'cssEaseOut',
  /** ease-in-out cubic (GSAP's power2 is cubic) — the hero zoom */
  inOut: 'power2.inOut',
  /** ease-out cubic, 1-(1-t)^3 — the number counters */
  count: 'power2.out',
  /** constant speed, for scroll-scrubbed and looping motion */
  none: 'none',
} as const;

/**
 * Scroll smoothing for scrubbed animations: instead of jumping with every mouse-wheel
 * step, the animation eases toward the scroll position over this many seconds.
 */
export const SCRUB = {
  /** pinned, story-telling sections (hero zoom, events track, expanding image) */
  section: 0.8,
  /** background parallax — a little floatier */
  parallax: 1.2,
} as const;

/** Media-query conditions for gsap.matchMedia(). */
export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  desktop: DESKTOP_MEDIA,
} as const;

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(MQ.reduce).matches;

let pendingRefresh: gsap.core.Tween | null = null;
/**
 * Ask ScrollTrigger to re-measure once things settle. Islands hydrate one by one and some
 * change their own height (e.g. the horizontal events track), so calls are debounced.
 */
export function requestRefresh(): void {
  pendingRefresh?.kill();
  pendingRefresh = gsap.delayedCall(0.15, () => ScrollTrigger.refresh());
}

export { gsap, ScrollTrigger };
