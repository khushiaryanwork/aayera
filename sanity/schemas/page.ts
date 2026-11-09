import { defineArrayMember, defineField, defineType } from 'sanity'
import { DocumentIcon } from '@sanity/icons/Document'
import { ACCENT_HELP } from './objects'

/* ---------- shared bits ---------- */
const head = [
  defineField({ name: 'eyebrow', type: 'string' }),
  defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
]
const intro = defineField({ name: 'intro', type: 'text', rows: 2 })
const preview = (label: string) => ({
  select: { title: 'heading', subtitle: 'eyebrow' },
  prepare: ({ title, subtitle }: any) => ({ title: (title || subtitle || label).replace(/\*/g, ''), subtitle: label }),
})

/* ---------- section types ---------- */
export const textSection = defineType({
  name: 'textSection', title: 'Text', type: 'object',
  fields: [
    ...head, intro,
    defineField({ name: 'paragraphs', type: 'array', of: [{ type: 'text', rows: 4 }] }),
    defineField({ name: 'chipsLabel', title: 'Tags label', type: 'string', description: 'e.g. "On-the-ground presence"' }),
    defineField({ name: 'chips', title: 'Tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'image', title: 'Wide image below', type: 'imageWithAlt' }),
  ],
  preview: preview('Text'),
})

export const groupsSection = defineType({
  name: 'groupsSection', title: 'Category cards', type: 'object',
  fields: [
    ...head, intro,
    defineField({
      name: 'groups', title: 'Cards', type: 'array',
      of: [defineArrayMember({
        type: 'object', name: 'group',
        fields: [defineField({ name: 'title', type: 'string' }), defineField({ name: 'caption', type: 'string' }), defineField({ name: 'items', type: 'array', of: [{ type: 'string' }] })],
        preview: { select: { title: 'title', items: 'items' }, prepare: ({ title, items }: any) => ({ title, subtitle: `${items?.length || 0} items` }) },
      })],
    }),
  ],
  preview: preview('Category cards'),
})

export const listSection = defineType({
  name: 'listSection', title: 'Numbered list', type: 'object',
  fields: [...head, intro, defineField({ name: 'items', type: 'array', of: [{ type: 'string' }] })],
  preview: preview('Numbered list'),
})

export const featuresSection = defineType({
  name: 'featuresSection', title: 'Features', type: 'object',
  description: 'Shown as photo cards when the items have images, otherwise as title / description rows.',
  fields: [
    ...head, intro,
    defineField({
      name: 'layout', type: 'string', initialValue: 'auto',
      options: { list: [{ title: 'Automatic', value: 'auto' }, { title: 'Rows', value: 'rows' }, { title: 'Grid of cards', value: 'grid' }, { title: 'Photo cards', value: 'cards' }], layout: 'radio', direction: 'horizontal' },
    }),
    defineField({
      name: 'items', type: 'array',
      of: [defineArrayMember({
        type: 'object', name: 'feature',
        fields: [defineField({ name: 'title', type: 'string' }), defineField({ name: 'text', type: 'text', rows: 3 }), defineField({ name: 'image', type: 'imageWithAlt' })],
        preview: { select: { title: 'title', subtitle: 'text', media: 'image' } },
      })],
    }),
  ],
  preview: preview('Features'),
})

export const linkCardsSection = defineType({
  name: 'linkCardsSection', title: 'Link cards', type: 'object',
  fields: [
    ...head, intro,
    defineField({
      name: 'cards', type: 'array',
      of: [defineArrayMember({
        type: 'object', name: 'linkCard',
        fields: [
          defineField({ name: 'title', type: 'string' }),
          defineField({ name: 'text', type: 'text', rows: 2 }),
          defineField({ name: 'href', title: 'Link', type: 'string', description: 'e.g. /events/training/' }),
          defineField({ name: 'image', type: 'imageWithAlt' }),
        ],
        preview: { select: { title: 'title', subtitle: 'href', media: 'image' } },
      })],
    }),
  ],
  preview: preview('Link cards'),
})

export const eventsSection = defineType({
  name: 'eventsSection', title: 'Events list', type: 'object',
  description: 'Lists every published Event, split into upcoming and previous by date.',
  fields: [
    ...head, intro,
    defineField({ name: 'showSummaries', title: 'Show event descriptions', type: 'boolean', initialValue: true }),
    defineField({ name: 'anchor', type: 'string', description: 'Optional link target, e.g. track-record → /our-platforms/#track-record' }),
  ],
  preview: preview('Events list'),
})

export const clientsSection = defineType({
  name: 'clientsSection', title: 'Client logos (moving rows)', type: 'object',
  description: 'The homepage\'s moving rows of client logos, showing every published Client. Leave the fields empty to use the homepage text. {count} in the heading becomes the number of logos.',
  fields: [...head, intro],
  preview: preview('Client logos'),
})

export const contactSection = defineType({
  name: 'contactSection', title: 'Contact details & form', type: 'object',
  description: 'Email, phones, hours and address come from Site settings.',
  fields: [...head, intro, defineField({ name: 'formHeading', type: 'string' })],
  preview: preview('Contact details & form'),
})

export const verticalsSection = defineType({
  name: 'verticalsSection', title: 'Business vertical tiles', type: 'object',
  description: 'Tiles for every Business vertical document (coming-soon ones greyed).',
  fields: [...head, intro], preview: preview('Business vertical tiles'),
})
export const industriesSection = defineType({
  name: 'industriesSection', title: 'Industries grid', type: 'object',
  description: 'Grid of every Industry document.',
  fields: [...head, intro], preview: preview('Industries grid'),
})
export const platformsSection = defineType({
  name: 'platformsSection', title: 'Flagship platforms', type: 'object',
  description: 'A card for every Platform document, with its editions.',
  fields: [...head, intro], preview: preview('Flagship platforms'),
})

export const SECTION_TYPES = ['verticalsSection', 'industriesSection', 'platformsSection', 'textSection', 'groupsSection', 'listSection', 'featuresSection', 'linkCardsSection', 'eventsSection', 'clientsSection', 'contactSection']

/* ---------- page document ---------- */
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  groups: [{ name: 'content', title: 'Content', default: true }, { name: 'seo', title: 'SEO' }],
  fields: [
    defineField({ name: 'title', type: 'string', group: 'content', description: 'Used in the breadcrumb and browser tab.', validation: (r) => r.required() }),
    defineField({ name: 'seoTitle', title: 'SEO title', type: 'string', group: 'seo', description: 'Browser tab / Google title. Defaults to "<Title> | AAYERA".' }),
    defineField({
      name: 'slug', title: 'URL', type: 'slug', group: 'content',
      description: 'e.g. about → /about/, events/training → /events/training/. The built-in pages fall back to their original content when a field here is empty.',
      options: { source: 'title' }, validation: (r) => r.required(),
    }),
    defineField({
      name: 'hero', title: 'Header', type: 'object', group: 'content', options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({ name: 'intro', type: 'text', rows: 2 }),
        defineField({ name: 'image', title: 'Background photo', type: 'imageWithAlt' }),
      ],
    }),
    defineField({ name: 'sections', type: 'array', group: 'content', of: SECTION_TYPES.map((type) => defineArrayMember({ type })), description: 'Leave empty to keep the original sections for this page.' }),
    defineField({ name: 'showCta', title: 'Show the "Let\'s fill the next room" banner', type: 'boolean', group: 'content', initialValue: true }),
    defineField({ name: 'description', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
  ],
  preview: { select: { title: 'title', slug: 'slug.current' }, prepare: ({ title, slug }) => ({ title, subtitle: slug ? `/${slug}/` : '' }) },
})
