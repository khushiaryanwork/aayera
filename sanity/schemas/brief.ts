import { defineArrayMember, defineField, defineType } from 'sanity'
import { CaseIcon } from '@sanity/icons/Case'
import { ThListIcon } from '@sanity/icons/ThList'
import { StarIcon } from '@sanity/icons/Star'

const order = defineField({ name: 'order', title: 'Order', type: 'number', description: 'Lower numbers come first.' })

export const vertical = defineType({
  name: 'vertical',
  title: 'Business vertical',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({ name: 'name', type: 'string', description: 'e.g. Aayera Events & Conferences', validation: (r) => r.required() }),
    defineField({ name: 'short', title: 'Short name', type: 'string', description: 'Shown on the tile, e.g. Events & Conferences' }),
    defineField({
      name: 'slug', title: 'Page URL', type: 'slug', options: { source: 'short' },
      description: 'The tile links to /business-verticals/<this>/ when a Page with that URL exists (e.g. events-conferences).',
    }),
    defineField({ name: 'caption', type: 'string', description: 'One line, e.g. "Creating platforms where industries meet."' }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({
      name: 'status', type: 'string', initialValue: 'active', validation: (r) => r.required(),
      options: { list: [{ title: 'Active', value: 'active' }, { title: 'Coming soon', value: 'coming-soon' }], layout: 'radio', direction: 'horizontal' },
      description: 'Coming soon: the tile is shown greyed with a badge and does not link anywhere.',
    }),
    defineField({ name: 'image', type: 'imageWithAlt' }),
    order,
  ],
  orderings: [{ title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', status: 'status', caption: 'caption', media: 'image' },
    prepare: ({ title, status, caption, media }) => ({ title, subtitle: `${status === 'coming-soon' ? 'Coming soon · ' : ''}${caption || ''}`, media }),
  },
})

export const industry = defineType({
  name: 'industry',
  title: 'Industry',
  type: 'document',
  icon: ThListIcon,
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'text', title: 'Topics / description', type: 'text', rows: 3 }),
    order,
  ],
  orderings: [{ title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', subtitle: 'text' } },
})

export const platform = defineType({
  name: 'platform',
  title: 'Platform (event property)',
  type: 'document',
  icon: StarIcon,
  fields: [
    defineField({ name: 'name', type: 'string', description: 'e.g. THE ADAS SHOW', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Anchor', type: 'slug', options: { source: 'name' }, description: 'Used for links like /our-platforms/#adas' }),
    defineField({ name: 'tagline', type: 'string' }),
    defineField({ name: 'topics', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'summary', type: 'text', rows: 4 }),
    defineField({ name: 'image', type: 'imageWithAlt' }),
    defineField({ name: 'website', type: 'url' }),
    defineField({
      name: 'editions', type: 'array', description: 'Newest first. Only publish dates and venues once confirmed.',
      of: [defineArrayMember({
        type: 'object', name: 'edition',
        fields: [
          defineField({ name: 'label', type: 'string', description: 'e.g. 4th edition, THE ADAS SHOW 2026' }),
          defineField({ name: 'date', type: 'string', description: 'As it should read, e.g. 3 December 2026' }),
          defineField({ name: 'venue', type: 'string' }),
          defineField({ name: 'note', title: 'Partners / note', type: 'string', description: 'Use the exact relationship, e.g. "In collaboration with ARAI".' }),
          defineField({ name: 'status', type: 'string', initialValue: 'past', options: { list: [{ title: 'Past', value: 'past' }, { title: 'Upcoming', value: 'upcoming' }], layout: 'radio', direction: 'horizontal' } }),
        ],
        preview: { select: { title: 'label', date: 'date', venue: 'venue', status: 'status' }, prepare: ({ title, date, venue, status }) => ({ title: `${title || ''}${status === 'upcoming' ? ' · Upcoming' : ''}`, subtitle: [date, venue].filter(Boolean).join(' · ') }) },
      })],
    }),
    order,
  ],
  orderings: [{ title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', subtitle: 'tagline', media: 'image' } },
})
