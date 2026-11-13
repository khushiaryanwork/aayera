import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, Observer, EASE, MQ, prefersReducedMotion, requestRefresh } from '../lib/motion/gsap';
import { MOBILE_MEDIA } from '../lib/breakpoints';
import { imgProps, SIZES } from '../lib/img-attrs';
import type { Home } from '../lib/types';
import { Rich, plain } from './Rich';

type Props = Home['hero'];

/** Slider timing (seconds) — identical to the original CSS version. */
/** Horizontal distance (px) a finger must travel before a swipe changes slide. */
const SWIPE_MIN = 40;
/** Slides → photo grid, played by GSAP Observer on one scroll / swipe gesture (seconds). */
const INTRO = { duration: 1.8, tolerance: 10 } as const;
const AUTOPLAY = { desktop: 4, mobile: 6, video: 10 } as const; // slides with a video/GIF stay up longer
const SLIDE = {
  fade: 1.1, // crossfade between slides (CSS `ease`)
  kenBurns: 7, // slow zoom from 108% to 100% (CSS `ease-out`)
  kenBurnsFrom: 1.08,
  copyFade: 0.7, // caption opacity (CSS `ease`)
  copyMove: 0.8, // caption slide-up (site curve)
  copyOffset: 24, // px the caption rises
  copyDelay: 0.35, // first caption line starts after…
  copyStagger: 0.1, // …and each next line this much later
} as const;

/**
 * Scroll choreography, as fractions of the hero's scroll distance:
 * the slider shrinks into the wall over 0–0.68, captions fade in at 0.55–0.8,
 * and the headline + veil rise in at 0.5–0.8.
 */
const ZOOM = { end: 0.68, labels: [0.55, 0.25], title: [0.5, 0.3], uiOffAt: 0.34, overscan: 1.02 } as const;

type Rect = { x: number; y: number; w: number; h: number };

