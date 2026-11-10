import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, EASE, MQ } from '../lib/motion/gsap';
import { imgProps, SIZES } from '../lib/img-attrs';
import type { Stat } from '../lib/types';

const COUNT_DURATION = 1.4;

/** Four numbers over photos; each counts up the first time it scrolls into view. */
export default function Stats({ items }: { items: Stat[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // numbers are pre-rendered for SEO / no-JS; only animate them when motion is welcome
      gsap.matchMedia().add(MQ.motion, () => {
        gsap.utils.toArray<HTMLElement>('.stat b .v', root.current).forEach((el) => {
          const target = Number(el.dataset.n) || 0;
          const counter = { v: 0 };
          el.textContent = '0';
          gsap.to(counter, {
            v: target,
            duration: COUNT_DURATION,
            ease: EASE.count,
            snap: { v: 1 },
            onUpdate: () => {
              el.textContent = String(counter.v);
            },
            scrollTrigger: { trigger: el, start: 'top 80%', once: true },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section className="stats" aria-label="Aayera in numbers" id="stats" ref={root}>
      {items.map((s, i) => (
        <div className="stat" key={i}>
          {s.image && <img {...imgProps(s.image, SIZES.quarter)} alt="" loading="lazy" decoding="async" />}
          <b><span className="v" data-n={s.value}>{s.value}</span><sup>{s.suffix}</sup></b>
          <span>{s.label}</span>
        </div>
      ))}
    </section>
  );
}
