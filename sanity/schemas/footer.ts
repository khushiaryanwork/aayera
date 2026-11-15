import { defineArrayMember, defineField, defineType } from 'sanity'
import { BlockElementIcon } from '@sanity/icons/BlockElement'

/** Singleton: the bottom of every page — logo and contact details on the left, link columns on the right. */
export const footer = defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  icon: BlockElementIcon,
  groups: [{ name: 'contact', title: 'Logo & contact', default: true }, { name: 'links', title: 'Link columns' }],
  fields: [
    defineField({ name: 'logo', type: 'imageWithAlt', group: 'contact', description: 'Leave empty to use the Header logo.' }),
    defineField({ name: 'address', type: 'text', rows: 2, group: 'contact' }),
    defineField({ name: 'email', type: 'string', group: 'contact' }),
    defineField({ name: 'phones', type: 'array', of: [{ type: 'phone' }], group: 'contact' }),
    defineField({ name: 'hours', title: 'Opening hours', type: 'string', group: 'contact' }),
    defineField({
      name: 'columns', title: 'Link columns', type: 'array', group: 'links',
      description: 'One column per item, in this order (e.g. About, Business Verticals, Our Platforms, Explore). Leave empty to build the columns from the Header menu.',
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
    defineField({ name: 'copyright', title: 'Copyright line', type: 'string', group: 'links', description: '{year} becomes the current year, e.g. "© {year} AAYERA. All rights reserved."' }),
  ],
  preview: { prepare: () => ({ title: 'Footer' }) },
})
