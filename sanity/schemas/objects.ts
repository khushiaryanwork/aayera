import { defineField, defineType } from 'sanity'

export const ACCENT_HELP = 'Wrap words in *asterisks* for the gold italic accent. Press Enter for a line break.'

/** Image with alt text (same shape as the content already in the dataset). */
export const imageWithAlt = defineType({
  name: 'imageWithAlt',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({ name: 'alt', title: 'Alt text', type: 'string', description: 'Describe the photo for screen readers. Leave empty if purely decorative.' }),
    defineField({ name: 'caption', title: 'Caption', type: 'string', hidden: true }),
  ],
})

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  options: { columns: 2 },
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'href', title: 'URL or #section', type: 'string', description: 'e.g. #events, mailto:info@aayera.com, tel:+91…, https://…', validation: (r) => r.required() }),
  ],
})

export const button = defineType({
  name: 'button',
  title: 'Button',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'href', title: 'URL or #section', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'style', type: 'string', initialValue: 'gold', options: { list: [{ title: 'Gold (filled)', value: 'gold' }, { title: 'Ghost (outline)', value: 'ghost' }], layout: 'radio', direction: 'horizontal' } }),
  ],
  preview: { select: { title: 'label', subtitle: 'href' } },
})

export const phone = defineType({
  name: 'phone',
  title: 'Phone',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Displayed as', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'number', title: 'Dial number', type: 'string', description: 'International format without spaces, e.g. +918048536267', validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'label' } },
})

export const navItem = defineType({
  name: 'navItem',
  title: 'Menu item',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'href', title: 'URL', type: 'string', description: 'e.g. /about/', validation: (r) => r.required() }),
    defineField({ name: 'children', title: 'Dropdown links', type: 'array', of: [{ type: 'link' }] }),
  ],
  preview: { select: { title: 'label', subtitle: 'href', children: 'children' }, prepare: ({ title, subtitle, children }) => ({ title, subtitle: children?.length ? `${subtitle} · ${children.length} dropdown links` : subtitle }) },
})
