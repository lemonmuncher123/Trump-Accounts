// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://lemonmuncher123.github.io',
  base: '/Trump-Accounts',
  integrations: [react()]
});