import type { APIRoute } from 'astro'
import { GITHUB_CLIENT_ID } from 'astro:env/server'
import { callbackUrl, cookieOptions, SCOPES, STATE_COOKIE } from '@/lib/server/github-auth'

export const prerender = false

export const GET: APIRoute = ({ url, cookies, redirect }) => {
  const state = crypto.randomUUID()
  cookies.set(STATE_COOKIE, state, cookieOptions(url, 60 * 10))

  const authorize = new URL('https://github.com/login/oauth/authorize')
  authorize.searchParams.set('client_id', GITHUB_CLIENT_ID)
  authorize.searchParams.set('redirect_uri', callbackUrl(url))
  authorize.searchParams.set('scope', SCOPES)
  authorize.searchParams.set('state', state)
  return redirect(authorize.toString(), 302)
}
