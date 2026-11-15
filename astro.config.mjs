// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The site is built for its long-term home (https://powertothe.fan) but can be built for any
// host: SITE_URL=https://staging.example.com npm run build
const site = process.env.SITE_URL ?? 'https://powertothe.fan';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [sitemap()],
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  // Hash-based Content-Security-Policy for every inline script and style Astro emits.
  security: { csp: true },
  markdown: { syntaxHighlight: false },
});
