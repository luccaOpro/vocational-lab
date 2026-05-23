// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// ⚠️ Reemplazar con el dominio real antes de lanzar
export default defineConfig({
  site: 'https://vocationallab.com',
  integrations: [sitemap()],
});
