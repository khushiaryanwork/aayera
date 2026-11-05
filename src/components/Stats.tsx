import { useEffect, useRef } from 'react';
import type { Stat } from '../lib/types';

/** Four numbers over photos; each counts up the first time it scrolls into view. */
export default function Stats({ items }: { items: Stat[] }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = [...root.current!.querySelectorAll<HTMLElement>('.stat b .v')];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // numbers are pre-rendered for SEO; reset to 0 off-screen, then count up when seen
    els.forEach((el) => { if (el.getBoundingClientRect().top > innerHeight) el.textContent = '0'; });
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const el = e.target as HTMLElement, n = +el.dataset.n!, t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / 1400, 1);
            el.textContent = String(Math.round(n * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
      { threshold: 0.5 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="stats" aria-label="Aayera in numbers" id="stats" ref={root}>
      {items.map((s, i) => (
        <div className="stat" key={i}>
          {s.image && <img src={s.image.src} alt="" loading="lazy" />}
          <b><span className="v" data-n={s.value}>{s.value}</span><sup>{s.suffix}</sup></b>
          <span>{s.label}</span>
        </div>
      ))}
    </section>
  );
}
