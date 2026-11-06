import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { HomeIcon } from '@sanity/icons/Home'
import { CogIcon } from '@sanity/icons/Cog'
import { schemaTypes, SINGLETONS } from './sanity/schemas'
import { projectId, dataset } from './sanity/env.mjs'

export default defineConfig({
  name: 'aayera',
  title: 'Aayera',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem().title('Home page').icon(HomeIcon).child(S.document().schemaType('home').documentId('home')),
            S.listItem().title('Site settings').icon(CogIcon).child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.documentTypeListItem('page').title('Pages'),
            S.divider(),
            S.documentTypeListItem('event').title('Events'),
            S.documentTypeListItem('client').title('Clients'),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
    // singletons can't be created again from the "new document" menu
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETONS.includes(schemaType)),
  },
  document: {
    actions: (input, { schemaType }) =>
      SINGLETONS.includes(schemaType) ? input.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action)) : input,
  },
})