/** Full-screen slider that, on scroll, shrinks into the centre slot of a wall of event photos. */
export default function Hero({ eyebrow, heading, intro, primaryCta, secondaryCta, slideCta, slides, mosaic }: Props) {
  const count = slides.length;
  const [cur, setCur] = useState(0);
  const [hovering, setHovering] = useState(false);
  // slides 2+ and the photo wall are only needed later: load them once the page has finished
  // loading, so the first slide gets all the bandwidth (also when autoplay may start)
  const [restLoaded, setRestLoaded] = useState(false);
  // which moving-media file to use (portrait on phones); decided on the client only
  const [phone, setPhone] = useState(false);
  const [stillOnly, setStillOnly] = useState(false); // reduced motion: keep the photo, skip video/GIF
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA);
    const update = () => setPhone(mq.matches);
    update();
    setStillOnly(prefersReducedMotion());
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const go = (i: number) => {
    setRestLoaded(true);
    setCur(((i % count) + count) % count);
  };

  useEffect(() => {
    let idle = 0;
    const later = () => {
      idle = window.requestIdleCallback ? window.requestIdleCallback(() => setRestLoaded(true), { timeout: 1500 }) : window.setTimeout(() => setRestLoaded(true), 200);
    };
    if (document.readyState === 'complete') later();
    else window.addEventListener('load', later, { once: true });
    return () => {
      window.removeEventListener('load', later);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  const section = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const mosaicEl = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const ui = useRef<HTMLDivElement>(null);

  /* ---------- swipe (touch): GSAP Observer, one slide per gesture ---------- */
  useEffect(() => {
    if (count < 2) return;
    let used = false; // a long drag passes the tolerance several times; only the first counts
    const step = (dir: 1 | -1) => {
      if (used) return;
      used = true;
      setRestLoaded(true);
      setCur((c) => (c + dir + count) % count);
    };
    const obs = Observer.create({
      target: sticky.current!,
      type: 'touch', // mouse users have the arrows, dots and keyboard, as before
      lockAxis: true, // a vertical scroll that drifts sideways never changes slide
      tolerance: SWIPE_MIN,
      preventDefault: false, // vertical scrolling keeps working (CSS touch-action: pan-y)
      onPress: () => (used = false),
      onLeft: () => step(1),
      onRight: () => step(-1),
    });
    return () => obs.kill();
  }, [count]);

  /* ---------- autoplay: restarts on every slide change, paused on hover / reduced motion ---------- */
  useEffect(() => {
    if (count < 2 || hovering || !restLoaded || prefersReducedMotion()) return;
    const delay = slides[cur]?.video && !stillOnly ? AUTOPLAY.video : window.matchMedia(MQ.desktop).matches ? AUTOPLAY.desktop : AUTOPLAY.mobile;
    const next = gsap.delayedCall(delay, () => setCur((c) => (c + 1) % count));
    return () => {
      next.kill();
    };
  }, [cur, hovering, count, restLoaded, stillOnly]);

  /* ---------- videos: only the visible slide plays, from the start ---------- */
  useEffect(() => {
    section.current?.querySelectorAll<HTMLVideoElement>('.slide video').forEach((v) => {
      if (v.closest('.slide')?.classList.contains('on')) {
        v.currentTime = 0;
        v.play().catch(() => {}); // autoplay can be refused (e.g. low-power mode); the photo stays visible
      } else v.pause();
    });
  }, [cur, restLoaded, phone]);

  /* ---------- slide change: crossfade, Ken Burns zoom, caption stagger ---------- */
  const firstRun = useRef(true);
  useGSAP(
    () => {
      const els = gsap.utils.toArray<HTMLElement>('.slide', section.current);
      const active = els[cur];
      if (!active) return;
      const others = els.filter((el) => el !== active);
      const reduce = prefersReducedMotion();
      const t = (seconds: number) => (reduce ? 0 : seconds);
      const captionOf = (el: HTMLElement) => el.querySelectorAll<HTMLElement>('.slide-copy > *');
      const kenBurns = (el: HTMLElement) => {
        const img = el.querySelector('.slide-media');
        if (img) gsap.fromTo(img, { scale: SLIDE.kenBurnsFrom }, { scale: 1, duration: t(SLIDE.kenBurns), ease: EASE.cssOut, overwrite: true });
      };

      // first render: the server already shows slide 1 with its caption, so only start the zoom
      if (firstRun.current) {
        firstRun.current = false;
        gsap.set(others, { autoAlpha: 0 });
        others.forEach((el) => gsap.set(captionOf(el), { opacity: 0, y: SLIDE.copyOffset }));
        kenBurns(active);
        return;
      }

      // crossfade
      gsap.to(others, { autoAlpha: 0, duration: t(SLIDE.fade), ease: EASE.css, overwrite: 'auto' });
      gsap.to(active, { autoAlpha: 1, duration: t(SLIDE.fade), ease: EASE.css, overwrite: 'auto' });

      // outgoing slides: photo resets to its start zoom, caption drops away (no delay)
      others.forEach((el) => {
        const img = el.querySelector('.slide-media');
        if (img) {
          gsap.killTweensOf(img);
          gsap.set(img, { scale: SLIDE.kenBurnsFrom });
        }
        const caption = captionOf(el);
        gsap.to(caption, { opacity: 0, duration: t(SLIDE.copyFade), ease: EASE.css, overwrite: 'auto' });
        gsap.to(caption, { y: SLIDE.copyOffset, duration: t(SLIDE.copyMove), ease: EASE.out, overwrite: 'auto' });
      });

      // incoming slide: zoom + caption lines rise in one after another
      kenBurns(active);
      const caption = captionOf(active);
      const delay = (i: number) => (reduce ? 0 : SLIDE.copyDelay + i * SLIDE.copyStagger);
      gsap.to(caption, { opacity: 1, duration: t(SLIDE.copyFade), ease: EASE.css, delay, overwrite: 'auto' });
      gsap.to(caption, { y: 0, duration: t(SLIDE.copyMove), ease: EASE.out, delay, overwrite: 'auto' });
    },
    { scope: section, dependencies: [cur] },
  );

  /* ---------- the slider zooms out into the wall, then the headline rises in ----------
     Same timeline as before; GSAP Observer plays it on the first scroll / swipe down at the top of the
     page (and back in reverse on scroll up at the top), instead of tying it to the scrollbar. */
  useGSAP(
    () => {
      const wall = mosaicEl.current!, frameEl = frame.current!;
      const rect: Rect = { x: 0, y: 0, w: 1, h: 1 };
      const measure = () => {
        const s = slot.current!;
        Object.assign(rect, { x: s.offsetLeft, y: s.offsetTop, w: s.offsetWidth || 1, h: s.offsetHeight || 1 });
        gsap.set(wall, { transformOrigin: `${rect.x + rect.w / 2}px ${rect.y + rect.h / 2}px` });
      };

      // per-frame writes go through quickSetter (no tween objects created on scroll)
      const setWallScale = gsap.quickSetter(wall, 'scale');
      const setWallAlpha = gsap.quickSetter(wall, 'opacity');
      const setFrame = {
        x: gsap.quickSetter(frameEl, 'x', 'px'),
        y: gsap.quickSetter(frameEl, 'y', 'px'),
        w: gsap.quickSetter(frameEl, 'width', 'px'),
        h: gsap.quickSetter(frameEl, 'height', 'px'),
        r: gsap.quickSetter(frameEl, 'borderRadius', 'px'),
      };
      const setUi = gsap.quickSetter(sticky.current!, '--ui');

      // zoom = eased 0→1. The frame follows the zoomed slot but stays clipped to the screen,
      // so the slide text and dots are always inside the visible area.
      const zoom = { p: 0 };
      const render = () => {
        const vw = window.innerWidth, vh = window.innerHeight, e = zoom.p;
        const start = Math.max(vw / rect.w, vh / rect.h) * ZOOM.overscan;
        const scale = start + (1 - start) * e;
        const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2, fw = rect.w * scale, fh = rect.h * scale;
        const left = Math.max(0, cx - fw / 2), top = Math.max(0, cy - fh / 2);
        setWallScale(scale);
        setWallAlpha(Math.min(1, e * 3));
        setFrame.x(left);
        setFrame.y(top);
        setFrame.w(Math.min(vw, cx + fw / 2) - left);
        setFrame.h(Math.min(vh, cy + fh / 2) - top);
        setFrame.r(16 * e);
        setUi(1 - Math.min(1, e * 3));
        ui.current!.classList.toggle('off', e > ZOOM.uiOffAt);
      };

      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.none } });
      tl.to(zoom, { p: 1, duration: ZOOM.end, ease: EASE.inOut, onUpdate: render }, 0)
        .fromTo(wall, { '--lbl': 0 }, { '--lbl': 1, duration: ZOOM.labels[1] }, ZOOM.labels[0])
        .fromTo(veil.current!, { opacity: 0 }, { opacity: 1, duration: ZOOM.title[1] }, ZOOM.title[0])
        .fromTo(
          title.current!,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: ZOOM.title[1],
            onUpdate() {
              title.current!.classList.toggle('live', this.progress() > 0.5);
            },
          },
          ZOOM.title[0],
        )
        .to({}, { duration: 1 - (ZOOM.title[0] + ZOOM.title[1]) }); // keeps the original timing proportions
      const END = ZOOM.title[0] + ZOOM.title[1]; // the headline is fully in: nothing changes after this

      /* playback */
      const reduce = prefersReducedMotion();
      let state: 'slides' | 'grid' = 'slides';
      let playing = false;
      const play = (to: 'slides' | 'grid', onDone?: () => void) => {
        if (playing || state === to) return;
        playing = true;
        tl.tweenTo(to === 'grid' ? END : 0, {
          duration: reduce ? 0.01 : INTRO.duration,
          ease: EASE.none, // the zoom keeps its own inOut ease inside the timeline
          onComplete: () => {
            state = to;
            playing = false;
            onDone?.();
          },
        });
      };
      const atTop = () => window.scrollY <= 1;

      // While active, the page can't scroll: gestures drive the intro instead.
      // wheelSpeed -1 makes "wheel down" and "finger moves up" both report onUp (= forward).
      const intent = Observer.create({
        target: window,
        type: 'wheel,touch',
        wheelSpeed: -1,
        tolerance: INTRO.tolerance,
        lockAxis: true, // sideways swipes stay with the slide swiper
        preventDefault: true,
        onUp: () => (state === 'slides' ? play('grid', () => intent.disable()) : intent.disable()),
        onDown: () => {
          if (state === 'grid') play('slides');
        },
      });

      // keyboard scrolling at the top plays the intro too
      const KEYS = ['ArrowDown', 'PageDown', ' ', 'Spacebar'];
      const onKey = (e: KeyboardEvent) => {
        if (!intent.isEnabled || !KEYS.includes(e.key) || (e.target as HTMLElement)?.closest?.('input,textarea,select,button,a')) return;
        e.preventDefault();
        if (state === 'slides') play('grid', () => intent.disable());
        else intent.disable();
      };
      // back at the very top: listen for gestures again (to reverse, or to scroll on)
      // anything that moved the page without a gesture (scrollbar drag, anchor link, restored position) skips straight to the grid
      const onScroll = () => {
        if (atTop()) intent.enable();
        else if (state === 'slides' && !playing) {
          tl.progress(END / tl.duration());
          state = 'grid';
          intent.disable();
        }
      };
      const onResize = () => {
        measure();
        render();
      };
      window.addEventListener('keydown', onKey);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);

      measure();
      render();
      if (!atTop()) onScroll(); // page opened part-way down (refresh, back button)
      requestRefresh(); // the hero is one screen tall now: let the sections below re-measure

      return () => {
        intent.kill();
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
      };
    },
    { scope: section },
  );

  // 15 cells: the centre one (index 7, in both the 5×3 and 3×5 grids) is the empty slot the slider lands in
  const cells = Array.from({ length: 15 }, (_, i) => (i === 7 ? null : mosaic[i < 7 ? i : i - 1]));

  return (
    <section className="hero" id="top" aria-roledescription="carousel" aria-label="Event highlights" ref={section}>
      <div
        className="hero-sticky"
        ref={sticky}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(cur - 1);
          if (e.key === 'ArrowRight') go(cur + 1);
        }}
      >
        <div className="mosaic" ref={mosaicEl} aria-hidden="true">
          {cells.map((m, i) =>
            m === null ? (
              <figure className="slot" key={i} ref={slot} />
            ) : m ? (
              <figure key={i}>
                {restLoaded && <img {...imgProps(m.image, SIZES.mosaic)} alt="" decoding="async" />}
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
              <div className={'slide' + (i === cur ? ' on' : '')} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`} key={i}>
                {/* phones get the portrait image when one is set; the browser downloads only one of the two */}
                <div className="slide-media">
                  {(i === 0 || restLoaded) && (
                    <picture>
                      {s.imageMobile && <source media={MOBILE_MEDIA} srcSet={s.imageMobile.srcset || s.imageMobile.src} sizes={SIZES.full} />}
                      <img {...imgProps(s.image, SIZES.full)} alt={s.image.alt} {...(i ? {} : { fetchPriority: 'high' as const })} />
                    </picture>
                  )}
                  {/* video / GIF: loads after the page, fades in over the photo once it can play */}
                  {s.video && restLoaded && !stillOnly && <SlideMotion video={s.video} phone={phone} />}
                </div>
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
          {intro && <p className="hero-intro">{intro}</p>}
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

/** A slide's moving media: a GIF (plain <img>) or a muted, looping, inline <video>. */
function SlideMotion({ video, phone }: { video: NonNullable<Props['slides'][number]['video']>; phone: boolean }) {
  const [ready, setReady] = useState(false);
  const src = (phone && video.mobileSrc) || video.src;
  useEffect(() => setReady(false), [src]);
  const cls = 'slide-motion' + (ready ? ' ready' : '');
  return video.kind === 'gif' ? (
    <img key={src} className={cls} src={src} alt="" aria-hidden="true" decoding="async" onLoad={() => setReady(true)} />
  ) : (
    <video key={src} className={cls} src={src} muted loop playsInline preload="auto" aria-hidden="true" onPlaying={() => setReady(true)} />
  );
}
