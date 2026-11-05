import { useEffect, useRef, useState } from 'react';
import type { Home } from '../lib/types';
import { Rich } from './Rich';

const BASE = [38, 30, 46];

/** Three marquee rows of client logos: alternate directions, scrolling speeds them up, hover slows a row. */
export default function Clients({ eyebrow, heading, intro, logos }: Home['clients']) {
  const root = useRef<HTMLElement>(null);
  const countEl = useRef<HTMLSpanElement>(null);
  const [copies, setCopies] = useState(4);
  const rows: (typeof logos)[] = [[], [], []];
  logos.forEach((l, i) => rows[i % 3].push(l));

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) setCopies(1);
    // the real count is pre-rendered for SEO; reset so it can count up when the section is reached
    else if (!root.current!.classList.contains('in')) countEl.current!.textContent = '0';
    const clientsEl = root.current!;
    const k = reduce ? 1 : copies;
    const marq = [...clientsEl.querySelectorAll<HTMLElement>('.lrow')].map((el, i) => ({
      el, t: el.firstElementChild as HTMLElement, dir: i % 2 ? 1 : -1, base: BASE[i] ?? 38,
      o: Math.random() * 400, k: 1, kt: 1, w: 1,
    }));
    const enter = marq.map((m) => () => (m.kt = 0.12));
    const leave = marq.map((m) => () => (m.kt = 1));
    marq.forEach((m, i) => { m.el.addEventListener('mouseenter', enter[i]); m.el.addEventListener('mouseleave', leave[i]); });
    const measure = () => marq.forEach((m) => (m.w = m.t.scrollWidth / k || 1));

    let on = false, last = 0, lastY = scrollY, boost = 0, raf = 0;
    const loop = (now: number) => {
      if (!on) return;
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const dy = Math.abs(scrollY - lastY); lastY = scrollY;
      boost = Math.max(boost * 0.92, Math.min(dy * 14, 520));
      marq.forEach((m) => {
        m.k += (m.kt - m.k) * 0.08;
        m.o += (m.base + boost * 0.35) * m.k * dt;
        const x = m.dir < 0 ? -(m.o % m.w) : (m.o % m.w) - m.w;
        m.t.style.transform = `translate3d(${x}px,0,0)`;
      });
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on && !clientsEl.classList.contains('in')) {
        clientsEl.classList.add('in');
        if (!reduce) {
          const t0 = performance.now(), n = logos.length;
          const tick = (t: number) => {
            const p = Math.min((t - t0) / 1600, 1);
            countEl.current!.textContent = String(Math.round(n * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      }
      if (on && !reduce) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
    }, { threshold: 0.15 });
    io.observe(clientsEl);
    measure();
    addEventListener('load', measure);
    addEventListener('resize', measure);
    return () => {
      io.disconnect(); cancelAnimationFrame(raf);
      removeEventListener('load', measure); removeEventListener('resize', measure);
      marq.forEach((m, i) => { m.el.removeEventListener('mouseenter', enter[i]); m.el.removeEventListener('mouseleave', leave[i]); });
    };
  }, [copies, logos.length]);

  return (
    <section className="clients" id="clients" ref={root}>
      <div className="clients-head">
        <p className="eyebrow">{eyebrow}</p>
        <h2><Rich text={heading} tokens={{ count: <span id="logoCount" ref={countEl}>{logos.length}</span> }} /></h2>
        <p>{intro}</p>
      </div>
      <div className="lrows">
        {rows.map((r, i) => (
          <div className="lrow" key={i}>
            <div className="ltrack">
              {Array.from({ length: copies }, (_, c) =>
                r.map((l, j) => (
                  <div className={'lcard' + (l.plain ? ' plain' : '')} key={`${c}-${j}`} style={{ ['--d' as any]: `${((i * 3 + j) * 0.55) % 7}s` }}>
                    <img src={l.src} alt={l.alt} loading="lazy" />
                  </div>
                )),
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
