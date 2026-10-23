import { defineConfig, envField } from 'astro/config'
import react from '@astrojs/react'
import cloudflare from '@astrojs/cloudflare'

export default defineConfig({
  integrations: [react()],
  // Pages stay static; only the routes under /api opt out of prerendering.
  adapter: cloudflare({ imageService: 'passthrough' }),
  env: {
    schema: {
      GITHUB_CLIENT_ID: envField.string({ context: 'server', access: 'secret' }),
      GITHUB_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret' }),
    },
  },
})
