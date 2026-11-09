# Aayera website — Astro + React + Sanity

The original static `index.html`, rebuilt as an Astro site with React components and every
piece of content editable in Sanity. Output is fully static, so it deploys to Cloudflare Pages
and rebuilds whenever someone publishes in the CMS.

| | |
|---|---|
| Home | `/` |
| Pages | `/about/` · `/business-verticals/` (+ `events-conferences/`, `business-platforms/`, `exhibitions-experiences/`, `marketing-communications/`, `academy/`) · `/industries/` · `/our-platforms/` · `/clients/` · `/contact/` |
| CMS (Sanity Studio, embedded) | `/studio` |
| Sanity project | **Aayera Dummy** · `jmz64r1s` · dataset `production` |

## Run it

```bash
npm install
npm run dev        # http://localhost:4321  and  http://localhost:4321/studio
npm run build      # static output in dist/
```

## How the content works

- `src/lib/content.ts` runs at build time, fetches everything from Sanity, and **falls back to
  `src/content/defaults.json` (the original page) for any field that is empty**. The site always
  builds and looks right, even before anything is entered in the CMS.
- Headlines use two small conventions, shown as help text in the Studio:
  `*words*` → gold italic accent, and a new line → line break. The Clients heading also
  accepts `{count}` (the number of logos).
- Events and Clients are their own documents (the 7 events and 25 named clients already in the
  dataset are reused). Until an event has a **Card photo**, the site uses this design's bundled
  photo for it.

### Content brief (Phase 1)
Structure and copy follow *AAYERA Website Content & Developer Brief v1.0*: the homepage runs
hero → who we are → business verticals → industries → flagship platforms → selected work →
partner ecosystem → contact. In the Studio:
- **Business verticals**: 8 tiles. Active ones link to their page; *Coming soon* ones are greyed
  (currently Intelligence & Research, Corporate Solutions, Digital Commerce).
- **Industries**: the 12 industry ecosystems.
- **Platforms**: THE ADAS SHOW and SDV SUMMIT, with editions (dates, venues, exact partner wording).
- **Events**: the track record. Events dated in the future show as *Upcoming*.

### Inner pages
The pages from the old aayera.com (About us, Events → Training / Conference / Webinar, Networking,
Clients, News & Events, Contact) are built from `src/content/pages.json`, using the live site's copy.
In the Studio, each one is a **Page** made of sections: Text, Category cards, Numbered list, Features,
Link cards, Events list, Client logos, and Contact details & form.

- A Sanity Page with the same URL (e.g. `events/training`) overrides the built-in one. Empty fields
  keep the original content, and empty **Sections** keep the original sections.
- A Page with a new URL (e.g. `careers`) becomes a new page at `/careers/` on the next build.
  Add it to **Site settings → Menu** to link it.
- **News & Events** lists every Event, split into upcoming and previous by date, with each event's
  description and website.
- The contact form opens the visitor's email app with the message filled in (there is no server).
- `public/_redirects` sends the old `.html` addresses (about.html, webiner.html, …) to the new pages.

### Studio structure
- **Home page**: hero slides and photo wall, marquee words, events gallery, statement,
  numbers, moments wall, industries, filmstrip, clients, contact CTA (one tab per section)
- **Pages**: About us, Events, Training, Conference, Webinar, Networking, Clients, News & Events, Contact
- **Site settings**: logo, menu (with dropdowns), email, phones, opening hours, address, map, contact-form topics, SEO, search visibility
- **Events**, **Clients**

> Site settings currently has **Search engines → Hidden**, so the build adds `noindex`.
> Switch it to *Visible* before launch.

## One-time: put this design's content into Sanity

The site already works without this step, but running it once fills every Studio field with the
current text and uploads all the photos (about 60), so editors start from real content:

```bash
SANITY_WRITE_TOKEN=<editor token> npm run seed
```

It creates the Home page and all the inner Pages, adds card photos, descriptions and websites to
the existing events, and fills the logo, menu, hours and map in Site settings, but only where a
field is still empty. Re-running is safe. Use
`-- --force` to reset the Home page to the defaults.

