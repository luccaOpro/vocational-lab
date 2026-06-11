// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio de producción. Afecta las URLs del sitemap y los canonical.
export default defineConfig({
  site: 'https://vlab.com.ar',
  integrations: [
    sitemap({
      // Fuera del sitemap (van con noindex, no las ofrecemos a Google):
      // · /protocolo — datos personales de las responsables.
      // · /dossier — se comparte solo por mail/WhatsApp; al final tiene
      //   la ficha con los valores del servicio.
      filter: (page) => !page.includes('/protocolo') && !page.includes('/dossier'),
    }),
  ],
});
