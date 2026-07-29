'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Persists a piece of state to localStorage.
 * Hydration-safe: starts with `initialValue` on the server and first client
 * render, then reads the stored value after mount.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) {
        setValue(JSON.parse(raw) as T)
      }
    } catch {
      // ignore malformed values
    }
    setHydrated(true)
  }, [key])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage might be full or unavailable
    }
  }, [key, value, hydrated])

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue(next)
  }, [])

  return [value, update, hydrated] as const
}
