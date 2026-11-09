import { gsap, EASE, MQ } from './gsap';

export interface LoopOptions {
  /** pixels per second (ignored when `duration` is given) */
  speed?: number;
  /** seconds for one full copy to pass; keeps the original CSS timings */
  duration?: number;
  /** true = moves left-to-right */
  reversed?: boolean;
  /** start somewhere along the loop instead of at 0 (0–1) */
  startProgress?: number;
}

/**
 * Seamless horizontal loop for a track whose content is repeated `copies` times.
 * Moving by exactly one copy's width and wrapping makes the seam invisible.
 * Returns the tween so callers can pause it or change its timeScale.
 */
export function createLoop(track: HTMLElement, copies: number, { speed = 40, duration, reversed = false, startProgress = 0 }: LoopOptions): gsap.core.Tween {
  const distance = (): number => track.scrollWidth / copies;
  const tween = gsap.fromTo(
    track,
    { x: () => (reversed ? -distance() : 0) },
    {
      x: () => (reversed ? 0 : -distance()),
      duration: duration ?? distance() / speed,
      ease: EASE.none,
      repeat: -1,
    },
  );
  if (startProgress) tween.progress(startProgress);
  return tween;
}

/** Smoothly slow a loop to `to` (0 = stop) — used for hover pauses. */
export function easeLoopSpeed(tween: gsap.core.Tween, to: number, duration = 0.6): void {
  gsap.to(tween, { timeScale: to, duration, ease: EASE.out, overwrite: true });
}

/**
 * Wire up every `[data-loop]` track on the page (Astro-rendered marquees).
 *   data-loop="38"        seconds per cycle
 *   data-loop-copies="2"  how many times the content is repeated (default 2)
 *   data-loop-reverse     move left-to-right
 *   data-loop-hover-pause ease to a stop while hovered
 */
export function initDataLoops(): void {
  gsap.matchMedia().add(MQ.motion, () => {
    const cleanups: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>('[data-loop]').forEach((track) => {
      const tween = createLoop(track, Number(track.dataset.loopCopies) || 2, {
        duration: Number(track.dataset.loop) || 40,
        reversed: track.hasAttribute('data-loop-reverse'),
      });
      if (!track.hasAttribute('data-loop-hover-pause')) return;
      const hoverEl = track.parentElement ?? track;
      const stop = () => easeLoopSpeed(tween, 0);
      const go = () => easeLoopSpeed(tween, 1);
      hoverEl.addEventListener('mouseenter', stop);
      hoverEl.addEventListener('mouseleave', go);
      cleanups.push(() => {
        hoverEl.removeEventListener('mouseenter', stop);
        hoverEl.removeEventListener('mouseleave', go);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  });
}
