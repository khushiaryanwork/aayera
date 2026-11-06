import { defineField, defineType } from 'sanity'
import { CogIcon } from '@sanity/icons/Cog'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [{ name: 'brand', title: 'Brand & navigation', default: true }, { name: 'contact', title: 'Contact' }, { name: 'seo', title: 'SEO & sharing' }],
  fields: [
    defineField({ name: 'logo', type: 'imageWithAlt', group: 'brand', description: 'Light logo for the dark background (nav and footer).' }),
    defineField({ name: 'nav', title: 'Menu', type: 'array', of: [{ type: 'navItem' }], group: 'brand', description: 'Leave empty to use the default menu (About us, Events ▾, Networking, Clients, News & Events).' }),
    defineField({ name: 'navCta', title: 'Navigation button', type: 'link', group: 'brand' }),
    defineField({ name: 'email', type: 'string', group: 'contact' }),
    defineField({ name: 'phones', type: 'array', of: [{ type: 'phone' }], group: 'contact' }),
    defineField({ name: 'hours', title: 'Opening hours', type: 'string', group: 'contact', description: 'e.g. Mon–Fri: 10:00am – 08:00pm' }),
    defineField({ name: 'mapQuery', title: 'Map location', type: 'string', group: 'contact', description: 'Address or place name shown on the Contact page map.' }),
    defineField({ name: 'enquiryTopics', title: 'Contact form topics', type: 'array', of: [{ type: 'string' }], group: 'contact' }),
    defineField({
      name: 'address', type: 'object', group: 'contact', options: { columns: 2 },
      fields: ['street', 'area', 'city', 'postalCode', 'country', 'countryCode'].map((name) => defineField({ name, type: 'string' })),
    }),
    defineField({ name: 'footerTagline', type: 'string', group: 'contact', hidden: true }),
    defineField({ name: 'title', title: 'Page title', type: 'string', group: 'seo' }),
    defineField({ name: 'description', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({ name: 'shareImage', title: 'Social share image', type: 'image', group: 'seo' }),
    defineField({ name: 'shareTitle', type: 'string', group: 'seo', hidden: true }),
    defineField({ name: 'shareDescription', type: 'text', group: 'seo', hidden: true }),
    defineField({
      name: 'searchVisibility', title: 'Search engines', type: 'string', group: 'seo', initialValue: 'visible',
      options: { list: [{ title: 'Visible', value: 'visible' }, { title: 'Hidden (noindex)', value: 'hidden' }], layout: 'radio', direction: 'horizontal' },
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
