import { imageWithAlt, link, button, phone, navItem } from './objects'
import { seo } from './seo'
import { vertical, industry, platform } from './brief'
import { page, verticalsSection, industriesSection, platformsSection, textSection, groupsSection, listSection, featuresSection, linkCardsSection, eventsSection, clientsSection, contactSection } from './page'
import { event } from './event'
import { client } from './client'
import { siteSettings } from './siteSettings'
import { home } from './home'
import { header } from './header'
import { footer } from './footer'
import { fixedPageTypes, FIXED_PAGE_TYPES } from './fixedPages'

export const schemaTypes = [
  imageWithAlt, link, button, phone, navItem, seo,
  verticalsSection, industriesSection, platformsSection, textSection, groupsSection, listSection, featuresSection, linkCardsSection, eventsSection, clientsSection, contactSection,
  event, client, siteSettings, home, header, footer, page, vertical, industry, platform,
  ...fixedPageTypes,
]
export const SINGLETONS = ['home', 'header', 'footer', 'siteSettings', ...FIXED_PAGE_TYPES]
