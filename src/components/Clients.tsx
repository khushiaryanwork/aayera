import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, EASE, MQ } from '../lib/motion/gsap';
import { createLoop } from '../lib/motion/loop';
import type { Home } from '../lib/types';
import { Rich } from './Rich';

/** Base speed of each row in px/s; rows alternate direction. */
const ROW_SPEEDS = [38, 30, 46];
/** Track contents are repeated so the loop never shows a gap. */
const COPIES = 4;
const HOVER_SPEED = 0.12; // a hovered row slows to 12%
const MAX_BOOST = 8; // fastest multiplier while scrolling quickly
const SHEEN = { cycle: 7, sweep: 0.28, step: 0.55 } as const; // logo highlight: every 7s, staggered

/** Three marquee rows of client logos: alternate directions, scrolling speeds them up, hover slows a row. */
export default function Clients({ eyebrow, heading, intro, logos }: Home['clients']) {
  const root = useRef<HTMLElement>(null);
  const countEl = useRef<HTMLSpanElement>(null);
  const [copies, setCopies] = useState(COPIES);
  const rows: (typeof logos)[] = [[], [], []];
  logos.forEach((l, i) => rows[i % 3].push(l));

  useGSAP(
    () => {
      const section = root.current!;
      const rowEls = gsap.utils.toArray<HTMLElement>('.lrow', section);
      const mm = gsap.matchMedia();

      mm.add(MQ.reduce, () => {
        setCopies(1); // a single static, wrapping set of logos (see .ltrack in global.css)
        gsap.set(rowEls, { autoAlpha: 1, x: 0 });
      });

      mm.add(MQ.motion, () => {
        /* entrance: rows slide in from alternating sides, counter counts up */
        const counter = { v: 0 };
        countEl.current!.textContent = '0';
        gsap
          .timeline({ scrollTrigger: { trigger: section, start: 'top 85%', once: true } })
          // fade (1.1s, CSS ease) and slide (1.4s, site curve) run together, 0.12s apart per row
          .fromTo(rowEls, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.1, ease: EASE.css, stagger: 0.12 }, 0)
          .fromTo(rowEls, { x: (i) => (i === 1 ? 80 : -80) }, { x: 0, duration: 1.4, ease: EASE.out, stagger: 0.12 }, 0)
          .to(counter, {
            v: logos.length,
            duration: 1.6,
            ease: EASE.count,
            snap: { v: 1 },
            onUpdate: () => {
              countEl.current!.textContent = String(counter.v);
            },
          }, 0);

        /* endless rows; each row's speed = hover factor × scroll boost */
        const cleanups: (() => void)[] = [];
        const loops = rowEls.map((row, i) => {
          const track = row.firstElementChild as HTMLElement;
          const tween = createLoop(track, COPIES, { speed: ROW_SPEEDS[i] ?? 38, reversed: i % 2 === 1, startProgress: Math.random() });
          const speed = { hover: 1 };
          const slow = () => gsap.to(speed, { hover: HOVER_SPEED, duration: 0.6, ease: EASE.out, overwrite: true });
          const resume = () => gsap.to(speed, { hover: 1, duration: 0.6, ease: EASE.out, overwrite: true });
          row.addEventListener('mouseenter', slow);
          row.addEventListener('mouseleave', resume);
          cleanups.push(() => {
            row.removeEventListener('mouseenter', slow);
            row.removeEventListener('mouseleave', resume);
          });
          return { tween, speed };
        });

        const boost = { v: 1 };
        const applySpeed = () => loops.forEach(({ tween, speed }) => tween.timeScale(speed.hover * boost.v));
        gsap.ticker.add(applySpeed);

        // scrolling quickly speeds the rows up, then they glide back to normal
        ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            const v = Math.min(MAX_BOOST, 1 + Math.abs(self.getVelocity()) / 300);
            if (v > boost.v) gsap.to(boost, { v, duration: 0.2, overwrite: true, onComplete: () => void gsap.to(boost, { v: 1, duration: 1.2, ease: EASE.out }) });
          },
          // only run the loops while the section is on screen
          onToggle: (self) => loops.forEach(({ tween }) => (self.isActive ? tween.play() : tween.pause())),
        });

        /* gold sheen sweeping across each logo, staggered */
        gsap.utils.toArray<HTMLElement>('.lcard', section).forEach((card, i) => {
          gsap.fromTo(
            card,
            { '--sheen': '-130%' },
            {
              '--sheen': '130%',
              duration: SHEEN.cycle * SHEEN.sweep,
              ease: 'sine.inOut',
              repeat: -1,
              repeatDelay: SHEEN.cycle * (1 - SHEEN.sweep),
              delay: (i * SHEEN.step) % SHEEN.cycle,
            },
          );
        });

        return () => {
          gsap.ticker.remove(applySpeed);
          cleanups.forEach((fn) => fn());
        };
      });
    },
    // rebuild if the number of logos changes; copies only drops to 1 for reduced motion
    { scope: root, dependencies: [logos.length, copies], revertOnUpdate: true },
  );

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
                  <div className={'lcard' + (l.plain ? ' plain' : '')} key={`${c}-${j}`}>
                    <img src={l.src} alt={c === 0 ? l.alt : ''} aria-hidden={c > 0 || undefined} loading="lazy" />
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
