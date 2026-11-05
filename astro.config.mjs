import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sanity from '@sanity/astro';
import { projectId, dataset, apiVersion, studioBasePath } from './sanity/env.mjs';

// Fully static build (Cloudflare Pages). The Studio is a single prerendered page at /studio
// using hash routing, so no server or rewrite rules are needed.
export default defineConfig({
  output: 'static',
  // The default CSS minifier drops the unprefixed `backdrop-filter` when the -webkit- version
  // sits next to it, which kills the blur in Chrome/Firefox. Keep both by not minifying CSS.
  vite: { build: { cssMinify: false } },
  integrations: [
    sanity({ projectId, dataset, apiVersion, useCdn: false, studioBasePath, studioRouterHistory: 'hash' }),
    react(),
  ],
});
