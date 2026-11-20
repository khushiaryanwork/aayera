import { defineArrayMember, defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { TagIcon } from '@sanity/icons/Tag'
import { ACCENT_HELP } from './objects'

/** Insights categories, shown as filters on the Insights page and as the label on each article. */
export const insightCategory = defineType({
  name: 'insightCategory',
  title: 'Insight category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'URL key', type: 'slug', options: { source: 'title' }, validation: (r) => r.required(), description: 'Used in filter links, e.g. /insights/?category=research-reports' }),
    defineField({ name: 'order', type: 'number', description: 'Filters are shown in this order (lowest first).' }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})

/** One Insights article: its own page at /insights/<url>/. */
export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [{ name: 'content', title: 'Content', default: true }, { name: 'seo', title: 'SEO' }],
  fields: [
    defineField({ name: 'title', type: 'string', group: 'content', validation: (r) => r.required() }),
    defineField({
      name: 'slug', title: 'URL', type: 'slug', group: 'content', options: { source: 'title', maxLength: 90 },
      description: 'The article lives at /insights/<this>/. Click Generate to make it from the title.', validation: (r) => r.required(),
    }),
    defineField({ name: 'category', type: 'reference', to: [{ type: 'insightCategory' }], group: 'content', validation: (r) => r.required() }),
    defineField({ name: 'publishedAt', title: 'Date', type: 'date', group: 'content', initialValue: () => new Date().toISOString().slice(0, 10), validation: (r) => r.required(), description: 'Articles are listed newest first.' }),
    defineField({
      name: 'author', type: 'object', group: 'content', options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'name', type: 'string' }),
        defineField({ name: 'role', title: 'Role / organisation', type: 'string', description: 'e.g. "Head of Research, AAYERA"' }),
        defineField({ name: 'photo', type: 'image', options: { hotspot: true }, description: 'Square works best.' }),
      ],
    }),
    defineField({ name: 'image', title: 'Main image', type: 'imageWithAlt', group: 'content', description: 'Shown on the article card and at the top of the article. Landscape, at least 1600px wide.' }),
    defineField({ name: 'excerpt', title: 'Summary', type: 'text', rows: 3, group: 'content', description: 'One or two sentences, shown on the article card and under the title.', validation: (r) => r.max(320) }),
    defineField({
      name: 'body', title: 'Article', type: 'array', group: 'content',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{ title: 'Paragraph', value: 'normal' }, { title: 'Heading', value: 'h2' }, { title: 'Subheading', value: 'h3' }, { title: 'Quote', value: 'blockquote' }],
          lists: [{ title: 'Bullets', value: 'bullet' }, { title: 'Numbered', value: 'number' }],
          marks: {
            decorators: [{ title: 'Bold', value: 'strong' }, { title: 'Italic', value: 'em' }],
            annotations: [{
              name: 'link', type: 'object', title: 'Link',
              fields: [defineField({ name: 'href', title: 'URL', type: 'url', validation: (r) => r.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }) })],
            }],
          },
        }),
        defineArrayMember({
          type: 'image', name: 'bodyImage', title: 'Image', options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
            defineField({ name: 'caption', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo', description: 'Empty fields fall back to "<Title> | AAYERA Insights" and the summary.' }),
  ],
  orderings: [{ title: 'Newest first', name: 'dateDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', date: 'publishedAt', cat: 'category.title', media: 'image' },
    prepare: ({ title, date, cat, media }) => ({ title, subtitle: [date, cat].filter(Boolean).join(' · '), media }),
  },
})

/** A section listing published articles (all of them, or one category). */
export const articlesSection = defineType({
  name: 'articlesSection', title: 'Articles', type: 'object',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'text', rows: 2, description: ACCENT_HELP }),
    defineField({ name: 'intro', type: 'text', rows: 2 }),
    defineField({ name: 'category', title: 'Only this category', type: 'reference', to: [{ type: 'insightCategory' }], description: 'Leave empty to list every article.' }),
    defineField({ name: 'showFilters', title: 'Show category filters', type: 'boolean', initialValue: false }),
    defineField({ name: 'limit', title: 'How many to show', type: 'number', description: 'Leave empty to show them all.', validation: (r) => r.min(1).integer() }),
    defineField({ name: 'button', type: 'link', description: 'Optional button under the articles.' }),
    defineField({ name: 'emptyText', title: 'Text when there are no articles yet', type: 'string', description: 'Leave empty to hide the section until an article is published.' }),
  ],
  preview: { select: { title: 'heading', subtitle: 'eyebrow' }, prepare: ({ title, subtitle }: any) => ({ title: (title || subtitle || 'Articles').replace(/\*/g, ''), subtitle: 'Articles' }) },
})
