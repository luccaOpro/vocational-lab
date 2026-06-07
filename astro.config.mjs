// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio de producción. Afecta las URLs del sitemap y los canonical.
export default defineConfig({
  site: 'https://vlab.com.ar',
  integrations: [
    sitemap({
      // /protocolo queda fuera del sitemap: tiene datos personales de las
      // responsables y va con noindex, así que no la ofrecemos a Google.
      filter: (page) => !page.includes('/protocolo'),
    }),
  ],
});
