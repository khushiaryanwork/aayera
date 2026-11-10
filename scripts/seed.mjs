#!/usr/bin/env node
/**
 * One-time import of this design's content + photos into Sanity.
 *
 *   SANITY_WRITE_TOKEN=xxxx npm run seed            # creates the Home page if it doesn't exist yet
 *   SANITY_WRITE_TOKEN=xxxx npm run seed -- --force # overwrites the Home page with the defaults
 *
 * Create the token at sanity.io/manage → project → API → Tokens (Editor permission).
 * Safe to re-run: images are de-duplicated by Sanity, and events / clients / site settings
 * are only filled where a field is still empty.
 */
import { createClient } from '@sanity/client';
import { readFileSync, createReadStream } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { projectId, dataset, apiVersion } from '../sanity/env.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const token = process.env.SANITY_WRITE_TOKEN;
const force = process.argv.includes('--force');
if (!token) {
  console.error('Set SANITY_WRITE_TOKEN (sanity.io/manage → API → Tokens, Editor permission).');
  process.exit(1);
}
const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });
const D = JSON.parse(readFileSync(join(root, 'src/content/defaults.json'), 'utf8'));
const PD = JSON.parse(readFileSync(join(root, 'src/content/pages.json'), 'utf8'));

const key = () => randomUUID().replace(/-/g, '').slice(0, 12);
const cache = new Map();
async function upload(publicPath) {
  if (cache.has(publicPath)) return cache.get(publicPath);
  // bundled photos live in src/assets/img (processed by Astro); logos/icons stay in public/
  const file = publicPath.startsWith('/assets/img/') ? join(root, 'src', publicPath) : join(root, 'public', publicPath);
  const asset = await client.assets.upload('image', createReadStream(file), { filename: basename(file) });
  const ref = { _type: 'reference', _ref: asset._id };
  cache.set(publicPath, ref);
  process.stdout.write('.');
  return ref;
}
const image = async (v, alt) => (v?.src ? { _type: 'imageWithAlt', asset: await upload(v.src), ...(alt ?? v.alt ? { alt: alt ?? v.alt } : {}) } : undefined);
const link = (l) => ({ _type: 'link', ...l });

