import { imageWithAlt, link, button, phone, navItem } from './objects'
import { vertical, industry, platform } from './brief'
import { page, verticalsSection, industriesSection, platformsSection, textSection, groupsSection, listSection, featuresSection, linkCardsSection, eventsSection, clientsSection, contactSection } from './page'
import { event } from './event'
import { client } from './client'
import { siteSettings } from './siteSettings'
import { home } from './home'

export const schemaTypes = [
  imageWithAlt, link, button, phone, navItem,
  verticalsSection, industriesSection, platformsSection, textSection, groupsSection, listSection, featuresSection, linkCardsSection, eventsSection, clientsSection, contactSection,
  event, client, siteSettings, home, page, vertical, industry, platform,
]
export const SINGLETONS = ['home', 'siteSettings']
