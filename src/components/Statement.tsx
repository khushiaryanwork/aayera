import { useEffect, useRef } from 'react';
import type { Home } from '../lib/types';
import { Rich } from './Rich';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Image that grows from a rounded card to full-bleed, with words revealing on top. */
export default function Statement({ image, words }: Home['statement']) {
  const section = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const imgEl = useRef<HTMLImageElement>(null);
  const wordsEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spans = [...wordsEl.current!.children] as HTMLElement[];
    const onScroll = () => {
      const exp = section.current!, vh = innerHeight;
      const ep = clamp((scrollY - exp.offsetTop) / (exp.offsetHeight - vh));
      const g = clamp(ep / 0.6), ti = 22 * (1 - g), si = 30 * (1 - g), r = 28 * (1 - g);
      media.current!.style.clipPath = `inset(${ti}% ${si}% ${ti}% ${si}% round ${r}px)`;
      imgEl.current!.style.transform = `scale(${1.25 - 0.25 * g})`;
      media.current!.style.setProperty('--o', String(clamp((ep - 0.35) / 0.3) * 0.9));
      spans.forEach((w, i) => w.classList.toggle('in', ep > 0.42 + i * 0.1));
    };
    let ticking = false;
    const scroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { onScroll(); ticking = false; });
    };
    onScroll();
    addEventListener('scroll', scroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', scroll); removeEventListener('resize', onScroll); };
  }, []);

  return (
    <section className="expand" id="expand" ref={section}>
      <div className="expand-sticky">
        <div className="expand-media" ref={media}>
          {image && <img ref={imgEl} src={image.src} alt={image.alt} />}
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
