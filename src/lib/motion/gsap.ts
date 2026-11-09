/**
 * Single entry point for GSAP on the site.
 * Import gsap / ScrollTrigger from here (never from 'gsap' directly) so the plugin
 * is registered exactly once and every animation shares the same eases and media queries.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  // ignore the address-bar show/hide resize on mobile so pinned/scrubbed sections don't jump
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** Shared easing vocabulary (keeps motion consistent with the original CSS curves). */
export const EASE = {
  /** cubic-bezier(.2,.7,.2,1): the site's standard "settle" curve */
  out: 'power3.out',
  /** ease-in-out cubic (GSAP's power2 is cubic) */
  inOut: 'power2.inOut',
  /** constant speed, for scroll-scrubbed and looping motion */
  none: 'none',
} as const;

/** Media-query conditions for gsap.matchMedia(). */
export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 761px)',
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
