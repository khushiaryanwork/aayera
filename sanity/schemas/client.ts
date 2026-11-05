import { defineField, defineType } from 'sanity'
import { UsersIcon } from '@sanity/icons/Users'

export const client = defineType({
  name: 'client',
  title: 'Client',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'logo', type: 'image', validation: (r) => r.required() }),
    defineField({
      name: 'plainLogo', title: 'Logo has no grey frame', type: 'boolean', initialValue: true,
      description: 'The original logos are 230×120 PNGs with a grey box that the site crops to. Turn this on for any other logo file so it is shown whole.',
    }),
  ],
  preview: { select: { title: 'name', media: 'logo' } },
})
