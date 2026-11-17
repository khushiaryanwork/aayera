import { defineField, defineType } from 'sanity'

const SCHEMA_TYPES = [
  { title: 'Web page', value: 'WebPage' },
  { title: 'About page', value: 'AboutPage' },
  { title: 'Contact page', value: 'ContactPage' },
  { title: 'Collection / listing page', value: 'CollectionPage' },
  { title: 'Service page', value: 'Service' },
]

/** Search and sharing settings for one page: title, description, canonical URL, share image, indexing and schema markup. */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: false },
  fields: [
    defineField({
      name: 'title', title: 'SEO title', type: 'string',
      description: 'The browser-tab and Google title. Aim for 50–60 characters.',
      validation: (r) => r.max(70).warning('Google usually cuts titles longer than about 60 characters.'),
    }),
    defineField({
      name: 'description', title: 'Meta description', type: 'text', rows: 3,
      description: 'The summary under the title in Google results. Aim for 140–160 characters.',
      validation: (r) => r.max(170).warning('Google usually cuts descriptions longer than about 160 characters.'),
    }),
    defineField({
      name: 'canonical', title: 'Canonical URL', type: 'url',
      description: 'The preferred address of this page for search engines. Leave empty to use this page\'s own address (recommended). Only set it if this content lives at another URL.',
      validation: (r) => r.uri({ scheme: ['https', 'http'] }),
    }),
    defineField({
      name: 'image', title: 'Social share image', type: 'image',
      description: 'Shown when the page is shared on LinkedIn, WhatsApp, X etc. 1200×630 works best. Leave empty to use the one in Site settings.',
    }),
    defineField({
      name: 'noIndex', title: 'Hide this page from search engines', type: 'boolean', initialValue: false,
      description: 'Adds "noindex" so Google does not list this page.',
    }),
    defineField({
      name: 'schemaType', title: 'Schema type', type: 'string', initialValue: 'WebPage',
      options: { list: SCHEMA_TYPES, layout: 'dropdown' },
      description: 'Structured data (JSON-LD) added automatically from this page\'s title, description and address, plus breadcrumbs and the AAYERA organisation details. Not used on the homepage, which always describes the organisation and website.',
    }),
    defineField({
      name: 'schemaCustom', title: 'Custom schema (JSON-LD)', type: 'text', rows: 8,
      description: 'Optional extra structured data, pasted as JSON, e.g. an Event or FAQPage. Added alongside the automatic schema. Leave out the <script> tags.',
      validation: (r) => r.custom((v) => {
        if (!v || !String(v).trim()) return true
        try { const j = JSON.parse(String(v)); return typeof j === 'object' && j !== null ? true : 'Must be a JSON object or array' } catch (e) { return `Not valid JSON: ${(e as Error).message}` }
      }),
    }),
  ],
})
