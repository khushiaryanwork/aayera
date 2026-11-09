import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, EASE, requestRefresh } from '../lib/motion/gsap';
import type { Home } from '../lib/types';
import { Rich } from './Rich';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Pinned section whose cards travel horizontally as the page scrolls vertically.
 * The section is made exactly `100vh + travel` tall and its inner wrapper is CSS-sticky,
 * so the vertical scroll distance equals the horizontal distance the track moves.
 */
export default function EventsTrack({ heading, intro, items }: Home['events']) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const travel = () => Math.max(0, track.current!.scrollWidth - window.innerWidth);
      // size the section before ScrollTrigger measures, on every refresh (resize, fonts, images)
      const size = () => {
        section.current!.style.height = `${window.innerHeight + travel()}px`;
      };
      size();
      ScrollTrigger.addEventListener('refreshInit', size);

      gsap
        .timeline({
          defaults: { ease: EASE.none },
          scrollTrigger: { trigger: section.current, start: 'top top', end: () => `+=${travel()}`, scrub: true, invalidateOnRefresh: true },
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
      <div className="hscroll-sticky">
        <div className="hscroll-head">
          <h2><Rich text={heading} /></h2>
          <p>{intro}</p>
        </div>
        <div className="htrack" ref={track}>
          {items.map((e, i) => (
            <figure className="hcard" key={i}>
              <img src={e.image?.src} alt={e.title} />
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
