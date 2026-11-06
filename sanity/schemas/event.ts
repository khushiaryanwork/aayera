import { defineField, defineType } from 'sanity'
import { CalendarIcon } from '@sanity/icons/Calendar'

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  icon: CalendarIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'sector', type: 'string', validation: (r) => r.required(),
      options: { list: [{ title: 'Energy', value: 'energy' }, { title: 'Mobility', value: 'mobility' }, { title: 'Healthcare', value: 'health' }, { title: 'Technology', value: 'tech' }], layout: 'radio' },
    }),
    defineField({ name: 'startDate', type: 'date', validation: (r) => r.required() }),
    defineField({ name: 'endDate', type: 'date' }),
    defineField({ name: 'displayDate', title: 'Date text override', type: 'string', description: 'Optional. Replaces the auto-formatted date, e.g. "11–12 Sept 2019".' }),
    defineField({ name: 'location', type: 'string', description: 'Venue / city / country, e.g. "Le Méridien, Bengaluru, India".' }),
    defineField({ name: 'city', title: 'City shown on the card', type: 'string', description: 'Optional. Defaults to the city in Location.' }),
    defineField({ name: 'summary', title: 'Description', type: 'text', rows: 6, description: 'Shown on the News & Events page. Leave a blank line between paragraphs.' }),
    defineField({ name: 'website', title: 'Event website', type: 'url', validation: (r) => r.uri({ scheme: ['http', 'https'] }) }),
    defineField({ name: 'cardImage', title: 'Card photo', type: 'imageWithAlt', description: 'Tall photo used on the home page event cards and hero wall.' }),
    defineField({ name: 'image', title: 'Event artwork', type: 'imageWithAlt', description: 'Original event banner. Used as the card photo if none is set.' }),
  ],
  orderings: [{ title: 'Newest first', name: 'startDesc', by: [{ field: 'startDate', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', date: 'startDate', city: 'city', location: 'location', media: 'cardImage', fallback: 'image' },
    prepare: ({ title, date, city, location, media, fallback }) => ({ title, subtitle: [date, city || location].filter(Boolean).join(' · '), media: media || fallback }),
  },
})
