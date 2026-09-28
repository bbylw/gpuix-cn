// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'
import tailwindcss from '@tailwindcss/vite'

import { docsNav } from './src/lib/nav'

const site = 'https://gpuix.dev'

export default defineConfig({
  site,
  trailingSlash: 'never',
  output: 'static',
  integrations: [
    icon(),
    react(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        const url = new URL(item.url)
        if (url.pathname === '/') {
          item.priority = 1.0
        } else if (docsNav.some((g) => g.items.some((i) => url.pathname === i.href))) {
          item.priority = 0.7
        } else {
          item.priority = 0.5
        }
        return item
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'vitesse-light',
        dark: 'vitesse-dark',
      },
      defaultColor: false,
      wrap: true,
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
