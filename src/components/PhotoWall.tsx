import { useCallback, useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, EASE, MQ, SCRUB } from '../lib/motion/gsap';
import { imgProps, SIZES } from '../lib/img-attrs';
import type { WallTile } from '../lib/types';

/** Parallax strength per column (positive = drifts up as you scroll). */
const SPEEDS = [0.12, -0.08, 0.16, -0.05];
/** Pixels of drift at strength 1 across the wall's full pass through the viewport. */
const DRIFT = 900;

/** Four parallax columns of photos; clicking one opens a lightbox. */
export default function PhotoWall({ tiles }: { tiles: WallTile[] }) {
  const wall = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  // split the flat list into 4 columns, top-to-bottom then left-to-right
  const per = Math.ceil(tiles.length / 4) || 1;
  const cols = [0, 1, 2, 3].map((c) => tiles.slice(c * per, c * per + per).map((t, j) => ({ t, i: c * per + j })));

  // columns drift at different speeds while the wall passes through the viewport
  useGSAP(
    () => {
      gsap.matchMedia().add(MQ.motion, () => {
        gsap.utils.toArray<HTMLElement>(wall.current!.children).forEach((col, i) => {
          const drift = (SPEEDS[i] ?? 0) * DRIFT;
          gsap.fromTo(
            col,
            { y: drift / 2 },
            { y: -drift / 2, ease: EASE.none, scrollTrigger: { trigger: wall.current, start: 'top bottom', end: 'bottom top', scrub: SCRUB.parallax } },
          );
        });
      });
    },
    { scope: wall },
  );

  const show = useCallback((i: number) => setOpen(((i % tiles.length) + tiles.length) % tiles.length), [tiles.length]);
  const close = () => setOpen(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(open - 1);
      if (e.key === 'ArrowRight') show(open + 1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open, show]);

  const cur = open !== null ? tiles[open] : null;

  return (
    <>
      <div className="wall-grid" ref={wall}>
        {cols.map((col, c) => (
          <div className="wall-col" key={c}>
            {col.map(({ t, i }) => (
              <figure className="tile" key={i} style={{ ['--ar' as any]: t.ratio }} onClick={() => show(i)}>
                <img {...imgProps(t.image, SIZES.quarter)} alt={t.caption} loading="lazy" decoding="async" />
                <span>{t.caption}</span>
              </figure>
            ))}
          </div>
        ))}
      </div>

      <div className={'lb' + (cur ? ' on' : '')} role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={(e) => e.target === e.currentTarget && close()}>
        <button className="icon-btn" aria-label="Close" onClick={close}>
          <svg viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l10 10M13 3L3 13" /></svg>
        </button>
        <button className="icon-btn nav-l" aria-label="Previous" onClick={() => open !== null && show(open - 1)}>
          <svg viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" fill="none"><path d="M10 3L5 8l5 5" /></svg>
        </button>
        {cur && <img {...imgProps(cur.full, '92vw')} alt={cur.caption} />}
        <button className="icon-btn nav-r" aria-label="Next" onClick={() => open !== null && show(open + 1)}>
          <svg viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" fill="none"><path d="M6 3l5 5-5 5" /></svg>
        </button>
      </div>
    </>
  );
}
