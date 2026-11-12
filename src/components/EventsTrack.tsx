import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, EASE, SCRUB, requestRefresh } from '../lib/motion/gsap';
import { imgProps, SIZES } from '../lib/img-attrs';
import type { Home } from '../lib/types';
import { Rich } from './Rich';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Pinned section whose cards travel horizontally as the page scrolls vertically.
 * The section is made exactly `content height + travel` tall and its inner wrapper is CSS-sticky,
 * so the vertical scroll distance equals the horizontal distance the track moves.
 */
/** Minimum distance (px) from the top of the screen while pinned: clears the fixed nav. */
const PIN_MIN_TOP = 96;

export default function EventsTrack({ heading, intro, items }: Home['events']) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // distance to move so the last card ends one gutter (the track's right padding) inside
      // the visible width; clientWidth excludes a desktop scrollbar, and scrollWidth would drop the padding
      const travel = () => {
        const el = track.current!;
        const last = el.lastElementChild as HTMLElement | null;
        if (!last) return 0;
        const contentEnd = last.offsetLeft + last.offsetWidth + parseFloat(getComputedStyle(el).paddingRight);
        return Math.max(0, Math.ceil(contentEnd - document.documentElement.clientWidth));
      };
      // The pinned block is only as tall as its content, so the space above and below it is the
      // normal section gap. While pinned it sits centred in the screen, but never under the nav.
      const pinTop = () => Math.max(PIN_MIN_TOP, Math.round((window.innerHeight - sticky.current!.offsetHeight) / 2));
      // size the section before ScrollTrigger measures, on every refresh (resize, fonts, images)
      const size = () => {
        sticky.current!.style.top = `${pinTop()}px`;
        section.current!.style.height = `${sticky.current!.offsetHeight + travel()}px`;
      };
      size();
      ScrollTrigger.addEventListener('refreshInit', size);

      gsap
        .timeline({
          defaults: { ease: EASE.none },
          scrollTrigger: { trigger: section.current, start: () => `top ${pinTop()}px`, end: () => `+=${travel()}`, scrub: SCRUB.section, invalidateOnRefresh: true },
        })
        .fromTo(track.current, { x: 0 }, { x: () => -travel() }, 0)
        .fromTo(bar.current, { scaleX: 0 }, { scaleX: 1 }, 0);

      requestRefresh();
      return () => ScrollTrigger.removeEventListener('refreshInit', size);
    },
    { scope: section },
  );

  return (
    <section className="hscroll" id="events" ref={section}>
      <div className="hscroll-sticky" ref={sticky}>
        <div className="hscroll-head">
          <h2><Rich text={heading} /></h2>
          <p>{intro}</p>
        </div>
        <div className="htrack" ref={track}>
          {items.map((e, i) => (
            <figure className="hcard" key={i}>
              {e.image && <img {...imgProps(e.image, SIZES.card)} alt={e.title} loading="lazy" decoding="async" />}
              <span className="num">{pad(i + 1)}</span>
              <figcaption>
                <small>{e.tag}</small>
                <strong>{e.title}</strong>
                <span>{e.meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="hprogress"><i ref={bar} /></div>
      </div>
    </section>
  );
}
