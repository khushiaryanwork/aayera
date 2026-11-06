import { imageWithAlt, link, button, phone, navItem } from './objects'
import { page, textSection, groupsSection, listSection, featuresSection, linkCardsSection, eventsSection, clientsSection, contactSection } from './page'
import { event } from './event'
import { client } from './client'
import { siteSettings } from './siteSettings'
import { home } from './home'

export const schemaTypes = [
  imageWithAlt, link, button, phone, navItem,
  textSection, groupsSection, listSection, featuresSection, linkCardsSection, eventsSection, clientsSection, contactSection,
  event, client, siteSettings, home, page,
]
export const SINGLETONS = ['home', 'siteSettings']
