import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { HomeIcon } from '@sanity/icons/Home'
import { CogIcon } from '@sanity/icons/Cog'
import { MenuIcon } from '@sanity/icons/Menu'
import { BlockElementIcon } from '@sanity/icons/BlockElement'
import { DocumentsIcon } from '@sanity/icons/Documents'
import { DocumentIcon } from '@sanity/icons/Document'
import { FIXED_PAGES, FIXED_SLUGS } from './sanity/fixedPages.mjs'
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
            S.listItem().title('Header').icon(MenuIcon).child(S.document().schemaType('header').documentId('header')),
            S.listItem().title('Home page').icon(HomeIcon).child(S.document().schemaType('home').documentId('home')),
            S.listItem().title('Footer').icon(BlockElementIcon).child(S.document().schemaType('footer').documentId('footer')),
            S.listItem().title('Site settings').icon(CogIcon).child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.listItem().title('Pages').icon(DocumentsIcon).child(
              S.list().title('Pages').items([
                // each built-in page has its own editor; Business Verticals' sub-pages are grouped under it
                ...FIXED_PAGES.filter((p) => !p.parent).map((p) => {
                  const subs = FIXED_PAGES.filter((c) => c.parent === p.slug)
                  const editor = S.document().schemaType(p.type).documentId(p.type)
                  return S.listItem().title(p.title).icon(DocumentIcon).child(
                    subs.length
                      ? S.list().title(p.title).items([
                          S.listItem().title(`${p.title} page`).icon(DocumentIcon).child(editor),
                          S.divider(),
                          ...subs.map((c) => S.listItem().title(c.title).icon(DocumentIcon).child(S.document().schemaType(c.type).documentId(c.type))),
                        ])
                      : editor,
                  )
                }),
                S.divider(),
                // extra pages built from flexible sections (the built-in ones above have their own editors)
                S.listItem().title('Other pages').icon(DocumentsIcon).child(
                  S.documentList().title('Other pages').schemaType('page').filter('_type == "page" && !(slug.current in $fixed)').params({ fixed: FIXED_SLUGS }),
                ),
              ]),
            ),
            S.divider(),
            S.documentTypeListItem('vertical').title('Business verticals'),
            S.documentTypeListItem('industry').title('Industries'),
            S.documentTypeListItem('platform').title('Platforms'),
            S.documentTypeListItem('event').title('Events'),
            S.documentTypeListItem('client').title('Clients'),
            S.divider(),
            S.documentTypeListItem('article').title('Insights articles'),
            S.documentTypeListItem('insightCategory').title('Insights categories'),
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
