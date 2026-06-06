// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// ⚠️ Reemplazar con el dominio real antes de lanzar
export default defineConfig({
  site: 'https://vocationallab.com',
  integrations: [
    sitemap({
      // /protocolo queda fuera del sitemap: tiene datos personales de las
      // responsables y va con noindex, así que no la ofrecemos a Google.
      filter: (page) => !page.includes('/protocolo'),
    }),
  ],
});
