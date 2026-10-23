import type { AstroCookies } from 'astro'

export const TOKEN_COOKIE = 'gh_token'
export const STATE_COOKIE = 'gh_oauth_state'

// read:user for the profile and contribution calendar, gist for sync.
export const SCOPES = 'read:user gist'

// GitHub's API rejects requests without one, and Workers' fetch doesn't add it.
export const USER_AGENT = 'newtab (+https://github.com/risixdzn/new)'

export const callbackUrl = (url: URL) => new URL('/api/auth/callback', url.origin).toString()

export function cookieOptions(url: URL, maxAge: number) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: url.protocol === 'https:',
    maxAge,
  }
}

export function getToken(cookies: AstroCookies) {
  return cookies.get(TOKEN_COOKIE)?.value
}
