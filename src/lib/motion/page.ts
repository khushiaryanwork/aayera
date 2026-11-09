/**
 * Page-wide motion shared by every page: reveal-on-scroll, nav / announcement-bar states,
 * the inner-page header zoom and the closing CTA parallax.
 */
import { gsap, ScrollTrigger, EASE, MQ } from './gsap';

const REVEAL = { y: 36, duration: 0.9, stagger: 0.08 } as const;

function initNavState(): void {
  const root = document.documentElement;
  const nav = document.getElementById('nav');
  const homeHero = document.getElementById('top'); // home: tall scroll-driven hero
  const pageHero = document.getElementById('phero'); // inner pages: image header

  // announcement bar slides away once the page has scrolled a little
  ScrollTrigger.create({ start: 40, end: 'max', toggleClass: { targets: root, className: 'bar-off' } });

  if (!nav) return;
  const solidFrom = (): number =>
    homeHero ? homeHero.offsetHeight - window.innerHeight * 1.2 : pageHero ? pageHero.offsetHeight * 0.55 : 10;
  ScrollTrigger.create({ start: solidFrom, end: 'max', toggleClass: { targets: nav, className: 'solid' }, invalidateOnRefresh: true });
}

function initReveals(): void {
  const items = gsap.utils.toArray<HTMLElement>('.rv');
  if (!items.length) return;
  gsap.set(items, { autoAlpha: 0, y: REVEAL.y });
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap
        .timeline()
        // fade with CSS `ease`, rise with the site curve (as the original CSS transition did)
        .to(batch, { autoAlpha: 1, duration: REVEAL.duration, ease: EASE.css, stagger: REVEAL.stagger }, 0)
        // hand transforms back to CSS afterwards so hover lifts keep working
        .to(batch, { y: 0, duration: REVEAL.duration, ease: EASE.out, stagger: REVEAL.stagger, clearProps: 'transform' }, 0),
  });
}

function initPageHero(): void {
  const img = document.querySelector<HTMLElement>('.phero-bg img');
  if (img) gsap.fromTo(img, { scale: 1.06 }, { scale: 1, duration: 2.4, ease: EASE.out });
}

function initCtaParallax(): void {
  const cta = document.querySelector<HTMLElement>('.cta');
  const bg = document.getElementById('ctaBg');
  if (!cta || !bg) return;
  gsap.fromTo(bg, { y: 60 }, { y: -60, ease: EASE.none, scrollTrigger: { trigger: cta, start: 'top bottom', end: 'bottom top', scrub: true } });
}

export function initPageMotion(): void {
  // state changes run for everyone; decorative motion only without reduced-motion
  initNavState();
  gsap.matchMedia().add(MQ.motion, () => {
    initReveals();
    initPageHero();
    initCtaParallax();
  });
  // images change section heights as they load; re-measure once everything is in
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
