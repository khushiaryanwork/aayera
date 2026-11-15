import { defineField, defineType } from 'sanity'
import { MenuIcon } from '@sanity/icons/Menu'

/** Singleton: the top of every page — logo, menu, button and the slim announcement bar. */
export const header = defineType({
  name: 'header',
  title: 'Header',
  type: 'document',
  icon: MenuIcon,
  groups: [{ name: 'menu', title: 'Logo & menu', default: true }, { name: 'bar', title: 'Announcement bar' }],
  fields: [
    defineField({ name: 'logo', type: 'imageWithAlt', group: 'menu', description: 'Light logo for the dark background. Also the browser-tab icon.' }),
    defineField({ name: 'nav', title: 'Menu', type: 'array', of: [{ type: 'navItem' }], group: 'menu', description: 'Top-level links; add Dropdown links to give an item a sub-menu (an accordion on phones).' }),
    defineField({ name: 'navCta', title: 'Button', type: 'link', group: 'menu', description: 'The gold button at the right of the menu, e.g. Partner with us → /contact/.' }),
    defineField({
      name: 'announcementOn', title: 'Show the announcement bar', type: 'boolean', group: 'bar', initialValue: true,
      description: 'The slim bar above the menu with the email, phones and opening hours from Site settings.',
    }),
    defineField({
      name: 'announcement', title: 'Message (optional)', type: 'object', group: 'bar',
      description: 'e.g. "Smart Meter Summit 2027 is open for registration" with a link. Leave empty for contact details only.',
      fields: [
        defineField({ name: 'message', type: 'string' }),
        defineField({ name: 'linkLabel', title: 'Link text', type: 'string' }),
        defineField({ name: 'href', title: 'Link', type: 'string' }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Header' }) },
})
