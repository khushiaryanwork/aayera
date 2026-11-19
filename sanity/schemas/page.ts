import { defineArrayMember, defineField, defineType } from 'sanity'
import { DocumentIcon } from '@sanity/icons/Document'
import { ACCENT_HELP } from './objects'

/* ---------- shared bits ---------- */
const head = [
  defineField({ name: 'eyebrow', type: 'string' }),
  defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
]
const intro = defineField({ name: 'intro', type: 'text', rows: 2 })
/** Pick (and order) the shared vertical / industry / platform entries shown in a section. */
const cardsField = (type: string, noun: string) => defineField({
  name: 'cards', title: 'Cards', type: 'array',
  of: [defineArrayMember({ type: 'reference', to: [{ type }] })],
  validation: (r) => r.unique(),
  description: `The ${noun} shown in this section, in this order. Drag to reorder, add or remove; click one to edit it (the same entry is used everywhere it appears on the site). Leave empty to show every one.`,
})
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
    defineField({ name: 'cta', title: 'Button', type: 'link', description: 'Optional button under the text.' }),
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
  description: 'Upcoming and previous events, as picked below (or every event, split by date).',
  fields: [
    ...head, intro,
    defineField({ name: 'showSummaries', title: 'Show event descriptions', type: 'boolean', initialValue: true }),
    defineField({ name: 'anchor', type: 'string', description: 'Optional link target, e.g. track-record → /our-platforms/#track-record' }),
    defineField({ name: 'upcomingTitle', title: 'Upcoming events heading', type: 'string', initialValue: 'Upcoming events' }),
    defineField({
      name: 'upcoming', title: 'Upcoming events', type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'event' }] })], validation: (r) => r.unique(),
      description: 'In this order. Once an event\'s date has passed it moves to the top of Previous events automatically. Click an event to edit its photo, text, date or venue.',
    }),
    defineField({ name: 'pastTitle', title: 'Previous events heading', type: 'string', initialValue: 'Previous events' }),
    defineField({
      name: 'past', title: 'Previous events', type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'event' }] })], validation: (r) => r.unique(),
      description: 'In this order. Leave both lists empty to show every event, sorted by date.',
    }),
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
  description: 'Any detail left empty here is taken from Site settings.',
  fieldsets: [
    { name: 'details', title: 'Contact details (left column)', options: { collapsible: true, collapsed: false } },
    { name: 'form', title: 'Message form (right column)', options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    ...head, intro,
    defineField({ name: 'emailLabel', title: 'Email label', type: 'string', fieldset: 'details', initialValue: 'Email' }),
    defineField({ name: 'email', type: 'string', fieldset: 'details', description: 'Shown on the page. Form enquiries also go here unless "Send form enquiries to" is set.' }),
    defineField({ name: 'phoneLabel', title: 'Phone label', type: 'string', fieldset: 'details', initialValue: 'Phone' }),
    defineField({ name: 'phones', type: 'array', of: [{ type: 'phone' }], fieldset: 'details' }),
    defineField({ name: 'hoursLabel', title: 'Opening hours label', type: 'string', fieldset: 'details', initialValue: 'Opening hours' }),
    defineField({ name: 'hours', title: 'Opening hours', type: 'string', fieldset: 'details' }),
    defineField({ name: 'addressLabel', title: 'Location label', type: 'string', fieldset: 'details', initialValue: 'Company location' }),
    defineField({ name: 'address', title: 'Location', type: 'text', rows: 2, fieldset: 'details' }),
    defineField({
      name: 'formTo', title: 'Send form enquiries to', type: 'string', fieldset: 'form',
      description: 'The email address that receives the form\'s enquiries. Add several separated by commas. Leave empty to use the email shown on the page.',
      validation: (r) => r.custom((v?: string) => !v || v.split(',').every((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim())) || 'Enter valid email addresses, separated by commas'),
    }),
    defineField({ name: 'formHeading', type: 'string', fieldset: 'form' }),
    defineField({ name: 'formIntro', title: 'Line under the form heading', type: 'string', fieldset: 'form' }),
    defineField({ name: 'nameLabel', title: 'Name field label', type: 'string', fieldset: 'form', initialValue: 'Name' }),
    defineField({ name: 'emailFieldLabel', title: 'Email field label', type: 'string', fieldset: 'form', initialValue: 'Email' }),
    defineField({ name: 'orgLabel', title: 'Organisation field label', type: 'string', fieldset: 'form', initialValue: 'Organisation' }),
    defineField({ name: 'phoneFieldLabel', title: 'Phone field label', type: 'string', fieldset: 'form', initialValue: 'Phone number' }),
    defineField({ name: 'countryLabel', title: 'Country field label', type: 'string', fieldset: 'form', initialValue: 'Country', description: 'A dropdown of every country.' }),
    defineField({ name: 'topicLabel', title: 'Topic field label', type: 'string', fieldset: 'form', initialValue: "I'm interested in" }),
    defineField({ name: 'topics', title: 'Topic options', type: 'array', of: [{ type: 'string' }], fieldset: 'form', description: 'The choices in the dropdown, in this order.' }),
    defineField({ name: 'messageLabel', title: 'Message field label', type: 'string', fieldset: 'form', initialValue: 'Message' }),
    defineField({ name: 'note', title: 'Note under the form', type: 'string', fieldset: 'form' }),
    defineField({ name: 'errorText', title: 'Error message', type: 'string', fieldset: 'form', description: 'Shown when a required field is missing.' }),
    defineField({ name: 'buttonLabel', title: 'Button', type: 'string', fieldset: 'form' }),
  ],
  preview: preview('Contact details & form'),
})

