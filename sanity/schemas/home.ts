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
    { name: 'events', title: '2 · Events' },
    { name: 'numbers', title: '3 · Statement & numbers' },
    { name: 'moments', title: '4 · Moments' },
    { name: 'industries', title: '5 · Industries' },
    { name: 'clients', title: '6 · Filmstrip & clients' },
    { name: 'cta', title: '7 · Contact' },
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
              defineField({ name: 'image', type: 'imageWithAlt', validation: (r) => r.required() }),
              defineField({ name: 'tag', title: 'Tag (pill)', type: 'string' }),
              defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
              defineField({ name: 'short', title: 'Short title', type: 'string', description: 'Optional shorter title shown on the slide (the full title is used for screen readers).' }),
              defineField({ name: 'meta', title: 'Place · date', type: 'string' }),
            ],
            preview: { select: { title: 'title', subtitle: 'meta', media: 'image' } },
          })],
        }),
        defineField({ name: 'slideCta', title: 'Button on each slide', type: 'link' }),
        defineField({ name: 'eyebrow', title: 'Eyebrow above the headline', type: 'string' }),
        defineField({ name: 'heading', title: 'Headline (revealed on scroll)', type: 'text', rows: 2, description: ACCENT_HELP }),
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
      name: 'statement', title: 'Expanding image statement', type: 'object', group: 'numbers', options: { collapsible: false },
      fields: [
        defineField({ name: 'image', type: 'imageWithAlt' }),
        defineField({ name: 'words', type: 'array', of: [{ type: 'string' }], description: 'One word or phrase per line. Wrap in *asterisks* for the gold serif style.' }),
      ],
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
              defineField({ name: 'caption', type: 'string' }),
              defineField({ name: 'ratio', title: 'Shape', type: 'string', initialValue: '4/5', options: { list: [{ title: 'Portrait 4:5', value: '4/5' }, { title: 'Landscape 3:2', value: '3/2' }, { title: 'Square', value: '1/1' }], layout: 'radio', direction: 'horizontal' } }),
            ],
            preview: { select: { title: 'caption', subtitle: 'ratio', media: 'image' } },
          })],
        }),
      ],
    }),

    /* ---------- industries ---------- */
    defineField({
      name: 'industries', type: 'object', group: 'industries', options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({
          name: 'items', title: 'Panels', type: 'array',
          of: [defineArrayMember({
            type: 'object', name: 'industryPanel',
            fields: [
              defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
              defineField({ name: 'text', type: 'text', rows: 2 }),
              defineField({ name: 'count', title: 'Count label', type: 'string', description: 'e.g. "2 events"' }),
              defineField({ name: 'image', type: 'imageWithAlt' }),
            ],
            preview: { select: { title: 'name', subtitle: 'count', media: 'image' } },
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
      name: 'clientsSection', title: 'Clients', type: 'object', group: 'clients', options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: `${ACCENT_HELP} {count} is replaced by the number of logos.` }),
        defineField({ name: 'intro', type: 'text', rows: 2 }),
        defineField({ name: 'clients', title: 'Logos', type: 'array', of: [{ type: 'reference', to: [{ type: 'client' }] }], description: 'Pick and order the logos. Leave empty to show every client.' }),
      ],
    }),

    /* ---------- CTA ---------- */
    defineField({
      name: 'cta', title: 'Contact call to action', type: 'object', group: 'cta', options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({ name: 'image', title: 'Background photo', type: 'imageWithAlt' }),
        defineField({ name: 'buttons', type: 'array', of: [{ type: 'button' }] }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Home page', subtitle: fallbackNote }) },
})
