import { useState } from 'react';
import type { Industry } from '../lib/types';

/** Accordion of industry panels: hover (on hover devices), click or focus opens one. */
export default function Industries({ items }: { items: Industry[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="ind-row">
      {items.map((d, i) => (
        <article
          key={i}
          className={'ind' + (i === open ? ' open' : '')}
          tabIndex={0}
          onMouseEnter={() => matchMedia('(hover:hover)').matches && setOpen(i)}
          onClick={() => setOpen(i)}
          onFocus={() => setOpen(i)}
        >
          {d.image && <img src={d.image.src} alt="" loading="lazy" />}
          <div className="ind-txt">
            <h3>{d.name}</h3>
            <p>{d.text}</p>
            <span className="count">{d.count}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
