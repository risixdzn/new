'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

/**
 * Who wrote a value: the user through the UI, the sync engine, or another tab.
 * The sync engine only pushes on 'user' writes.
 */
export type WriteSource = 'user' | 'sync' | 'tab'

type Listener = (key: string, source: WriteSource) => void

const listeners = new Set<Listener>()
// Parsed values, so every reader of a key gets the same reference.
const cache = new Map<string, unknown>()

function emit(key: string, source: WriteSource) {
  for (const l of listeners) l(key, source)
}

if (typeof window !== 'undefined') {
  // Keep every open tab in step.
  window.addEventListener('storage', (e) => {
    if (!e.key) return
    cache.delete(e.key)
    emit(e.key, 'tab')
  })
}

export function readStored<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T
  let value = fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw !== null) value = JSON.parse(raw) as T
  } catch {
    // ignore malformed values
  }
  cache.set(key, value)
  return value
}

export function writeStored<T>(key: string, value: T, source: WriteSource) {
  cache.set(key, value)
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage might be full or unavailable
  }
  emit(key, source)
}

export function subscribeStored(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Persists a piece of state to localStorage, shared by every component using
 * the same key. Hydration-safe: renders `initialValue` on the server and during
 * hydration, then the stored value.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const value = useSyncExternalStore(
    useCallback((onChange) => subscribeStored((k) => k === key && onChange()), [key]),
    () => readStored(key, initialValue),
    () => initialValue,
  )

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readStored(key, initialValue)
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      writeStored(key, resolved, 'user')
    },
    // initialValue is only a fallback; callers pass literals that change identity each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  return [hydrated ? value : initialValue, update, hydrated] as const
}
