import { defineField, defineType } from 'sanity'
import { DocumentIcon } from '@sanity/icons/Document'
import { FIXED_PAGES } from '../fixedPages.mjs'
import { heroField } from './page'

/** One editor per built-in page: a Header tab, a numbered tab per section, and SEO. */
export const fixedPageTypes = FIXED_PAGES.map((p) => defineType({
  name: p.type,
  title: p.title,
  type: 'document',
  icon: DocumentIcon,
  groups: [
    { name: 'header', title: '1 · Header', default: true },
    ...p.sections.map((s, i) => ({ name: s.name, title: `${i + 2} · ${s.title}` })),
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Page name', type: 'string', group: 'header', description: `Used in the breadcrumb. This page lives at /${p.slug}/.`, validation: (r) => r.required() }),
    heroField('header'),
    ...p.sections.map((s) => defineField({
      name: s.name, title: s.title, type: s.type, group: s.name, options: { collapsible: false },
      description: 'Clear every field in this section to hide it on the page.',
    })),
    defineField({ name: 'showCta', title: 'Show the "Let\'s build what\'s next" banner at the bottom', type: 'boolean', group: 'header', initialValue: true }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo', description: 'Empty fields fall back to "<Page name> | AAYERA" and the Site settings description.' }),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: title || p.title, subtitle: `/${p.slug}/` }) },
}))
export const FIXED_PAGE_TYPES = FIXED_PAGES.map((p) => p.type)
