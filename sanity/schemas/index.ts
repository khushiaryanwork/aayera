import { imageWithAlt, link, button, phone } from './objects'
import { event } from './event'
import { client } from './client'
import { siteSettings } from './siteSettings'
import { home } from './home'

export const schemaTypes = [imageWithAlt, link, button, phone, event, client, siteSettings, home]
export const SINGLETONS = ['home', 'siteSettings']