async function main() {
  console.log(`Seeding ${projectId}/${dataset}`);
  const H = D.home;

  /* ---- events: add card photo + city where missing (matched by start date) ---- */
  const events = await client.fetch(`*[_type=="event" && !(_id in path("drafts.**"))]{_id,startDate,cardImage,city}`);
  const eventIds = [];
  for (const def of H.events.items) {
    let doc = events.find((e) => e.startDate === def.startDate);
    if (!doc) {
      doc = await client.create({ _type: 'event', title: def.title, sector: def.sector, startDate: def.startDate, endDate: def.endDate, location: def.city });
    }
    eventIds.push(doc._id);
    const set = {};
    if (!doc.cardImage) set.cardImage = await image(def.cardImage, def.title);
    if (!doc.city) set.city = def.city;
    if (def.displayDate) set.displayDate = def.displayDate;
    const extra = PD.events[def.startDate] || {};
    if (extra.summary) set.summary = extra.summary;
    if (extra.website) set.website = extra.website;
    if (Object.keys(set).length) await client.patch(doc._id).setIfMissing(set).commit();
  }

  /* ---- site settings: logo + navigation where missing ---- */
  const S = D.settings;
  await client.createIfNotExists({ _id: 'siteSettings', _type: 'siteSettings' });
  await client
    .patch('siteSettings')
    .setIfMissing({
      logo: await image(S.logo),
      nav: S.nav.map((l) => ({ _key: key(), ...link(l) })),
      navCta: link(S.navCta),
      email: S.email,
      phones: S.phones.map((p) => ({ _key: key(), _type: 'phone', ...p })),
      hours: PD.contact.hours,
      mapQuery: PD.contact.mapQuery,
      enquiryTopics: PD.contact.interests,
    })
    .commit();
  // the menu used to be plain links; replace it only if it is still empty
  const navNow = await client.fetch(`*[_id=="siteSettings"][0].nav`);
  if (!navNow?.length) {
    await client.patch('siteSettings').set({
      nav: S.nav.map((n) => ({ _key: key(), _type: 'navItem', label: n.label, href: n.href, ...(n.children ? { children: n.children.map((c) => ({ _key: key(), ...link(c) })) } : {}) })),
      navCta: link(S.navCta),
    }).commit();
  }

  /* ---- inner pages (About, Events, Training, …): created if missing ---- */
  const existingPages = new Set(await client.fetch(`*[_type=="page"].slug.current`));
  // array-item type names from sanity/schemas/page.ts, keyed by the array field they live in
  const ITEM_TYPE = { groups: 'group', items: 'feature', cards: 'linkCard' };
  const toSanity = async (v, field = '') => {
    if (Array.isArray(v))
      return Promise.all(v.map(async (x) => (x && typeof x === 'object'
        ? { _key: key(), ...(ITEM_TYPE[field] && !x._type ? { _type: ITEM_TYPE[field] } : {}), ...(await toSanity(x)) }
        : x)));
    if (v && typeof v === 'object') {
      if (v.src) return image(v);
      const out = {};
      for (const [k, val] of Object.entries(v)) out[k] = await toSanity(val, k);
      return out;
    }
    return v;
  };
  for (const pg of PD.pages) {
    if (existingPages.has(pg.slug) && !force) continue;
    const { slug, sections, ...rest } = pg;
    const doc = {
      _id: `page-${slug.replace(/\//g, '-')}`,
      _type: 'page',
      ...(await toSanity(rest)),
      slug: { _type: 'slug', current: slug },
      sections: await toSanity(sections, 'sections'),
    };
    await client.createOrReplace(doc);
    process.stdout.write('p');
  }

  /* ---- business verticals, industries, platforms (created if missing) ---- */
  const slugId = (prefix, k) => `${prefix}-${String(k).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  for (const [i, v] of PD.verticals.entries()) {
    await client.createIfNotExists({
      _id: slugId('vertical', v.key), _type: 'vertical', name: v.name, short: v.short, slug: { _type: 'slug', current: v.key },
      caption: v.caption, description: v.description, status: v.status, image: await image(v.image, v.short), order: i + 1,
    });
  }
  for (const [i, ind] of PD.industries.entries()) {
    await client.createIfNotExists({ _id: slugId('industry', ind.name), _type: 'industry', name: ind.name, text: ind.text, order: i + 1 });
  }
  for (const [i, pl] of PD.platforms.entries()) {
    await client.createIfNotExists({
      _id: slugId('platform', pl.key), _type: 'platform', name: pl.name, slug: { _type: 'slug', current: pl.key }, tagline: pl.tagline,
      topics: pl.topics, summary: pl.summary, image: await image(pl.image), ...(pl.website ? { website: pl.website } : {}), order: i + 1,
      editions: pl.editions.map((e) => ({ _key: key(), _type: 'edition', ...e })),
    });
  }
  process.stdout.write('v');

  /* ---- home page ---- */
  const existing = await client.fetch(`*[_id=="home"][0]._id`);
  if (existing && !force) {
    console.log('\nHome page already exists, left untouched (use --force to overwrite).');
    return;
  }
  const home = {
    _id: 'home',
    _type: 'home',
    hero: {
      eyebrow: H.hero.eyebrow,
      heading: H.hero.heading,
      intro: H.hero.intro,
      primaryCta: link(H.hero.primaryCta),
      secondaryCta: link(H.hero.secondaryCta),
      slideCta: link(H.hero.slideCta),
      slides: await Promise.all(H.hero.slides.map(async (s) => ({ _key: key(), _type: 'slide', image: await image(s.image), ...(s.imageMobile ? { imageMobile: await image(s.imageMobile) } : {}), tag: s.tag, title: s.title, ...(s.short ? { short: s.short } : {}), meta: s.meta }))),
      mosaic: [],
    },
    whoWeAre: { ...H.whoWeAre, cta: link(H.whoWeAre.cta) },
    verticalsHead: H.verticalsHead,
    industriesHead: H.industriesHead,
    platformsHead: H.platformsHead,
    marquee: H.marquee.map((w) => ({ _key: key(), _type: 'marqueeWord', text: w.text, serif: !!w.serif })),
    eventsSection: { heading: H.events.heading, intro: H.events.intro, events: eventIds.map((id) => ({ _key: key(), _type: 'reference', _ref: id })) },
    statement: { image: await image(H.statement.image), words: H.statement.words },
    stats: await Promise.all(H.stats.map(async (s) => ({ _key: key(), _type: 'stat', value: s.value, suffix: s.suffix, label: s.label, image: await image(s.image) }))),
    moments: {
      eyebrow: H.moments.eyebrow,
      heading: H.moments.heading,
      tiles: await Promise.all(H.moments.tiles.map(async (t) => ({ _key: key(), _type: 'wallTile', image: await image(t.image, t.caption), caption: t.caption, ratio: t.ratio }))),
    },
    filmstrip: await Promise.all(H.filmstrip.map(async (id) => ({ _key: key(), ...(await image({ src: `/assets/img/07-sliding-rows/${id}.jpg` })) }))),
    clientsSection: { eyebrow: H.clients.eyebrow, heading: H.clients.heading, intro: H.clients.intro },
    cta: {
      eyebrow: H.cta.eyebrow,
      heading: H.cta.heading,
      image: await image(H.cta.image),
      buttons: H.cta.buttons.map((b) => ({ _key: key(), _type: 'button', ...b })),
    },
  };
  await client.createOrReplace(home);
  console.log(`\nDone: Home page created, ${cache.size} images uploaded.`);
}

main().catch((e) => {
  console.error('\nSeed failed:', e.message);
  process.exit(1);
});
