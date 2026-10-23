'use client'

import { useEffect, useState } from 'react'

type State<T> =
  | { status: 'loading'; data: null }
  | { status: 'ready'; data: T; fetchedAt: number }
  | { status: 'error'; data: null }

/**
 * Fetches JSON and caches it in localStorage for `ttlMs`, so opening a bunch of
 * tabs doesn't hit the API every time. A stale cache is still shown if the
 * network request fails.
 */
export function useCachedFetch<T>(key: string, url: string, ttlMs: number): State<T> {
  const [state, setState] = useState<State<T>>({ status: 'loading', data: null })

  useEffect(() => {
    let cancelled = false
    let cached: { data: T; fetchedAt: number } | null = null
    try {
      const raw = localStorage.getItem(key)
      if (raw) cached = JSON.parse(raw)
    } catch {
      // ignore
    }

    if (cached) setState({ status: 'ready', ...cached })
    if (cached && Date.now() - cached.fetchedAt < ttlMs) return

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json() as Promise<T>
      })
      .then((data) => {
        if (cancelled) return
        const entry = { data, fetchedAt: Date.now() }
        try {
          localStorage.setItem(key, JSON.stringify(entry))
        } catch {
          // ignore
        }
        setState({ status: 'ready', ...entry })
      })
      .catch(() => {
        if (!cancelled && !cached) setState({ status: 'error', data: null })
      })

    return () => {
      cancelled = true
    }
  }, [key, url, ttlMs])

  return state
}
