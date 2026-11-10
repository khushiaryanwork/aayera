import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, EASE, MQ, SCRUB, requestRefresh } from '../lib/motion/gsap';
import { imgProps, SIZES } from '../lib/img-attrs';
import type { Home } from '../lib/types';
import { Rich } from './Rich';

/** Scroll choreography (fractions of the section's scroll distance). */
const GROW_END = 0.6; // image reaches full-bleed
const VEIL = [0.35, 0.3] as const; // darkening overlay: start, duration
const WORD_START = 0.42; // first word appears…
const WORD_STEP = 0.1; // …and each next one this much later

/** Image that grows from a rounded card to full-bleed, with words revealing on top. */
export default function Statement({ image, words }: Home['statement']) {
  const section = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const imgEl = useRef<HTMLImageElement>(null);
  const wordsEl = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const spans = gsap.utils.toArray<HTMLElement>(wordsEl.current!.children);

      const mm = gsap.matchMedia();
      // reduced motion: show the finished state (full-bleed image, all words) without scrubbing
      mm.add(MQ.reduce, () => {
        gsap.set(media.current, { clipPath: 'inset(0% 0% 0% 0% round 0px)', '--o': 0.9 });
        gsap.set(imgEl.current, { scale: 1 });
        gsap.set(spans, { autoAlpha: 1, y: 0 });
      });
      mm.add(MQ.motion, () => {
        // words animate in and out as the scrub crosses each threshold (time-based, like the original)
        const shown = spans.map(() => false);
        gsap.set(spans, { autoAlpha: 0, y: 40 });
        const updateWords = (progress: number) =>
          spans.forEach((el, i) => {
            const on = progress > WORD_START + i * WORD_STEP;
            if (on === shown[i]) return;
            shown[i] = on;
            gsap.to(el, { autoAlpha: on ? 1 : 0, y: on ? 0 : 40, duration: 0.7, ease: EASE.css, overwrite: true });
          });

        const tl = gsap.timeline({
          defaults: { ease: EASE.none },
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: SCRUB.section,
          },
          // read the smoothed timeline progress so the words stay in step with the image
          onUpdate: () => updateWords(tl.progress()),
        });
        tl.fromTo(media.current, { clipPath: 'inset(22% 30% 22% 30% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: GROW_END }, 0)
          .fromTo(imgEl.current, { scale: 1.25 }, { scale: 1, duration: GROW_END }, 0)
          .fromTo(media.current, { '--o': 0 }, { '--o': 0.9, duration: VEIL[1] }, VEIL[0])
          .to({}, { duration: 1 - GROW_END }, GROW_END); // pad to the full scroll length
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
