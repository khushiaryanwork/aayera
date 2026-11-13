import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, EASE, MQ, requestRefresh } from '../lib/motion/gsap';
import { imgProps, SIZES } from '../lib/img-attrs';
import type { Home } from '../lib/types';
import { Rich } from './Rich';

/** Choreography (fractions of the timeline). */
const GROW_END = 0.6; // image reaches full-bleed
const VEIL = [0.35, 0.3] as const; // darkening overlay: start, duration
const WORD_START = 0.42; // first word appears…
const WORD_STEP = 0.1; // …and each next one this much later
/** Playback length once the section reaches the top of the screen (seconds). */
const PLAY = { duration: 2.2 } as const;

/**
 * Image that grows from a rounded card to full-bleed, with words revealing on top.
 * The first time the section reaches the top of the screen it pins and the whole sequence plays
 * (scroll gestures are held by GSAP Observer meanwhile), then scrolling continues.
 * It stays finished: no reverse on the way up.
 */
export default function Statement({ image, words }: Home['statement']) {
  const section = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const imgEl = useRef<HTMLImageElement>(null);
  const wordsEl = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const spans = gsap.utils.toArray<HTMLElement>(wordsEl.current!.children);

      const mm = gsap.matchMedia();
      // reduced motion: show the finished state (full-bleed image, all words), no hold
      mm.add(MQ.reduce, () => {
        gsap.set(media.current, { clipPath: 'inset(0% 0% 0% 0% round 0px)', '--o': 0.9 });
        gsap.set(imgEl.current, { scale: 1 });
        gsap.set(spans, { autoAlpha: 1, y: 0 });
      });
      mm.add(MQ.motion, () => {
        // words animate in and out as the timeline crosses each threshold (time-based, like the original)
        const shown = spans.map(() => false);
        gsap.set(spans, { autoAlpha: 0, y: 40 });
        const updateWords = (progress: number) =>
          spans.forEach((el, i) => {
            const on = progress > WORD_START + i * WORD_STEP;
            if (on === shown[i]) return;
            shown[i] = on;
            gsap.to(el, { autoAlpha: on ? 1 : 0, y: on ? 0 : 40, duration: 0.7, ease: EASE.css, overwrite: true });
          });

        const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.none }, onUpdate: () => updateWords(tl.progress()) });
        tl.fromTo(media.current, { clipPath: 'inset(22% 30% 22% 30% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: GROW_END }, 0)
          .fromTo(imgEl.current, { scale: 1.25 }, { scale: 1, duration: GROW_END }, 0)
          .fromTo(media.current, { '--o': 0 }, { '--o': 0.9, duration: VEIL[1] }, VEIL[0])
          .to({}, { duration: 1 - GROW_END }, GROW_END); // keeps the original timing proportions
        // the last word is in a little after its threshold: stop there
        const END = Math.min(1, WORD_START + (spans.length - 1) * WORD_STEP + 0.08);

        /* pin + play once, on the way down; it then stays finished.
           The pin is CSS sticky (.expand is taller than the screen, .expand-sticky sticks), so it works the
           same on every browser. While the sequence plays, GSAP Observer swallows new wheel / touch gestures,
           and on touch screens the page is frozen in place, so nothing scrolls until it has finished. */
        const hold = ScrollTrigger.observe({ type: 'wheel,touch', preventDefault: true, allowClicks: true });
        hold.disable();

        // Touch screens: freeze the page exactly at the section until the sequence ends. A glide (momentum)
        // already in flight ignores blocked gestures and only stops when the page itself is frozen, which on
        // iOS needs <body> fixed in place (overflow: hidden is not enough there).
        // any touchscreen (an iPad with a trackpad reports a fine pointer but still flicks and glides)
        const touch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
        const freeze = (y: number) => {
          Object.assign(document.body.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', width: '100%' });
        };
        const unfreeze = (y: number) => {
          Object.assign(document.body.style, { position: '', top: '', left: '', right: '', width: '' });
          window.scrollTo(0, y);
        };

        const finish = () => tl.progress(END / tl.duration());
        // fires once when the section's top reaches the top of the screen going down
        const st = ScrollTrigger.create({
          trigger: section.current,
          start: 'top top',
          once: true,
          onEnter: (self) => {
            // only a real jump (anchor link, restored position) that lands beyond the whole section skips it.
            // Safari reports a fast glide's position a few frames late, so anything closer still plays,
            // snapped back to the section.
            if (window.scrollY - self.start > section.current!.offsetHeight) return finish();
            const at = Math.round(self.start); // the section exactly at the top of the screen
            hold.enable();
            if (touch) freeze(at);
            else window.scrollTo(0, at);
            gsap.to(tl, {
              progress: END / tl.duration(),
              duration: PLAY.duration,
              ease: EASE.none, // each part keeps its own ease inside the timeline
              onComplete: () => {
                // the page scrolls on from here
                if (touch) unfreeze(at);
                hold.disable();
              },
            });
          },
        });

        return () => {
          hold.kill();
          st.kill();
          if (document.body.style.position === 'fixed') unfreeze(Math.round(-parseFloat(document.body.style.top) || 0));
        };
      });

      requestRefresh();
    },
    { scope: section },
  );

  return (
    <section className="expand" id="expand" ref={section}>
      <div className="expand-sticky">
        <div className="expand-media" ref={media}>
          {image && <img ref={imgEl} {...imgProps(image, SIZES.full)} alt={image.alt} loading="lazy" decoding="async" />}
        </div>
        <div className="expand-words" ref={wordsEl}>
          {words.map((w, i) => {
            const accent = /^\*.*\*$/.test(w.trim());
            return (
              <span key={i} className={accent ? 'serif' : undefined}>
                {accent ? w.trim().slice(1, -1) : <Rich text={w} />}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
