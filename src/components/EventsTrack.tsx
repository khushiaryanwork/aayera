import { useEffect, useRef } from 'react';
import type { Home } from '../lib/types';
import { Rich } from './Rich';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pad = (n: number) => String(n).padStart(2, '0');

/** Pinned section whose cards travel horizontally as the page scrolls vertically. */
export default function EventsTrack({ heading, intro, items }: Home['events']) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    let travel = 0;
    const size = () => {
      travel = Math.max(0, track.current!.scrollWidth - innerWidth);
      section.current!.style.height = innerHeight + travel + 'px';
    };
    const onScroll = () => {
      const hp = clamp((scrollY - section.current!.offsetTop) / (travel || 1));
      track.current!.style.transform = `translate3d(${-hp * travel}px,0,0)`;
      bar.current!.style.transform = `scaleX(${hp})`;
    };
    let ticking = false;
    const scroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { onScroll(); ticking = false; });
    };
    const resize = () => { size(); onScroll(); };
    resize();
    addEventListener('scroll', scroll, { passive: true });
    addEventListener('resize', resize);
    addEventListener('load', resize);
    return () => {
      removeEventListener('scroll', scroll);
      removeEventListener('resize', resize);
      removeEventListener('load', resize);
    };
  }, []);

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
