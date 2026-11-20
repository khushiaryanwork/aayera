import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
const INTRO = { duration: 1.8, tolerance: 10, settle: 0.2 } as const; // settle: quiet time (s) that ends a gesture
const AUTOPLAY = { desktop: 4, mobile: 6, video: 20 } as const; // slides with a video/GIF stay up longer
// a playing video keeps its slide up until the film ends (then the slider moves on); `video` above is only
// the wait for a GIF, or for a video that never starts (autoplay refused, slow network)
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
export default function Hero({ eyebrow, heading, intro, primaryCta, secondaryCta, slides, mosaic }: Props) {
  const count = slides.length;
  const [cur, setCur] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [film, setFilm] = useState<string | null>(null); // full-screen player (phones, "watch" button)
  // slides 2+ and the photo wall are only needed later: load them once the page has finished
  // loading, so the first slide gets all the bandwidth (also when autoplay may start)
  const [restLoaded, setRestLoaded] = useState(false);
  // which moving-media file to use (portrait on phones); decided on the client only
  const [phone, setPhone] = useState(false);
  const [stillOnly, setStillOnly] = useState(false); // reduced motion: keep the photo, skip video/GIF
  // phone / desktop decided (first effect), so the first slide's film can start loading the right file at once
  const [deviceKnown, setDeviceKnown] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA);
    const update = () => setPhone(mq.matches);
    update();
    setDeviceKnown(true);
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
  // set once the current slide's video is actually playing; reset on every slide change
  const [videoPlaying, setVideoPlaying] = useState(false);
  useEffect(() => setVideoPlaying(false), [cur]);
  const onVideoEnded = (v: HTMLVideoElement) => {
    // hovering pauses autoplay, so the film just starts again; otherwise go to the next slide
    if (hovering || count < 2) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else setCur((c) => (c + 1) % count);
  };
  useEffect(() => {
    if (count < 2 || hovering || film || !restLoaded || prefersReducedMotion()) return;
    if (videoPlaying && slides[cur]?.video?.kind === 'video' && !stillOnly) return; // advances on 'ended'
    const delay = slides[cur]?.video && !stillOnly ? AUTOPLAY.video : window.matchMedia(MQ.desktop).matches ? AUTOPLAY.desktop : AUTOPLAY.mobile;
    const next = gsap.delayedCall(delay, () => setCur((c) => (c + 1) % count));
    return () => {
      next.kill();
    };
  }, [cur, hovering, film, count, restLoaded, stillOnly, videoPlaying]);

  /* ---------- videos: only the visible slide plays, from the start (handled in SlideMotion) ---------- */

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
      // slow zoom on photo slides only; a film's thumbnail and video stay still at full size
      const kenBurns = (el: HTMLElement) => {
        const img = el.querySelector('.slide-media:not(.still)');
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
        const img = el.querySelector('.slide-media:not(.still)');
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
      // scaleX / scaleY separately: quickSetter(…, 'scale') throws in WebKit (Safari / every iPhone browser)
      // and the error took the whole hero down there
      const setWallScaleX = gsap.quickSetter(wall, 'scaleX');
      const setWallScaleY = gsap.quickSetter(wall, 'scaleY');
      const setWallScale = (v: number) => {
        setWallScaleX(v);
        setWallScaleY(v);
      };
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
      // The page only unlocks once the gesture that played the intro has stopped: a trackpad / touch flick
      // keeps sending momentum for a second or more, and unlocking mid-flick let that tail scroll the page
      // straight past the photo grid.
      let lastInput = 0;
      let freshGesture = true; // this gesture began after a pause (so it isn't the tail of the one that played the intro)
      const gestureOver = () => performance.now() - lastInput > INTRO.settle * 1000;
      const unlock = () => {
        if (state === 'grid' && !playing) setLock(false);
      };
      // Phones: blocking each touchmove isn't enough. Chrome and Safari stop honouring preventDefault once
      // they have begun a scroll (common while the page is busy, e.g. a video loading). The slider also
      // carries CSS touch-action: none (see global.css), so a swipe on it never starts a native scroll.
      const setLock = (on: boolean) => (on ? intent.enable() : intent.disable());

      // Our own (non-passive) wheel / touch-move listener decides what to block, instead of the Observer
      // blocking everything while active. Blocked: while the slides show, while the intro plays, and the
      // tail (momentum) of the gesture that played it. Never blocked: a new gesture with the grid up, so the
      // first swipe or scroll there moves the page at once. Every raw event counts towards "the gesture
      // has stopped" (the Observer only reports movement past its tolerance, and a momentum tail is many
      // tiny events).
      const onInput = (e: Event) => {
        if (gestureOver()) freshGesture = true;
        lastInput = performance.now();
        if (intent.isEnabled && (state === 'slides' || playing || !freshGesture) && e.cancelable) e.preventDefault();
      };
      // a new touch with nothing playing is always a new gesture
      const onTouchStart = () => {
        if (!playing) freshGesture = true;
      };
      window.addEventListener('wheel', onInput, { passive: false, capture: true });
      window.addEventListener('touchmove', onInput, { passive: false, capture: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
      const intent = Observer.create({
        target: window,
        type: 'wheel,touch',
        wheelSpeed: -1,
        tolerance: INTRO.tolerance,
        lockAxis: true, // sideways swipes stay with the slide swiper
        preventDefault: false, // see onInput
        onStopDelay: INTRO.settle,
        onUp: () => {
          if (state === 'slides') {
            freshGesture = false;
            play('grid', () => gestureOver() && unlock());
          } else if (freshGesture) unlock(); // a new scroll with the grid showing: let the page move at once
        },
        onDown: () => {
          if (state === 'grid') {
            freshGesture = false;
            play('slides');
          }
        },
        onStop: unlock, // the flick has died down: scrolling on now moves the page
      });

      // keyboard scrolling at the top plays the intro too
      const KEYS = ['ArrowDown', 'PageDown', ' ', 'Spacebar'];
      const onKey = (e: KeyboardEvent) => {
        if (!intent.isEnabled || !KEYS.includes(e.key) || (e.target as HTMLElement)?.closest?.('input,textarea,select,button,a')) return;
        e.preventDefault();
        if (state === 'slides') play('grid', () => setLock(false));
        else setLock(false);
      };
      // back at the very top: listen for gestures again (to reverse, or to scroll on)
      // anything that moved the page without a gesture (scrollbar drag, anchor link, restored position) skips straight to the grid
      const onScroll = () => {
        if (atTop()) return setLock(true);
        if (state === 'slides' && !playing) {
          tl.progress(END / tl.duration());
          state = 'grid';
        }
        // away from the top the intro never blocks scrolling (e.g. after another section briefly froze the page)
        if (!playing) setLock(false);
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
        window.removeEventListener('wheel', onInput, { capture: true });
        window.removeEventListener('touchmove', onInput, { capture: true });
        window.removeEventListener('touchstart', onTouchStart, { capture: true });
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
              <div className={'slide' + (i === cur ? ' on' : '') + (s.video?.kind === 'video' ? ' fx' : '')} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`} key={i}>
                {/* phones get the portrait image when one is set; the browser downloads only one of the two */}
                <div className={'slide-media' + (s.video ? ' still' : '')}>
                  {(i === 0 || restLoaded) && (
                    <picture>
                      {s.imageMobile && <source media={MOBILE_MEDIA} srcSet={s.imageMobile.srcset || s.imageMobile.src} sizes={SIZES.full} />}
                      <img {...imgProps(s.image, SIZES.full)} alt={s.image.alt} {...(i ? {} : { fetchPriority: 'high' as const })} />
                    </picture>
                  )}
                  {/* video / GIF: the first slide's starts loading straight away, the others after the page;
                      fades in over the photo once it plays */}
                  {s.video && deviceKnown && (i === 0 || restLoaded) && !stillOnly && !(phone && s.video.phoneMode === 'button') && (
                    <SlideMotion
                      video={s.video}
                      phone={phone}
                      active={i === cur}
                      loop={count < 2}
                      onPlaying={() => i === cur && setVideoPlaying(true)}
                      onEnded={(v) => i === cur && onVideoEnded(v)}
                      onProgress={(f) => i === cur && section.current?.style.setProperty('--film', String(f))}
                    />
                  )}
                </div>
                {s.video?.kind === 'video' && !(phone && s.video.phoneMode === 'button') ? (
                  <FilmCopy
                    slide={s}
                    onWatch={() => setFilm(s.video!.src)} // always the original landscape film, not the phone crop
                  />
                ) : (
                <div className="slide-copy">
                  <p className="eyebrow">{s.tag}</p>
                  <h2>{s.short || s.title}</h2>
                  <p className="meta">{s.meta}</p>
                  {phone && s.video?.phoneMode === 'button' ? (
                    <div className="slide-actions">
                      <button type="button" className="btn btn-gold" onClick={() => setFilm(s.video!.src)}>
                        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>
                        {s.video.watchLabel}
                      </button>
                      {s.cta && <a className="btn btn-ghost" href={s.cta.href}>{s.cta.label}</a>}
                    </div>
                  ) : (
                    s.cta && <a className="btn btn-gold" href={s.cta.href}>{s.cta.label}</a>
                  )}
                </div>
                )}
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
              <button role="tab" key={i} className={s.video?.kind === 'video' ? 'fx-dot' : undefined} aria-label={`Go to slide ${i + 1}: ${s.title}`} aria-current={i === cur} onClick={() => go(i)} />
            ))}
          </div>
        </div>
      </div>
      {film && createPortal(<FilmPlayer src={film} onClose={() => setFilm(null)} />, document.body)}
    </section>
  );
}

/** The film slide's caption: tag, title, place / date chips, a live countdown to the event and two buttons. */
function FilmCopy({ slide, onWatch }: { slide: Props['slides'][number]; onWatch: () => void }) {
  const parts = (slide.meta || '').split(/\s+·\s+/).filter(Boolean);
  // the event date is the part of the meta line that reads as a date, e.g. "3 December 2026"
  const dateIdx = parts.findIndex((p) => /\d{4}/.test(p) && !Number.isNaN(Date.parse(p)));
  const when = dateIdx >= 0 ? new Date(Date.parse(parts[dateIdx])) : null;
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!when) return;
    const tick = () => setLeft(Math.max(0, when.getTime() - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [when?.getTime()]);
  const days = left == null ? null : Math.floor(left / 864e5);
  const title = slide.short || slide.title;
  // the last word takes the gold serif accent, unless the title marks its own with *asterisks*
  const rich = title.includes('*') ? title : title.replace(/(\S+)$/, '*$1*');
  const units = left == null ? null : [
    [Math.floor(left / 864e5), 'Days'],
    [Math.floor(left / 36e5) % 24, 'Hours'],
    [Math.floor(left / 6e4) % 60, 'Min'],
    [Math.floor(left / 1e3) % 60, 'Sec'],
  ] as const;
  return (
    <div className="slide-copy fx-copy">
      <p className="fx-tag"><span className="fx-pulse" aria-hidden="true" />{slide.tag}</p>
      <h2><Rich text={rich} /></h2>
      {/* phones: date, place and days to go on one line, in place of the chips and countdown */}
      <p className="fx-mini">
        {[dateIdx >= 0 ? parts[dateIdx] : '', ...parts.filter((_, k) => k !== dateIdx)].filter(Boolean).join(' · ')}
        {days != null && days > 0 && <em> · {days} days to go</em>}
      </p>
      {parts.length > 0 && (
        <ul className="fx-chips">
          {parts.map((p, k) => (
            <li key={k}>
              {k === dateIdx ? (
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" /></svg>
              ) : (
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14.5s5-4.6 5-8.5a5 5 0 0 0-10 0c0 3.9 5 8.5 5 8.5z" /><circle cx="8" cy="6" r="1.8" /></svg>
              )}
              {p}
            </li>
          ))}
        </ul>
      )}
      <div className="fx-actions">
        {slide.cta && <a className="btn btn-gold" href={slide.cta.href}>{slide.cta.label}</a>}
        <button type="button" className="fx-watch" onClick={onWatch}>
          <span className="fx-play" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M5 3v10l8-5z" /></svg></span>
          <span className="fx-watch-label">Watch the film</span>
        </button>
      </div>
      {units && left! > 0 && (
        <div className="fx-count" role="timer" aria-label={`${units[0][0]} days to go`}>
          <p className="fx-count-label">Countdown to the show</p>
          <div className="fx-count-row">
            {units.map(([n, l], k) => (
              <div key={l} className="fx-unit">
                <b>{String(n).padStart(2, '0')}</b>
                <span>{l}</span>
                {k < 3 && <i aria-hidden="true">:</i>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Full-screen film player: the original landscape film with sound and native controls (phones: real full screen, landscape where allowed). */
function FilmPlayer({ src, onClose }: { src: string; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  // the latest onClose, so the setup below runs once per opening (not on every re-render)
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const onClose = () => close.current();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const v = vid.current;
    v?.play().catch(() => {});
    box.current?.querySelector<HTMLButtonElement>('.film-close')?.focus();
    // phones: go full screen and turn to landscape where the browser allows it (Android); iPhones open
    // their own full-screen player, which turns with the phone. Leaving full screen closes the film.
    const onPhone = window.matchMedia(MOBILE_MEDIA).matches;
    const orient = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void>; unlock?: () => void };
    const onFsChange = () => !document.fullscreenElement && onClose();
    const onIosEnd = () => onClose();
    if (v && onPhone) {
      if (v.requestFullscreen) {
        v.requestFullscreen()
          .then(() => { document.addEventListener('fullscreenchange', onFsChange); return orient?.lock?.('landscape'); })
          .catch(() => {});
      } else {
        const ios = v as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
        v.addEventListener('webkitendfullscreen', onIosEnd);
        try { ios.webkitEnterFullscreen?.(); } catch { /* stays in the in-page player */ }
      }
    }
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
      v?.removeEventListener('webkitendfullscreen', onIosEnd);
      try { orient?.unlock?.(); } catch { /* not supported */ }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);
  return (
    <div className="film-player" ref={box} role="dialog" aria-modal="true" aria-label="Film">
      <video ref={vid} src={src} controls playsInline autoPlay onEnded={onClose} />
      <button type="button" className="film-close" aria-label="Close film" onClick={onClose}>
        <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l10 10M13 3L3 13" /></svg>
      </button>
    </div>
  );
}

/** A slide's moving media: a GIF (plain <img>) or a muted, looping, inline <video>. */
function SlideMotion({ video, phone, active, loop, onPlaying, onEnded, onProgress }: {
  video: NonNullable<Props['slides'][number]['video']>;
  phone: boolean;
  active: boolean;
  loop: boolean;
  onPlaying: () => void;
  onEnded: (v: HTMLVideoElement) => void;
  onProgress?: (fraction: number) => void;
}) {
  const [ready, setReady] = useState(false);
  const src = (phone && video.mobileSrc) || video.src;
  useEffect(() => setReady(false), [src]);
  const ref = useRef<HTMLVideoElement>(null);
  const tryPlay = () => {
    const v = ref.current;
    // muted as attribute and property: mobile browsers only autoplay videos they know are silent
    if (!v || !v.paused) return;
    v.defaultMuted = true;
    v.muted = true;
    v.setAttribute('muted', ''); // React only sets the property; some mobile browsers check the attribute
    v.play().catch(() => {}); // can be refused (e.g. low-power mode); the photo stays visible
  };
  // only the visible slide plays, from the start
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      if (v.readyState > 0) v.currentTime = 0;
      tryPlay();
    } else v.pause();
  }, [active, src]);
  const cls = 'slide-motion' + (ready ? ' ready' : '');
  return video.kind === 'gif' ? (
    <img key={src} className={cls} src={src} alt="" aria-hidden="true" decoding="async" onLoad={() => setReady(true)} />
  ) : (
    <video
      ref={ref}
      key={src}
      className={cls}
      src={src}
      muted
      onCanPlay={() => active && tryPlay()}
      loop={loop}
      playsInline
      preload="auto"
      aria-hidden="true"
      onPlaying={() => {
        setReady(true);
        onPlaying();
      }}
      onEnded={(e) => onEnded(e.currentTarget)}
      onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) onProgress?.(v.currentTime / v.duration); }}
    />
  );
}
