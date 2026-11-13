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
 * When the section reaches the top of the screen the page holds (GSAP Observer) while the whole
 * sequence plays, then scrolling continues. Coming back up, it holds again and plays in reverse.
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

        /* hold the page while the sequence plays */
        let state: 'start' | 'end' = 'start';
        let playing = false;
        let heldAt = 0;
        const hold = ScrollTrigger.observe({
          type: 'wheel,touch,scroll,pointer',
          preventDefault: true,
          allowClicks: true,
          onEnable: () => (heldAt = window.scrollY),
          onChangeY: () => window.scrollTo(0, heldAt), // undo scrollbar drags / momentum while held
        });
        hold.disable();

        const play = (to: 'start' | 'end') => {
          if (playing || state === to) return;
          playing = true;
          gsap.to(tl, {
            progress: to === 'end' ? END : 0,
            duration: PLAY.duration * Math.abs((to === 'end' ? END : 0) - tl.progress()) / END,
            ease: EASE.none, // each part keeps its own ease inside the timeline
            onComplete: () => {
              state = to;
              playing = false;
              hold.disable(); // the page scrolls on from here
            },
          });
        };

        const lock = (self: ScrollTrigger, from: 'start' | 'end') => {
          // a jump (anchor link, restored position) that lands well past the section skips the hold
          if (Math.abs(window.scrollY - self.start) > window.innerHeight * 0.5) {
            tl.progress(from === 'start' ? END : 0);
            state = from === 'start' ? 'end' : 'start';
            return;
          }
          if (state !== from || playing) return;
          window.scrollTo(0, self.start); // section exactly at the top of the screen
          hold.enable();
          play(from === 'start' ? 'end' : 'start'); // already scrolling this way: play straight away
        };

        // a zero-length trigger at the section top: onEnter = crossing it going down, onLeaveBack = going up
        const st = ScrollTrigger.create({
          trigger: section.current,
          start: 'top top',
          end: 'top top',
          onEnter: (self) => lock(self, 'start'),
          onLeaveBack: (self) => lock(self, 'end'),
        });

        return () => {
          hold.kill();
          st.kill();
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
