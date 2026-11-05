/**
 * Loads all page content at build time.
 * Sanity is the source of truth; any field that is empty in Sanity (or if Sanity is
 * unreachable) falls back to src/content/defaults.json, which mirrors the original site.
 */
import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import defaults from '../content/defaults.json';
import { projectId, dataset, apiVersion } from '../../sanity/env.mjs';
import type { Home, Img, Site, EventCard, WallTile, Logo, MosaicTile } from './types';

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
  token: import.meta.env.SANITY_READ_TOKEN || undefined, // only needed if the dataset is private
});
const builder = createImageUrlBuilder({ projectId, dataset });

const QUERY = /* groq */ `{
  "settings": *[_id == "siteSettings"][0]{
    title, description, shareImage, searchVisibility, logo, nav, navCta, email, phones, address
  },
  "home": *[_id == "home"][0]{
    ...,
    "eventsSection": eventsSection{ ..., "events": events[]->{ title, sector, city, location, startDate, endDate, displayDate, image, cardImage } },
    "clientsSection": clientsSection{ ..., "clients": clients[]->{ name, logo, plainLogo } }
  },
  "allEvents": *[_type == "event" && !(_id in path("drafts.**"))] | order(startDate desc){ title, sector, city, location, startDate, endDate, displayDate, image, cardImage },
  "allClients": *[_type == "client" && !(_id in path("drafts.**"))] | order(name asc){ name, logo, plainLogo }
}`;

/* ---------- helpers ---------- */
const has = (v: unknown) =>
  v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
const pick = <T,>(cms: any, def: T): T => (has(cms) ? cms : def);

function img(v: any, width: number, fallbackAlt = ''): Img | null {
  if (!v) return null;
  if (typeof v === 'string') return { src: v, alt: fallbackAlt };
  if (v.src) return { src: v.src, alt: v.alt ?? fallbackAlt };
  if (v.asset) {
    return {
      src: builder.image(v).width(width).fit('max').auto('format').quality(78).url(),
      alt: v.alt ?? fallbackAlt,
    };
  }
  return null;
}
const imgOr = (v: any, def: any, width: number, alt = '') => img(v, width, alt) ?? img(def, width, alt);

