import { useEffect, useRef, useState } from 'react';
import type { Home } from '../lib/types';
import { Rich, plain } from './Rich';

type Props = Home['hero'];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Full-screen slider that, on scroll, shrinks into the centre slot of a wall of event photos. */
export default function Hero({ eyebrow, heading, primaryCta, secondaryCta, slideCta, slides, mosaic }: Props) {
  const n = slides.length;
  const [cur, setCur] = useState(0);
  const [hovering, setHovering] = useState(false);
  const go = (i: number) => setCur(((i % n) + n) % n);

  const section = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const mosaicEl = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const ui = useRef<HTMLDivElement>(null);
  const swipeX = useRef<number | null>(null);

  // autoplay: restarts whenever the slide changes; paused while hovering or with reduced motion
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || hovering || n < 2) return;
    const dur = matchMedia('(min-width:761px)').matches ? 4000 : 6000;
    const t = setTimeout(() => setCur((c) => (c + 1) % n), dur);
    return () => clearTimeout(t);
  }, [cur, hovering, n]);

  // scroll-driven zoom out into the wall
  useEffect(() => {
    let R = { x: 0, y: 0, w: 1, h: 1 };
    const size = () => {
      const s = slot.current!;
      R = { x: s.offsetLeft, y: s.offsetTop, w: s.offsetWidth || 1, h: s.offsetHeight || 1 };
    };
    const onScroll = () => {
      const y = scrollY, vh = innerHeight, vw = innerWidth;
      const heroEl = section.current!, m = mosaicEl.current!, f = frame.current!;
      const zp = clamp(y / Math.max(heroEl.offsetHeight - vh, 1)), e = ease(clamp(zp / 0.68));
      const s0 = Math.max(vw / R.w, vh / R.h) * 1.02, sc = s0 + (1 - s0) * e;
      const cx = R.x + R.w / 2, cy = R.y + R.h / 2, fw = R.w * sc, fh = R.h * sc;
      m.style.transformOrigin = `${cx}px ${cy}px`;
      m.style.transform = `scale(${sc})`;
      m.style.opacity = String(clamp(e * 3));
      m.style.setProperty('--lbl', String(clamp((zp - 0.55) / 0.25)));
      // clip the frame to the screen so the slide text and dots always sit inside the visible area
      const fx = Math.max(0, cx - fw / 2), fy = Math.max(0, cy - fh / 2), fr = Math.min(vw, cx + fw / 2), fb = Math.min(vh, cy + fh / 2);
      f.style.width = fr - fx + 'px';
      f.style.height = fb - fy + 'px';
      f.style.transform = `translate3d(${fx}px,${fy}px,0)`;
      f.style.borderRadius = 16 * e + 'px';
      sticky.current!.style.setProperty('--ui', String(1 - clamp(e * 3)));
      ui.current!.classList.toggle('off', e > 0.34);
      const t = clamp((zp - 0.5) / 0.3);
      veil.current!.style.opacity = String(t);
      title.current!.style.opacity = String(t);
      title.current!.style.transform = `translateY(${(1 - t) * 40}px)`;
      title.current!.classList.toggle('live', t > 0.5);
    };
    let ticking = false;
    const scroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { onScroll(); ticking = false; });
    };
    const resize = () => { size(); onScroll(); };
    size(); onScroll();
    addEventListener('scroll', scroll, { passive: true });
    addEventListener('resize', resize);
    addEventListener('load', resize);
    return () => {
      removeEventListener('scroll', scroll);
      removeEventListener('resize', resize);
      removeEventListener('load', resize);
    };
  }, []);

  // 15 cells: the centre one (index 7, in both the 5×3 and 3×5 grids) is the empty slot the slider lands in
  const cells = Array.from({ length: 15 }, (_, i) => (i === 7 ? null : mosaic[i < 7 ? i : i - 1]));

  return (
    <section className="hero" id="top" aria-roledescription="carousel" aria-label="Event highlights" ref={section}>
      <div
        className="hero-sticky"
        ref={sticky}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(cur - 1); if (e.key === 'ArrowRight') go(cur + 1); }}
        onPointerDown={(e) => { if (e.pointerType !== 'mouse') swipeX.current = e.clientX; }}
        onPointerUp={(e) => {
          if (swipeX.current === null) return;
          const dx = e.clientX - swipeX.current;
          swipeX.current = null;
          if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
        }}
      >
        <div className="mosaic" ref={mosaicEl} aria-hidden="true">
          {cells.map((m, i) =>
            m === null ? (
              <figure className="slot" key={i} ref={slot as any} />
            ) : m ? (
              <figure key={i}>
                <img src={m.image.src} alt="" decoding="async" />
                <figcaption>{m.caption}</figcaption>
              </figure>
            ) : (
              <figure key={i} />
            ),
          )}
        </div>

        <div className="hero-frame" ref={frame}>
          <div>
            {slides.map((s, i) => (
              <div className={'slide' + (i === cur ? ' on' : '')} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}`} key={i}>
                <img src={s.image.src} alt={s.image.alt} {...(i ? { loading: 'lazy' as const } : { fetchPriority: 'high' as const })} />
                <div className="slide-copy">
                  <p className="eyebrow">{s.tag}</p>
                  <h2>{s.short || s.title}</h2>
                  <p className="meta">{s.meta}</p>
                  <a className="btn btn-gold" href={slideCta.href}>{slideCta.label}</a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-veil" ref={veil} />

        <div className="hero-title" ref={title}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 aria-label={plain(heading)}><Rich text={heading} /></h1>
          <div className="hero-actions">
            <a className="btn btn-gold" href={primaryCta.href}>{primaryCta.label}</a>
            <a className="btn btn-ghost" href={secondaryCta.href}>{secondaryCta.label}</a>
          </div>
        </div>

        <div className="hero-ui" ref={ui}>
          <button className="hero-arrow prev" aria-label="Previous slide" onClick={() => go(cur - 1)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 3L5 8l5 5" /></svg>
          </button>
          <button className="hero-arrow next" aria-label="Next slide" onClick={() => go(cur + 1)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 3l5 5-5 5" /></svg>
          </button>
          <div className="hero-dots" role="tablist" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button role="tab" key={i} aria-label={`Go to slide ${i + 1}: ${s.title}`} aria-current={i === cur} onClick={() => go(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
