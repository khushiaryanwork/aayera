/**
 * Loads all page content at build time.
 * Sanity is the source of truth; any field that is empty in Sanity (or if Sanity is
 * unreachable) falls back to src/content/defaults.json, which mirrors the original site.
 */
import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { optimiseImages, widthsFor, LARGE_MIN_WIDTH } from './images';
import defaults from '../content/defaults.json';
import pageDefaults from '../content/pages.json';
import { projectId, dataset, apiVersion } from '../../sanity/env.mjs';
import type { Home, Img, SlideVideo, Site, EventCard, EventItem, WallTile, Logo, MosaicTile, Page, Section, Vertical, IndustryTile, Platform, Head, FooterCol, Link } from './types';

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
  "header": *[_id == "header"][0],
  "footer": *[_id == "footer"][0],
  "settings": *[_id == "siteSettings"][0]{
    title, description, shareImage, searchVisibility, logo, nav, navCta, email, phones, address, hours, mapQuery, enquiryTopics, announcementOn, announcement, socials, floatingSocials
  },
  "home": *[_id == "home"][0]{
    ...,
    "eventsSection": eventsSection{ ..., "events": events[]->{ title, sector, badge, city, location, startDate, endDate, displayDate, image, cardImage } },
    "platformsHead": platformsHead{ ..., "cards": cards[]->{ ..., "key": slug.current } },
    "industriesHead": industriesHead{ ..., "cards": cards[]->{ name, text } },
    "verticalsHead": verticalsHead{ ..., "cards": cards[]->{ ..., "key": slug.current } },
    "clientsSection": clientsSection{ ..., "clients": clients[]->{ name, logo, plainLogo } }
  },
  "allEvents": *[_type == "event" && !(_id in path("drafts.**"))] | order(startDate desc){ title, sector, city, location, startDate, endDate, displayDate, image, cardImage, summary, website },
  "pages": *[_type == "page" && defined(slug.current) && !(_id in path("drafts.**"))]{ ..., "slug": slug.current, "sections": sections[]{ ..., "cards": select(_type in ["verticalsSection", "industriesSection", "platformsSection"] => cards[]->{ ..., "key": slug.current }, cards), "upcoming": upcoming[]->{ title, sector, city, location, startDate, endDate, displayDate, image, cardImage, summary, website }, "past": past[]->{ title, sector, city, location, startDate, endDate, displayDate, image, cardImage, summary, website } } },
  "verticals": *[_type == "vertical" && !(_id in path("drafts.**"))] | order(order asc, name asc){ ..., "key": slug.current },
  "industries": *[_type == "industry" && !(_id in path("drafts.**"))] | order(order asc, name asc){ name, text },
  "platforms": *[_type == "platform" && !(_id in path("drafts.**"))] | order(order asc, name asc){ ..., "key": slug.current },
  "allClients": *[_type == "client" && !(_id in path("drafts.**"))] | order(name asc){ name, logo, plainLogo }
}`;

/* ---------- helpers ---------- */
const has = (v: unknown) =>
  v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
const pick = <T,>(cms: any, def: T): T => (has(cms) ? cms : def);

/** Natural size from a Sanity asset id like "image-<hash>-1920x500-jpg". */
const sanityDims = (ref: string): [number, number] | null => {
  const m = /-(\d+)x(\d+)-\w+$/.exec(ref || '');
  return m ? [Number(m[1]), Number(m[2])] : null;
};

/**
 * Normalise any image value (bundled path, defaults object or Sanity image) to an Img.
 * `width` is the widest the image is ever displayed; bundled images get their srcset later
 * (lib/images.ts), Sanity images get a CDN srcset here.
 */
function img(v: any, width: number, fallbackAlt = ''): Img | null {
  if (!v) return null;
  if (typeof v === 'string') return { src: v, alt: fallbackAlt, w: width };
  if (v.src) return { src: v.src, alt: v.alt ?? fallbackAlt, w: width, ...(v.position ? { pos: v.position } : {}) };
  if (v.asset) {
    const h = v.hotspot;
    const q = width >= LARGE_MIN_WIDTH ? 85 : 78; // full-screen images get lighter compression
    const url = (w: number) => builder.image(v).width(w).fit('max').auto('format').quality(q).url();
    const dims = sanityDims(v.asset._ref);
    const widths = widthsFor(dims?.[0] ?? width, width);
    const largest = widths[widths.length - 1];
    return {
      src: url(largest),
      srcset: widths.map((w) => `${url(w)} ${w}w`).join(', '),
      ...(dims ? { width: largest, height: Math.round((dims[1] / dims[0]) * largest) } : {}),
      alt: v.alt ?? fallbackAlt,
      ...(h && typeof h.x === 'number' ? { pos: `${Math.round(h.x * 100)}% ${Math.round(h.y * 100)}%` } : {}),
    };
  }
  return null;
}
const imgOr = (v: any, def: any, width: number, alt = '') => img(v, width, alt) ?? img(def, width, alt);

/** CDN URL of an uploaded Sanity file (ref looks like "file-<id>-<ext>"). */
function fileUrl(f: any): string {
  const ref: string | undefined = f?.asset?._ref;
  if (!ref) return '';
  const [, id, ext] = ref.match(/^file-(.+)-([a-z0-9]+)$/i) || [];
  return id ? `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${ext}` : '';
}

/** A slide's video (or GIF) when the editor chose "Video" as its media type. */
function slideVideo(x: any): SlideVideo | null {
  if (x?.mediaType !== 'video') return null;
  const src = fileUrl(x.video);
  if (!src) return null;
  const mobileSrc = fileUrl(x.videoMobile) || undefined;
  return { kind: /\.gif$/i.test(src) ? 'gif' : 'video', src, mobileSrc };
}

/** Portrait hero images are requested at this width from Sanity (≈ a 390pt phone at 3×). */
const MOBILE_WIDTH = 1170;

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
  const upcoming = (e.endDate || e.startDate || '') >= new Date().toISOString().slice(0, 10);
  return {
    image: img(cardSource(e), 1400, e.title) as Img,
    // label before the category: typed in Sanity, or "Upcoming" automatically until the event has passed
    tag: [e.badge ?? (upcoming ? 'Upcoming' : ''), SECTOR[e.sector] || e.sector || ''].filter(Boolean).join(' · '),
    title: e.title,
    meta: [date, cityOf(e)].filter(Boolean).join(' · '),
    upcoming,
  };
}
/** Footer link columns: as set in Home → Contact & footer, or built from the menu
 *  (one column per menu group with sub-pages; single links and the header button under "Explore"). */
function footerColumns(cms: any, site: Site): FooterCol[] {
  const cols = (cms || [])
    .map((c: any) => ({ title: c?.title || '', href: c?.href || '', links: (c?.links || []).filter((l: any) => l?.label && l?.href).map((l: any) => ({ label: l.label, href: l.href })) }))
    .filter((c: FooterCol) => c.title && c.links.length);
  if (cols.length) return cols;
  const groups: FooterCol[] = site.nav.filter((n) => n.children?.length).map((n) => ({ title: n.label, href: n.href, links: n.children as Link[] }));
  const singles: Link[] = site.nav.filter((n) => !n.children?.length).map(({ label, href }) => ({ label, href }));
  if (site.navCta?.href && !singles.some((l) => l.label === site.navCta.label)) singles.push(site.navCta);
  if (singles.length) groups.push({ title: 'Explore', href: '', links: singles });
  return groups;
}
function formatAddress(a: any) {
  if (!a) return '';
  if (typeof a === 'string') return a;
  return [a.street, a.area, [a.city, a.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

const head = (c: any, d: any): Head => ({ eyebrow: pick(c?.eyebrow, d.eyebrow || ''), heading: pick(c?.heading, d.heading || ''), intro: pick(c?.intro, d.intro || '') });

/* ---------- inner pages ---------- */
const PD: any = pageDefaults;
const today = new Date().toISOString().slice(0, 10);

function toEventItem(e: any): EventItem {
  const extra = PD.events[e.startDate] || {};
  return {
    title: e.title,
    tag: SECTOR[e.sector] || e.sector || '',
    date: e.displayDate || dateRange(e.startDate, e.endDate),
    location: e.location || extra.location || e.city || '',
    summary: e.summary || extra.summary || '',
    website: e.website || extra.website || '',
    image: img(cardSource(e), 1000, e.title),
    upcoming: (e.endDate || e.startDate || '') >= today,
  };
}

const strs = (v: any) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : []);

function normSection(x: any): Section | null {
  const base = { eyebrow: x.eyebrow || '', heading: x.heading || '', intro: x.intro || '' };
  switch (x._type) {
    case 'textSection':
      return { _type: 'textSection', ...base, paragraphs: strs(x.paragraphs), chipsLabel: x.chipsLabel || '', chips: strs(x.chips), image: img(x.image, 1800) };
    case 'groupsSection':
      return { _type: 'groupsSection', ...base, groups: (x.groups || []).map((g: any) => ({ title: g.title || '', caption: g.caption || '', items: strs(g.items) })) };
    case 'listSection':
      return { _type: 'listSection', ...base, items: strs(x.items) };
    case 'featuresSection':
      return { _type: 'featuresSection', ...base, layout: x.layout || 'auto', items: (x.items || []).map((i: any) => ({ title: i.title || '', text: i.text || '', image: img(i.image, 1000, i.title) })) };
    case 'linkCardsSection':
      return { _type: 'linkCardsSection', ...base, cards: (x.cards || []).map((c: any) => ({ title: c.title || '', text: c.text || '', href: c.href || '#', image: img(c.image, 1000, c.title) })) };
    case 'eventsSection':
      return {
        _type: 'eventsSection', ...base, showSummaries: x.showSummaries !== false, anchor: x.anchor || '',
        upcomingTitle: x.upcomingTitle || 'Upcoming events', pastTitle: x.pastTitle || 'Previous events',
        upcoming: (x.upcoming || []).filter((e: any) => e?.title).map(toEventItem),
        past: (x.past || []).filter((e: any) => e?.title).map(toEventItem),
      };
    case 'verticalsSection':
    case 'industriesSection':
    case 'platformsSection':
      // cards picked in Sanity (mapped to tiles once verticals/industries/platforms are built)
      return { _type: x._type, ...base, picked: (x.cards || []).filter((c: any) => c?.name) } as Section;
    case 'clientsSection':
      return { _type: 'clientsSection', ...base };
    case 'contactSection':
      return {
        _type: 'contactSection', ...base, formHeading: x.formHeading || '',
        emailLabel: x.emailLabel || 'Email', email: x.email || '',
        phoneLabel: x.phoneLabel || 'Phone', phones: (x.phones || []).filter((p: any) => p?.label && p?.number).map((p: any) => ({ label: p.label, number: p.number })),
        hoursLabel: x.hoursLabel || 'Opening hours', hours: x.hours || '',
        addressLabel: x.addressLabel || 'Company location', address: x.address || '',
        nameLabel: x.nameLabel || 'Name', emailFieldLabel: x.emailFieldLabel || 'Email', orgLabel: x.orgLabel || 'Organisation',
        topicLabel: x.topicLabel || "I'm interested in", topics: strs(x.topics), messageLabel: x.messageLabel || 'Message',
        note: x.note || 'This opens your email app with the message ready to send.',
        errorText: x.errorText || 'Please add your name, a valid email and a message.',
        buttonLabel: x.buttonLabel || 'Prepare email',
      };
    default:
      return null;
  }
}

function toPage(def: any, cms: any): Page {
  const c = cms || {};
  const ch = c.hero || {};
  const dh = def?.hero || {};
  const sections = has(c.sections) ? c.sections : def?.sections || [];
  return {
    slug: c.slug || def.slug,
    title: pick(c.title, def?.title || ''),
    seoTitle: pick(c.seoTitle, def?.seoTitle || ''),
    description: pick(c.description, def?.description || ''),
    showCta: (c.showCta ?? def?.showCta) !== false,
    hero: {
      eyebrow: pick(ch.eyebrow, dh.eyebrow || ''),
      heading: pick(ch.heading, dh.heading || c.title || ''),
      intro: pick(ch.intro, dh.intro || ''),
      image: imgOr(ch.image, dh.image, 2400, dh.image?.alt || ''),
      imageMobile: imgOr(ch.imageMobile, dh.imageMobile, MOBILE_WIDTH, dh.image?.alt || ''),
    },
    sections: sections.map(normSection).filter(Boolean) as Section[],
  };
}

/* ---------- main ---------- */
let cached: Promise<any> | null = null;
function load() {
  // one Sanity request per build, shared by every page
  cached ??= (async () => {
    try {
      // SANITY_CONTENT_FILE: build from a saved query result instead of the API (offline builds / tests)
      const file = process.env.SANITY_CONTENT_FILE;
      return file ? JSON.parse((await import('node:fs')).readFileSync(file, 'utf8')).result : await client.fetch(QUERY);
    } catch (err) {
      console.warn('[content] Sanity fetch failed, using bundled defaults:', (err as Error).message);
      return {};
    }
  })();
  return cached;
}

type Content = { site: Site; home: Home; noindex: boolean; pages: Page[]; eventList: EventItem[]; allLogos: Logo[]; enquiryTopics: string[]; verticals: Vertical[]; homeVerticals: Vertical[]; homeIndustries: IndustryTile[]; homePlatforms: Platform[]; industries: IndustryTile[]; platforms: Platform[] };

let content: Promise<Content> | null = null;
/** All site content, built once per build and shared by every page. */
export function getContent(): Promise<Content> {
  content ??= buildContent().then(optimiseImages);
  return content;
}

async function buildContent(): Promise<Content> {
  const data: any = (await load()) || {};
  const hd = data.header || {};
  const ft = data.footer || {};
  const s = data.settings || {};
  const h = data.home || {};
  const D = defaults.settings;
  const DH = defaults.home;

  const site: Site = {
    title: pick(s.title, D.title),
    description: pick(s.description, D.description),
    shareImage: img(s.shareImage, 1200)?.src ?? null,
    // Header document first, then the older Site settings fields, then the bundled defaults
    logo: (img(hd.logo, 400, 'Aayera') ?? imgOr(s.logo, D.logo, 400, 'Aayera')) as Img,
    nav: pick(hd.nav, pick(s.nav, D.nav)),
    navCta: has(hd.navCta?.label) ? hd.navCta : has(s.navCta?.label) ? s.navCta : D.navCta,
    email: pick(s.email, D.email),
    phones: pick(s.phones, D.phones),
    address: pick(formatAddress(s.address), D.address),
    hours: pick(s.hours, PD.contact.hours),
    mapQuery: pick(s.mapQuery, PD.contact.mapQuery),
    announcementOn: hd.announcementOn ?? s.announcementOn ?? D.announcementOn,
    announcement: (({ message = '', linkLabel = '', href = '' }: any) => ({ message, linkLabel, href }))(hd.announcement?.message ? hd.announcement : s.announcement || {}),
    floatingSocials: s.floatingSocials ?? D.floatingSocials,
    socials: pick((s.socials || []).filter((x: any) => x?.platform && x?.url), D.socials as { platform: string; url: string }[]),
    footerCols: [],
    footer: null as any,
  };
  // footer: the Footer document, falling back to the header logo and the Site settings contact details
  site.footerCols = footerColumns(has(ft.columns) ? ft.columns : h.footer?.columns, site);
  const ftPhones = (ft.phones || []).filter((p: any) => p?.label && p?.number).map((p: any) => ({ label: p.label, number: p.number }));
  site.footer = {
    logo: img(ft.logo, 400, 'Aayera') ?? site.logo,
    address: ft.address || site.address,
    email: ft.email || site.email,
    phones: ftPhones.length ? ftPhones : site.phones,
    hours: ft.hours || site.hours,
    copyright: (ft.copyright || '© {year} AAYERA. All rights reserved.').replace('{year}', String(new Date().getFullYear())),
  };

  /* hero */
  const hh = h.hero || {};
  // each slide has its own button; a slide without one falls back to the old shared button, if any
  const legacyCta = has(hh.slideCta?.label) ? hh.slideCta : null;
  const slideCta = (c: any) => (has(c?.label) && has(c?.href) ? { label: c.label, href: c.href } : legacyCta);
  const slides = has(hh.slides)
    ? hh.slides.map((x: any) => ({ image: img(x.image, 2400) as Img, imageMobile: img(x.imageMobile, MOBILE_WIDTH), video: slideVideo(x), tag: x.tag || '', title: x.title || '', short: x.short, meta: x.meta || '', cta: slideCta(x.cta) }))
    : DH.hero.slides.map((x: any) => ({ ...x, image: img(x.image, 2400) as Img, imageMobile: img(x.imageMobile, MOBILE_WIDTH), cta: x.cta ?? null }));

  /* events */
  const es = h.eventsSection || {};
  const eventSource = has(es.events) ? es.events : has(data.allEvents) ? data.allEvents : DH.events.items;
  const events = eventSource.filter(Boolean).map(toEventCard);

  /* photo wall */
  const mo = h.moments || {};
  const tiles: WallTile[] = (has(mo.tiles) ? mo.tiles : DH.moments.tiles).map((t: any) => ({
    image: img(t.image, 1000, t.caption) as Img,
    full: img(t.image, 2200) as Img,
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
      if (picks[i] && mosaic.length < 14) mosaic.push({ image: { ...picks[i].image, alt: '', w: 800 }, caption: picks[i].caption });
    }
  }

  /* clients */
  const cs = h.clientsSection || {};
  const clientSource = has(cs.clients) ? cs.clients : data.allClients;
  const logos: Logo[] = has(clientSource)
    ? clientSource.filter((c: any) => c?.logo).map((c: any) => ({ src: (img(c.logo, 460) as Img).src, alt: c.name || 'Client logo', plain: !!c.plainLogo }))
    : DH.clients.logos.map((n) => ({ src: `/assets/clients/${n}.png`, alt: 'Client logo', plain: false }));

  const st = h.statement || {};
  const cta = h.cta || {};

  const home: Home = {
    hero: {
      eyebrow: pick(hh.eyebrow, DH.hero.eyebrow),
      heading: pick(hh.heading, DH.hero.heading),
      intro: pick(hh.intro, (DH.hero as any).intro || ''),
      primaryCta: has(hh.primaryCta?.label) ? hh.primaryCta : DH.hero.primaryCta,
      secondaryCta: has(hh.secondaryCta?.label) ? hh.secondaryCta : DH.hero.secondaryCta,
      slides,
      mosaic,
    },
    marquee: pick(h.marquee, DH.marquee),
    events: { heading: pick(es.heading, DH.events.heading), intro: pick(es.intro, DH.events.intro), items: events },
    statement: { image: imgOr(st.image, DH.statement.image, 2400, DH.statement.image.alt), words: pick(st.words, DH.statement.words) },
    stats: (has(h.stats) ? h.stats : DH.stats).map((x: any) => ({ value: Number(x.value) || 0, suffix: x.suffix || '', label: x.label || '', image: img(x.image, 1000) })),
    moments: { eyebrow: pick(mo.eyebrow, DH.moments.eyebrow), heading: pick(mo.heading, DH.moments.heading), tiles },
    whoWeAre: {
      eyebrow: pick(h.whoWeAre?.eyebrow, DH.whoWeAre.eyebrow),
      heading: pick(h.whoWeAre?.heading, DH.whoWeAre.heading),
      intro: '',
      body: pick(h.whoWeAre?.body, DH.whoWeAre.body),
      cta: has(h.whoWeAre?.cta?.label) ? h.whoWeAre.cta : DH.whoWeAre.cta,
    },
    verticalsHead: head(h.verticalsHead, DH.verticalsHead),
    industriesHead: head(h.industriesHead, DH.industriesHead),
    industriesCta: h.industriesHead?.cta === undefined ? { label: 'Explore industries', href: '/industries/' } : has(h.industriesHead.cta?.label) ? h.industriesHead.cta : null,
    platformsHead: head(h.platformsHead, DH.platformsHead),
    filmstrip: has(h.filmstrip)
      ? h.filmstrip.map((x: any) => img(x, 600)).filter(Boolean)
      : DH.filmstrip.map((id) => ({ src: `/assets/img/07-sliding-rows/${id}.jpg`, alt: '', w: 600 })),
    clients: { eyebrow: pick(cs.eyebrow, DH.clients.eyebrow), heading: pick(cs.heading, DH.clients.heading), intro: pick(cs.intro, DH.clients.intro), logos },
    cta: {
      eyebrow: pick(cta.eyebrow, DH.cta.eyebrow),
      heading: pick(cta.heading, DH.cta.heading),
      image: imgOr(cta.image, DH.cta.image, 2400),
      buttons: pick(cta.buttons, DH.cta.buttons as any),
    },
  };

  /* inner pages: every default page, overridden by a Sanity page with the same slug, plus any new Sanity pages */
  const cmsPages: any[] = data.pages || [];
  const bySlug = new Map(cmsPages.map((p) => [p.slug.replace(/^\/+|\/+$/g, ''), p]));
  const pages: Page[] = PD.pages.map((d: any) => toPage(d, bySlug.get(d.slug)));
  for (const [slug, p] of bySlug) if (!PD.pages.some((d: any) => d.slug === slug)) pages.push(toPage({ slug }, { ...p, slug }));

  const eventList = (has(data.allEvents) ? data.allEvents : DH.events.items).map(toEventItem);
  const allLogos: Logo[] = has(data.allClients)
    ? data.allClients.filter((c: any) => c?.logo).map((c: any) => ({ src: (img(c.logo, 460) as Img).src, alt: c.name || 'Client logo', plain: !!c.plainLogo }))
    : DH.clients.logos.map((n) => ({ src: `/assets/clients/${n}.png`, alt: 'Client logo', plain: false }));

  /* business verticals, industries, platforms: Sanity documents, or the brief's defaults */
  const toVertical = (v: any): Vertical => {
    const key = v.key || '';
    const active = (v.status || 'active') === 'active';
    return {
      key, name: v.name || '', short: v.short || (v.name || '').replace(/^Aayera\s+/i, ''), caption: v.caption || '', description: v.description || '',
      status: active ? 'active' : 'coming-soon', image: img(v.image, 900, ''),
      // button: editable per card; without a link it goes to the vertical's own page, if there is one
      href: active ? v.cta?.href || (key && pages.some((p) => p.slug === `business-verticals/${key}`) ? `/business-verticals/${key}/` : '') : '',
      ctaLabel: v.cta?.label || 'Explore',
    };
  };
  const verticals: Vertical[] = (has(data.verticals) ? data.verticals : PD.verticals).map(toVertical);
  // the homepage shows the cards picked (and ordered) in Home → Business verticals; otherwise all of them
  const homeCards = (h.verticalsHead?.cards || []).filter((v: any) => v?.name);
  const homeVerticals: Vertical[] = homeCards.length ? homeCards.map(toVertical) : verticals;
  const toIndustry = (x: any): IndustryTile => ({ name: x.name || '', text: x.text || '' });
  const industries: IndustryTile[] = (has(data.industries) ? data.industries : PD.industries).map(toIndustry);
  // the homepage shows the cards picked (and ordered) in Home → Industries; otherwise all of them
  const homeIndustryCards = (h.industriesHead?.cards || []).filter((x: any) => x?.name);
  const homeIndustries: IndustryTile[] = homeIndustryCards.length ? homeIndustryCards.map(toIndustry) : industries;
  const toPlatform = (x: any): Platform => ({
    key: x.key || '', name: x.name || '', tagline: x.tagline || '', topics: strs(x.topics), summary: x.summary || '',
    image: img(x.image, 1600, x.name), website: x.website || '',
    editions: (x.editions || []).map((e: any) => ({ label: e.label || '', date: e.date || '', venue: e.venue || '', note: e.note || '', status: e.status === 'upcoming' ? 'upcoming' : 'past' })),
    cta: has(x.cta?.label) && has(x.cta?.href) ? { label: x.cta.label, href: x.cta.href } : { label: 'Platform details', href: `/our-platforms/#${x.key || ''}` },
  });
  const platforms: Platform[] = (has(data.platforms) ? data.platforms : PD.platforms).map(toPlatform);
  // the homepage shows the cards picked (and ordered) in Home → Flagship platforms; otherwise all of them
  const homePlatformCards = (h.platformsHead?.cards || []).filter((x: any) => x?.name);
  const homePlatforms: Platform[] = homePlatformCards.length ? homePlatformCards.map(toPlatform) : platforms;

  // page sections: the cards picked in that section, in that order; otherwise every one
  const toCard: Record<string, (x: any) => any> = { verticalsSection: toVertical, industriesSection: toIndustry, platformsSection: toPlatform };
  for (const pg of pages) for (const sec of pg.sections as any[]) {
    if (!toCard[sec._type]) continue;
    sec.picked = sec.picked?.length ? sec.picked.map(toCard[sec._type]) : null;
  }

  return { site, home, noindex: s.searchVisibility === 'hidden', pages, eventList, allLogos, enquiryTopics: pick(s.enquiryTopics, PD.contact.interests), verticals, homeVerticals, homeIndustries, homePlatforms, industries, platforms };
}
