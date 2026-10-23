import type { APIRoute } from 'astro'
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from 'astro:env/server'
import { callbackUrl, cookieOptions, STATE_COOKIE, TOKEN_COOKIE } from '@/lib/server/github-auth'

export const prerender = false

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const expected = cookies.get(STATE_COOKIE)?.value
  cookies.delete(STATE_COOKIE, { path: '/' })

  if (!code || !state || state !== expected) return redirect('/?auth_error=state', 302)

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl(url),
    }),
  })
  const data = (await res.json().catch(() => null)) as { access_token?: string } | null
  if (!res.ok || !data?.access_token) return redirect('/?auth_error=exchange', 302)

  // OAuth App tokens don't expire; a year keeps people signed in on new tabs.
  cookies.set(TOKEN_COOKIE, data.access_token, cookieOptions(url, 60 * 60 * 24 * 365))
  return redirect('/', 302)
}
