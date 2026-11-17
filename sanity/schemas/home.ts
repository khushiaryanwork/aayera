import { defineArrayMember, defineField, defineType } from 'sanity'
import { HomeIcon } from '@sanity/icons/Home'
import { ACCENT_HELP } from './objects'

const fallbackNote = 'Leave empty to keep the original content.'

export const home = defineType({
  name: 'home',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
  groups: [
    { name: 'hero', title: '1 · Hero', default: true },
    { name: 'brief', title: '2 · Who we are' },
    { name: 'verticals', title: '3 · Business verticals' },
    { name: 'industries', title: '4 · Industries' },
    { name: 'statement', title: '5 · Statement' },
    { name: 'platforms', title: '6 · Flagship platforms' },
    { name: 'events', title: '7 · Selected work' },
    { name: 'numbers', title: '8 · Numbers' },
    { name: 'moments', title: '9 · Moments' },
    { name: 'clients', title: '10 · Filmstrip' },
    { name: 'partners', title: '11 · Partner ecosystem' },
    { name: 'cta', title: '12 · Contact' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    /* ---------- hero ---------- */
    defineField({
      name: 'hero', type: 'object', group: 'hero', options: { collapsible: false },
      fields: [
        defineField({
          name: 'slides', type: 'array', description: 'Full-screen slides at the top of the page.',
          of: [defineArrayMember({
            type: 'object', name: 'slide',
            fields: [
              defineField({
                name: 'mediaType', title: 'Media', type: 'string', initialValue: 'image',
                description: 'Photo only, or a video / GIF that plays over the photo.',
                options: { list: [{ title: 'Image', value: 'image' }, { title: 'Video', value: 'video' }], layout: 'radio', direction: 'horizontal' },
              }),
              defineField({
                name: 'image', title: 'Desktop photo', type: 'imageWithAlt',
                description: 'Landscape, at least 2400px wide. With a video it is shown while the video loads (and to visitors who turn motion off).',
                validation: (r) => r.required(),
              }),
              defineField({ name: 'imageMobile', title: 'Mobile photo', type: 'imageWithAlt', description: 'Portrait (about 9:16), shown on phones. Leave empty to use the desktop photo.' }),
              defineField({
                name: 'video', title: 'Desktop video', type: 'file',
                description: 'MP4 or WebM (recommended: 1920×1080, under 10 MB, no sound — it plays muted and loops). A GIF also works but is much heavier.',
                options: { accept: 'video/mp4,video/webm,image/gif' },
                hidden: ({ parent }) => parent?.mediaType !== 'video',
                validation: (r) => r.custom((v, ctx: any) => (ctx.parent?.mediaType === 'video' && !v?.asset ? 'Upload a video, or switch Media back to Image.' : true)),
              }),
              defineField({
                name: 'videoMobile', title: 'Mobile video', type: 'file',
                description: 'Optional portrait (9:16) version for phones, e.g. 1080×1920. Leave empty to use the desktop video.',
                options: { accept: 'video/mp4,video/webm,image/gif' },
                hidden: ({ parent }) => parent?.mediaType !== 'video',
              }),
              defineField({ name: 'tag', title: 'Tag (pill)', type: 'string' }),
              defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
              defineField({ name: 'short', title: 'Short title', type: 'string', description: 'Optional shorter title shown on the slide (the full title is used for screen readers).' }),
              defineField({ name: 'meta', title: 'Place · date', type: 'string' }),
              defineField({ name: 'cta', title: 'Button', type: 'link', description: 'The button on this slide. Leave the label empty to show no button.' }),
            ],
            preview: {
              select: { title: 'title', meta: 'meta', media: 'image', mobile: 'imageMobile', type: 'mediaType' },
              prepare: ({ title, meta, media, mobile, type }) => ({ title, subtitle: [type === 'video' ? '▶ Video' : '', meta, mobile ? '' : 'no mobile photo'].filter(Boolean).join(' · '), media }),
            },
          })],
        }),
        defineField({ name: 'eyebrow', title: 'Eyebrow above the headline', type: 'string' }),
        defineField({ name: 'heading', title: 'Headline (revealed on scroll)', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({ name: 'intro', title: 'Supporting line', type: 'text', rows: 2 }),
        defineField({ name: 'primaryCta', title: 'Primary button', type: 'link' }),
        defineField({ name: 'secondaryCta', title: 'Secondary button', type: 'link' }),
        defineField({
          name: 'mosaic', title: 'Hero photo wall (14 photos)', type: 'array',
          description: 'The wall the slider shrinks into. Leave empty to build it automatically from the events and the Moments photos.',
          validation: (r) => r.max(14),
          of: [defineArrayMember({
            type: 'object', name: 'mosaicTile',
            fields: [defineField({ name: 'image', type: 'imageWithAlt', validation: (r) => r.required() }), defineField({ name: 'caption', type: 'string' })],
            preview: { select: { title: 'caption', media: 'image' } },
          })],
        }),
      ],
    }),
    defineField({
      name: 'marquee', title: 'Scrolling words under the hero', type: 'array', group: 'hero',
      of: [defineArrayMember({
        type: 'object', name: 'marqueeWord',
        fields: [defineField({ name: 'text', type: 'string' }), defineField({ name: 'serif', title: 'Italic serif style', type: 'boolean' })],
        preview: { select: { title: 'text', serif: 'serif' }, prepare: ({ title, serif }) => ({ title, subtitle: serif ? 'Serif' : 'Sans' }) },
      })],
    }),

    /* ---------- brief sections ---------- */
    defineField({
      name: 'whoWeAre', title: 'Who we are', type: 'object', group: 'brief', options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({ name: 'body', type: 'text', rows: 8, description: 'Leave an empty line between paragraphs. The first paragraph is shown larger.' }),
        defineField({ name: 'cta', title: 'Button', type: 'link' }),
      ],
    }),
    defineField({
      name: 'verticalsHead', title: 'Business verticals', type: 'object', group: 'verticals', options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({ name: 'intro', type: 'text', rows: 2 }),
        defineField({
          name: 'cards', title: 'Cards', type: 'array',
          description: 'The cards shown in this section, in this order. Drag to reorder, add or remove cards; click a card to edit its photo and text (the same card is used on the Business verticals pages). Leave empty to show every vertical.',
          of: [defineArrayMember({ type: 'reference', to: [{ type: 'vertical' }] })],
          validation: (r) => r.unique(),
        }),
        defineField({ name: 'cta', title: 'Button under the cards', type: 'link', description: 'e.g. Explore all business verticals → /business-verticals/' }),
      ],
    }),
    defineField({
      name: 'industriesHead', title: 'Industries', type: 'object', group: 'industries', options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({ name: 'intro', type: 'text', rows: 2 }),
        defineField({
          name: 'cards', title: 'Cards', type: 'array',
          description: 'The blocks shown in this section, in this order (numbered automatically). Drag to reorder, add or remove; click a block to edit its title and text (the same block is used on the Industries page). Leave empty to show every industry.',
          of: [defineArrayMember({ type: 'reference', to: [{ type: 'industry' }] })],
          validation: (r) => r.unique(),
        }),
        defineField({ name: 'cta', title: 'Button under the blocks', type: 'link', description: 'e.g. Explore industries → /industries/' }),
      ],
    }),
    defineField({
      name: 'platformsHead', title: 'Flagship platforms', type: 'object', group: 'platforms', options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({ name: 'intro', type: 'text', rows: 2 }),
        defineField({
          name: 'cards', title: 'Cards', type: 'array',
          description: 'The platform cards shown in this section, in this order. Click a card to edit its photo, tagline, topics, editions and button (the same card is used on the Our Platforms page). Leave empty to show every platform.',
          of: [defineArrayMember({ type: 'reference', to: [{ type: 'platform' }] })],
          validation: (r) => r.unique(),
        }),
        defineField({ name: 'cta', title: 'Button under the cards', type: 'link', description: 'e.g. Discover our platforms → /our-platforms/' }),
      ],
    }),

    /* ---------- events ---------- */
    defineField({
      name: 'eventsSection', title: 'Events gallery', type: 'object', group: 'events', options: { collapsible: false },
      fields: [
        defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({ name: 'intro', type: 'string' }),
        defineField({
          name: 'events', type: 'array', of: [{ type: 'reference', to: [{ type: 'event' }] }],
          description: 'Pick and order the events shown. Leave empty to show all events, newest first.',
        }),
      ],
    }),

    /* ---------- statement & numbers ---------- */
    defineField({
      name: 'statement', title: 'Expanding image statement', type: 'object', group: 'statement', options: { collapsible: false },
      fields: [
        defineField({ name: 'image', type: 'imageWithAlt' }),
        defineField({ name: 'words', type: 'array', of: [{ type: 'string' }], description: 'One word or phrase per line. Wrap in *asterisks* for the gold serif style.' }),
      ],
    }),
    defineField({
      name: 'statsHead', title: 'Numbers heading', type: 'object', group: 'numbers', options: { collapsible: false },
      description: 'Optional heading above the numbers.',
      fields: [defineField({ name: 'eyebrow', type: 'string' }), defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }), defineField({ name: 'intro', type: 'text', rows: 3 })],
    }),
    defineField({
      name: 'stats', title: 'Numbers', type: 'array', group: 'numbers', validation: (r) => r.max(4),
      of: [defineArrayMember({
        type: 'object', name: 'stat',
        fields: [
          defineField({ name: 'value', type: 'number', validation: (r) => r.required() }),
          defineField({ name: 'suffix', type: 'string', description: 'e.g. +' }),
          defineField({ name: 'label', type: 'string' }),
          defineField({ name: 'image', title: 'Background photo', type: 'imageWithAlt' }),
        ],
        preview: { select: { v: 'value', s: 'suffix', label: 'label', media: 'image' }, prepare: ({ v, s, label, media }) => ({ title: `${v ?? ''}${s ?? ''}`, subtitle: label, media }) },
      })],
    }),

    /* ---------- moments ---------- */
    defineField({
      name: 'moments', title: 'Photo wall', type: 'object', group: 'moments', options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({
          name: 'tiles', title: 'Photos', type: 'array',
          description: 'Split into 4 columns in order (first quarter → column 1, and so on). Clicking a photo opens it full size.',
          of: [defineArrayMember({
            type: 'object', name: 'wallTile',
            fields: [
              defineField({ name: 'image', type: 'imageWithAlt', validation: (r) => r.required() }),
              defineField({ name: 'caption', title: 'Text on hover', type: 'string', description: 'Shown over the photo when a visitor hovers it, e.g. "Full house". Also read out by screen readers.' }),
              defineField({ name: 'ratio', title: 'Shape', type: 'string', initialValue: '4/5', options: { list: [{ title: 'Portrait 4:5', value: '4/5' }, { title: 'Landscape 3:2', value: '3/2' }, { title: 'Square', value: '1/1' }], layout: 'radio', direction: 'horizontal' } }),
            ],
            preview: { select: { title: 'caption', subtitle: 'ratio', media: 'image' } },
          })],
        }),
      ],
    }),

    /* ---------- filmstrip & clients ---------- */
    defineField({
      name: 'filmstrip', title: 'Filmstrip photos', type: 'array', group: 'clients', options: { layout: 'grid' },
      description: 'Two endlessly scrolling rows; the first half of the photos go in the top row.',
      of: [{ type: 'imageWithAlt' }],
    }),
    defineField({
      name: 'clientsSection', title: 'Partner ecosystem', type: 'object', group: 'partners', options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: `${ACCENT_HELP} {count} is replaced by the number of logos.` }),
        defineField({ name: 'intro', type: 'text', rows: 3 }),
        defineField({ name: 'partnerTypes', title: 'Partner types', type: 'array', of: [{ type: 'string' }], description: 'Optional tags under the intro, e.g. Institutional Partners, Media Partners.' }),
        defineField({ name: 'clients', title: 'Companies', type: 'array', of: [{ type: 'reference', to: [{ type: 'client' }] }], validation: (r) => r.unique(), description: 'The company logos in the moving rows. Drag to reorder, add or remove; click a company to change its name or logo (the same company is used on the Clients page). Leave empty to show every client.' }),
      ],
    }),

    /* ---------- CTA ---------- */
    defineField({
      name: 'cta', title: 'Contact call to action', type: 'object', group: 'cta', options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({ name: 'text', type: 'text', rows: 3, description: 'Optional line under the heading.' }),
        defineField({ name: 'image', title: 'Background photo', type: 'imageWithAlt' }),
        defineField({ name: 'buttons', type: 'array', of: [{ type: 'button' }] }),
      ],
    }),
    defineField({
      name: 'footer', title: 'Footer', type: 'object', group: 'cta', hidden: true, options: { collapsible: false },
      description: 'The footer is shown on every page. The address, email, phone numbers and office hours on its left are edited in Site settings.',
      fields: [
        defineField({
          name: 'columns', title: 'Link columns', type: 'array',
          description: 'One column per item, in this order (e.g. About, Business Verticals, Our Platforms, Explore). Leave empty to build the columns from the main menu.',
          of: [defineArrayMember({
            type: 'object', name: 'footerColumn',
            fields: [
              defineField({ name: 'title', title: 'Heading', type: 'string', validation: (r) => r.required() }),
              defineField({ name: 'href', title: 'Heading link', type: 'string', description: 'Optional, e.g. /about/' }),
              defineField({ name: 'links', type: 'array', of: [{ type: 'link' }] }),
            ],
            preview: { select: { title: 'title', links: 'links' }, prepare: ({ title, links }) => ({ title, subtitle: `${links?.length || 0} links` }) },
          })],
        }),
      ],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo', description: 'Empty fields fall back to the Site settings title and description.' }),
  ],
  preview: { prepare: () => ({ title: 'Home page', subtitle: fallbackNote }) },
})