## Deploy on Cloudflare Pages

1. **Workers & Pages → Create → Pages → Connect to Git** → pick `khushiaryanwork/aayera_dummy`.
2. Build settings: Framework preset **Astro**, build command `npm run build`, output `dist`.
   Environment variable `NODE_VERSION` = `22`.
3. Deploy. The site is at `https://<project>.pages.dev`, and the Studio at `/studio`.

### Let the Studio log in from your domain (CORS)
sanity.io/manage → Aayera Dummy → **API → CORS origins** → add, with **Allow credentials** ticked:
- `http://localhost:4321`
- `https://<project>.pages.dev` (and your custom domain later)

### Rebuild on publish
1. Cloudflare: project → **Settings → Builds → Deploy hooks** → add one (branch `main`) → copy the URL.
2. Sanity: sanity.io/manage → **API → Webhooks → Create webhook**
   - URL: the deploy hook URL · Dataset: `production` · Trigger on: Create, Update, Delete
   - Filter: `_type in ["home", "siteSettings", "event", "client"]`
   - HTTP method: `POST` · API version: `v2025-02-19`
   - Leave **Trigger webhook when drafts are modified** unchecked (only publishes rebuild)

Publishing in the Studio now triggers a Cloudflare build, and the change is live in about a minute.

## Motion (GSAP)

All scroll-driven, looping and entrance animation runs on **GSAP 3 + ScrollTrigger**;
CSS transitions are kept only for hover / focus / open-close states.

| Where | What |
|---|---|
| `src/lib/motion/gsap.ts` | the only place GSAP is imported from: registers ScrollTrigger once, shared `EASE` + `MQ` (media queries), `requestRefresh()` |
| `src/lib/motion/page.ts` | every page: `.rv` reveals (`ScrollTrigger.batch`), nav/bar states, inner-page header zoom, CTA parallax |
| `src/lib/motion/loop.ts` | seamless horizontal loops; Astro markup opts in with `data-loop="<seconds>"` (`data-loop-reverse`, `data-loop-hover-pause`) |
| `Hero.tsx` | slide crossfade / Ken Burns / caption stagger; scrubbed zoom-into-wall timeline (`quickSetter` for per-frame geometry) |
| `EventsTrack.tsx`, `Statement.tsx`, `PhotoWall.tsx`, `Stats.tsx`, `Clients.tsx` | scrubbed timelines, parallax, counters, velocity-boosted logo rows |

Conventions:
- React islands use `useGSAP()` from `@gsap/react` with a `scope` ref, so everything is
  cleaned up automatically. Listeners added inside are removed in the returned cleanup.
- Decorative motion is wrapped in `gsap.matchMedia().add(MQ.motion, …)`. With *reduce
  motion* turned on, content shows in its finished state (no hidden text, static logos).
- Without JavaScript, everything is visible: elements are hidden only by GSAP, or by the
  `html.motion` class that an inline head script sets when motion is allowed.
- Timings live in named constants at the top of each component, not inline numbers.

## Project layout

```
astro.config.mjs        Astro + React + embedded Studio (hash routing, static)
sanity.config.ts        Studio desk structure (singletons + lists)
sanity/schemas/         content model
sanity/env.mjs          project ID / dataset
src/pages/index.astro   page assembly
src/components/         Hero, EventsTrack, Statement, Stats, PhotoWall, Industries, Clients (React islands)
                        Nav, Marquee, Moments, Filmstrip, Cta, Footer (static Astro)
src/styles/global.css   the original CSS, unchanged
src/content/defaults.json  original content (fallback + seed source)
public/assets/          original images and logos
scripts/seed.mjs        one-time CMS import
```

## Notes
- CSS minification is turned off (`astro.config.mjs`): the minifier drops the unprefixed
  `backdrop-filter`, which removes the frosted blur in Chrome. The file is about 20 KB, and
  Cloudflare compresses it.
- `SANITY_CONTENT_FILE=path.json npm run build` builds from a saved query result instead of the
  API (useful offline).
