import type { APIRoute } from 'astro'
import { getToken, USER_AGENT } from '@/lib/server/github-auth'

export const prerender = false

// Only what the page needs: the viewer, the contribution calendar, and gists.
const ALLOWED = /^(user|graphql|gists|gists\/[0-9a-f]+)$/i

// Forwards to api.github.com with the token from the httpOnly cookie, so the
// token never reaches page JavaScript.
export const ALL: APIRoute = async ({ params, request, cookies, url }) => {
  const path = params.path ?? ''
  if (!ALLOWED.test(path)) return new Response('Not found', { status: 404 })
  if (!['GET', 'POST', 'PATCH'].includes(request.method)) {
    return new Response('Method not allowed', { status: 405 })
  }

  const token = getToken(cookies)
  if (!token) return new Response('Unauthorized', { status: 401 })

  const upstream = await fetch(`https://api.github.com/${path}${url.search}`, {
    method: request.method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': USER_AGENT,
      ...(request.method !== 'GET' && { 'Content-Type': 'application/json' }),
    },
    body: request.method === 'GET' ? undefined : await request.text(),
  })

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
