import type { APIRoute } from 'astro'
import { TOKEN_COOKIE } from '@/lib/server/github-auth'

export const prerender = false

export const POST: APIRoute = ({ cookies }) => {
  cookies.delete(TOKEN_COOKIE, { path: '/' })
  return new Response(null, { status: 204 })
}
