// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://QuellaMC.github.io',
  base: '/Account-Independent-Research-Project',
  integrations: [react()]
});