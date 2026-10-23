'use client'

import { useEffect, useSyncExternalStore } from 'react'
import type { Contribution, ContributionLevel } from '@/components/ui/github-activity'

export type Viewer = { login: string; name: string | null; avatarUrl: string }

export type Session =
  | { status: 'loading'; viewer: null }
  | { status: 'signed-out'; viewer: null }
  | { status: 'signed-in'; viewer: Viewer }

// Everything goes through our proxy, which attaches the token from the cookie.
export async function gh<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/github/${path}`, {
    method: init?.method ?? 'GET',
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  })
  if (res.status === 401) {
    setSession({ status: 'signed-out', viewer: null })
    throw new Error('unauthorized')
  }
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  return res.json() as Promise<T>
}

// --- session store, shared across islands -----------------------------------

const VIEWER_KEY = 'newtab.viewer'

const LOADING: Session = { status: 'loading', viewer: null }
let session: Session = LOADING
const listeners = new Set<() => void>()
let started = false

function setSession(next: Session) {
  session = next
  try {
    if (next.status === 'signed-in') localStorage.setItem(VIEWER_KEY, JSON.stringify(next.viewer))
    if (next.status === 'signed-out') localStorage.removeItem(VIEWER_KEY)
  } catch {
    // ignore
  }
  for (const l of listeners) l()
}

function startSession() {
  if (started) return
  started = true

  // Show the last known user straight away; the request below confirms it.
  try {
    const cached = localStorage.getItem(VIEWER_KEY)
    if (cached) setSession({ status: 'signed-in', viewer: JSON.parse(cached) })
  } catch {
    // ignore
  }

  gh<{ login: string; name: string | null; avatar_url: string }>('user')
    .then((u) =>
      setSession({ status: 'signed-in', viewer: { login: u.login, name: u.name, avatarUrl: u.avatar_url } }),
    )
    .catch(() => {
      // 401 already signed us out. Anything else (offline, rate limit) keeps
      // the cached viewer, if there was one.
      if (session.status === 'loading') setSession({ status: 'signed-out', viewer: null })
    })
}

export function useSession(): Session {
  useEffect(startSession, [])
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => session,
    // The static HTML knows nothing about the session, so hydrate as loading.
    () => LOADING,
  )
}

export async function signOut() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  setSession({ status: 'signed-out', viewer: null })
}

// --- contributions ------------------------------------------------------------

export type TopRepo = { name: string; url: string; owner: string; avatarUrl: string; count: number }

const LEVELS: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
}

const CONTRIBUTIONS_QUERY = `
  query {
    viewer {
      contributionsCollection {
        contributionCalendar {
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
        commitContributionsByRepository(maxRepositories: 3) {
          repository { name url owner { login avatarUrl } }
          contributions { totalCount }
        }
      }
    }
  }
`

type CalendarResponse = {
  data?: {
    viewer: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[]
        }
        commitContributionsByRepository: {
          repository: { name: string; url: string; owner: { login: string; avatarUrl: string } }
          contributions: { totalCount: number }
        }[]
      }
    }
  }
}

/** The viewer's full calendar (private contributions included) and top repos. */
export async function fetchContributions() {
  const res = await gh<CalendarResponse>('graphql', {
    method: 'POST',
    body: { query: CONTRIBUTIONS_QUERY },
  })
  const collection = res.data?.viewer.contributionsCollection
  if (!collection) throw new Error('No contribution data')

  // GitHub's weeks already start on Sunday, which the heatmap columns rely on.
  const contributions: Contribution[] = collection.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: LEVELS[d.contributionLevel] ?? 0,
    })),
  )
  const repos: TopRepo[] = collection.commitContributionsByRepository.map((r) => ({
    name: r.repository.name,
    url: r.repository.url,
    owner: r.repository.owner.login,
    avatarUrl: r.repository.owner.avatarUrl,
    count: r.contributions.totalCount,
  }))
  return { contributions, repos }
}
