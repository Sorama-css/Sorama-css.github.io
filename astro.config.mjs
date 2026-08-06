import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://Sorama-css.github.io',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