const SECTOR: Record<string, string> = { energy: 'Energy', mobility: 'Mobility', health: 'Healthcare', tech: 'Technology' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dateRange(start?: string, end?: string) {
  if (!start) return '';
  const [y1, m1, d1] = start.split('-').map(Number);
  if (!end || end === start) return `${d1} ${MONTHS[m1 - 1]} ${y1}`;
  const [y2, m2, d2] = end.split('-').map(Number);
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} ${MONTHS[m1 - 1]} ${y1}`;
  if (y1 === y2) return `${d1} ${MONTHS[m1 - 1]} – ${d2} ${MONTHS[m2 - 1]} ${y1}`;
  return `${d1} ${MONTHS[m1 - 1]} ${y1} – ${d2} ${MONTHS[m2 - 1]} ${y2}`;
}
function cityOf(e: any) {
  if (e.city) return e.city;
  const parts = String(e.location || '').split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length >= 3 ? parts[parts.length - 2] : parts[0] || '';
}
// bundled card photos for the known events, matched by start date, used until a Card photo is uploaded
const LOCAL_CARD: Record<string, any> = Object.fromEntries(defaults.home.events.items.map((e) => [e.startDate, e.cardImage]));
const cardSource = (e: any) => e.cardImage ?? LOCAL_CARD[e.startDate] ?? e.image;

function toEventCard(e: any): EventCard {
  const date = e.displayDate || dateRange(e.startDate, e.endDate);
  return {
    image: img(cardSource(e), 1400, e.title) as Img,
    tag: SECTOR[e.sector] || e.sector || '',
    title: e.title,
    meta: [date, cityOf(e)].filter(Boolean).join(' · '),
  };
}
function formatAddress(a: any) {
  if (!a) return '';
  if (typeof a === 'string') return a;
  return [a.street, a.area, [a.city, a.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

/* ---------- main ---------- */
export async function getContent(): Promise<{ site: Site; home: Home; noindex: boolean }> {
  let data: any = {};
  try {
    // SANITY_CONTENT_FILE: build from a saved query result instead of the API (offline builds / tests)
    const file = process.env.SANITY_CONTENT_FILE;
    data = file
      ? JSON.parse((await import('node:fs')).readFileSync(file, 'utf8')).result
      : await client.fetch(QUERY);
  } catch (err) {
    console.warn('[content] Sanity fetch failed, using bundled defaults:', (err as Error).message);
  }
  const s = data.settings || {};
  const h = data.home || {};
  const D = defaults.settings;
  const DH = defaults.home;

  const site: Site = {
    title: pick(s.title, D.title),
    description: pick(s.description, D.description),
    shareImage: img(s.shareImage, 1200)?.src ?? null,
    logo: imgOr(s.logo, D.logo, 400, 'Aayera') as Img,
    nav: pick(s.nav, D.nav),
    navCta: has(s.navCta?.label) ? s.navCta : D.navCta,
    email: pick(s.email, D.email),
    phones: pick(s.phones, D.phones),
    address: pick(formatAddress(s.address), D.address),
  };

  /* hero */
  const hh = h.hero || {};
  const slides = has(hh.slides)
    ? hh.slides.map((x: any) => ({ image: img(x.image, 2400) as Img, tag: x.tag || '', title: x.title || '', short: x.short, meta: x.meta || '' }))
    : DH.hero.slides.map((x) => ({ ...x, image: img(x.image, 2400) as Img }));

  /* events */
  const es = h.eventsSection || {};
  const eventSource = has(es.events) ? es.events : has(data.allEvents) ? data.allEvents : DH.events.items;
  const events = eventSource.filter(Boolean).map(toEventCard);

  /* photo wall */
  const mo = h.moments || {};
  const tiles: WallTile[] = (has(mo.tiles) ? mo.tiles : DH.moments.tiles).map((t: any) => ({
    image: img(t.image, 1000, t.caption) as Img,
    full: (img(t.image, 2200) as Img).src,
    ratio: t.ratio || '4/5',
    caption: t.caption || '',
  }));

  /* hero wall (14 tiles around the centre slot): explicit list, or events interleaved with wall photos */
  let mosaic: MosaicTile[];
  if (has(hh.mosaic)) {
    mosaic = hh.mosaic.map((m: any) => ({ image: img(m.image, 800) as Img, caption: m.caption || '' }));
  } else {
    const pickIdx = tiles.length >= 12 ? [0, 3, 1, 9, 10, 11, 7] : tiles.map((_, i) => i);
    const picks = pickIdx.map((i) => tiles[i]).filter(Boolean);
    const evTiles = eventSource.filter(Boolean).map((e: any) => ({ image: img(cardSource(e), 800) as Img, caption: e.title }));
    mosaic = [];
    for (let i = 0; mosaic.length < 14 && (i < evTiles.length || i < picks.length); i++) {
      if (evTiles[i]) mosaic.push(evTiles[i]);
      if (picks[i] && mosaic.length < 14) mosaic.push({ image: { src: picks[i].image.src.replace(/w=\d+/, 'w=800'), alt: '' }, caption: picks[i].caption });
    }
  }

  /* clients */
  const cs = h.clientsSection || {};
  const clientSource = has(cs.clients) ? cs.clients : data.allClients;
  const logos: Logo[] = has(clientSource)
    ? clientSource.filter((c: any) => c?.logo).map((c: any) => ({ src: (img(c.logo, 460) as Img).src, alt: c.name || 'Client logo', plain: !!c.plainLogo }))
    : DH.clients.logos.map((n) => ({ src: `/assets/clients/${n}.png`, alt: 'Client logo', plain: false }));

  const st = h.statement || {};
  const ind = h.industries || {};
  const cta = h.cta || {};

  const home: Home = {
    hero: {
      eyebrow: pick(hh.eyebrow, DH.hero.eyebrow),
      heading: pick(hh.heading, DH.hero.heading),
      primaryCta: has(hh.primaryCta?.label) ? hh.primaryCta : DH.hero.primaryCta,
      secondaryCta: has(hh.secondaryCta?.label) ? hh.secondaryCta : DH.hero.secondaryCta,
      slideCta: has(hh.slideCta?.label) ? hh.slideCta : DH.hero.slideCta,
      slides,
      mosaic,
    },
    marquee: pick(h.marquee, DH.marquee),
    events: { heading: pick(es.heading, DH.events.heading), intro: pick(es.intro, DH.events.intro), items: events },
    statement: { image: imgOr(st.image, DH.statement.image, 2400, DH.statement.image.alt), words: pick(st.words, DH.statement.words) },
    stats: (has(h.stats) ? h.stats : DH.stats).map((x: any) => ({ value: Number(x.value) || 0, suffix: x.suffix || '', label: x.label || '', image: img(x.image, 1000) })),
    moments: { eyebrow: pick(mo.eyebrow, DH.moments.eyebrow), heading: pick(mo.heading, DH.moments.heading), tiles },
    industries: {
      eyebrow: pick(ind.eyebrow, DH.industries.eyebrow),
      heading: pick(ind.heading, DH.industries.heading),
      items: (has(ind.items) ? ind.items : DH.industries.items).map((x: any) => ({ name: x.name || '', text: x.text || '', count: x.count || '', image: img(x.image, 1600) })),
    },
    filmstrip: has(h.filmstrip)
      ? h.filmstrip.map((x: any) => img(x, 600)).filter(Boolean)
      : DH.filmstrip.map((id) => ({ src: `/assets/img/07-sliding-rows/${id}.jpg`, alt: '' })),
    clients: { eyebrow: pick(cs.eyebrow, DH.clients.eyebrow), heading: pick(cs.heading, DH.clients.heading), intro: pick(cs.intro, DH.clients.intro), logos },
    cta: {
      eyebrow: pick(cta.eyebrow, DH.cta.eyebrow),
      heading: pick(cta.heading, DH.cta.heading),
      image: imgOr(cta.image, DH.cta.image, 2400),
      buttons: pick(cta.buttons, DH.cta.buttons as any),
    },
  };

  return { site, home, noindex: s.searchVisibility === 'hidden' };
}
