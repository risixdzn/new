import { defineConfig, envField } from 'astro/config'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'

export default defineConfig({
  integrations: [react()],
  // Pages stay static; only the routes under /api opt out of prerendering.
  adapter: vercel(),
  env: {
    schema: {
      GITHUB_CLIENT_ID: envField.string({ context: 'server', access: 'secret' }),
      GITHUB_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret' }),
    },
  },
})