export const verticalsSection = defineType({
  name: 'verticalsSection', title: 'Business vertical tiles', type: 'object',
  description: 'Business vertical cards (coming-soon ones greyed).',
  fields: [...head, intro, cardsField('vertical', 'cards')], preview: preview('Business vertical tiles'),
})
export const industriesSection = defineType({
  name: 'industriesSection', title: 'Industries grid', type: 'object',
  description: 'Grid of numbered industry blocks.',
  fields: [...head, intro, cardsField('industry', 'blocks')], preview: preview('Industries grid'),
})
export const platformsSection = defineType({
  name: 'platformsSection', title: 'Flagship platforms', type: 'object',
  description: 'A card per platform, with its editions.',
  fields: [...head, intro, cardsField('platform', 'cards')], preview: preview('Flagship platforms'),
})

export const SECTION_TYPES = ['verticalsSection', 'industriesSection', 'platformsSection', 'textSection', 'groupsSection', 'listSection', 'featuresSection', 'linkCardsSection', 'eventsSection', 'clientsSection', 'contactSection']

/* ---------- page document ---------- */
/** The header (eyebrow, heading, intro, photos) at the top of an inner page. */
export const heroField = (group: string) => defineField({
  name: 'hero', title: 'Header', type: 'object', group, options: { collapsible: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
        defineField({ name: 'intro', type: 'text', rows: 2 }),
        defineField({ name: 'image', title: 'Desktop photo', type: 'imageWithAlt', description: 'Landscape, at least 2400px wide.' }),
        defineField({ name: 'imageMobile', title: 'Mobile photo', type: 'imageWithAlt', description: 'Portrait (about 9:16), shown on phones. Leave empty to use the desktop photo.' }),
      ],
})

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  groups: [{ name: 'content', title: 'Content', default: true }, { name: 'seo', title: 'SEO' }],
  fields: [
    defineField({ name: 'title', type: 'string', group: 'content', description: 'Used in the breadcrumb and browser tab.', validation: (r) => r.required() }),
    defineField({ name: 'seoTitle', type: 'string', group: 'seo', hidden: true }),
    defineField({
      name: 'slug', title: 'URL', type: 'slug', group: 'content',
      description: 'e.g. about → /about/, events/training → /events/training/. The built-in pages fall back to their original content when a field here is empty.',
      options: { source: 'title' }, validation: (r) => r.required(),
    }),
    heroField('content'),
    defineField({ name: 'sections', type: 'array', group: 'content', of: SECTION_TYPES.map((type) => defineArrayMember({ type })), description: 'Leave empty to keep the original sections for this page.' }),
    defineField({ name: 'showCta', title: 'Show the "Let\'s fill the next room" banner', type: 'boolean', group: 'content', initialValue: true }),
    defineField({ name: 'description', type: 'text', group: 'seo', hidden: true }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo', description: 'Empty fields fall back to "<Title> | AAYERA" and the Site settings description.' }),
  ],
  preview: { select: { title: 'title', slug: 'slug.current' }, prepare: ({ title, slug }) => ({ title, subtitle: slug ? `/${slug}/` : '' }) },
})
