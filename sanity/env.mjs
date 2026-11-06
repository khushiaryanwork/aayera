// Sanity connection settings. The project ID and dataset are public values (not secrets),
// so they default to the Aayera Dummy project; override with env vars on Cloudflare if needed.
// (Each variable is read by its full name: Vite and the Sanity CLI only replace exact references.)
const env = typeof process !== 'undefined' && process.env ? process.env : {}

export const projectId = import.meta.env?.PUBLIC_SANITY_PROJECT_ID || env.PUBLIC_SANITY_PROJECT_ID || 'jmz64r1s'
export const dataset = import.meta.env?.PUBLIC_SANITY_DATASET || env.PUBLIC_SANITY_DATASET || 'production'
export const apiVersion = '2026-03-01'
export const studioBasePath = '/studio'
