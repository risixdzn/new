'use client'

import { useSyncExternalStore } from 'react'
import { gh } from '@/lib/github'
import { readStored, subscribeStored, writeStored } from '@/lib/use-local-storage'

/**
 * Syncs todos and snippets to a private gist.
 *
 * The first sync for a user on this device asks how to reconcile when both
 * sides have data. After that, the gist is pulled on load and when the tab
 * becomes visible, and local edits are pushed shortly after they happen.
 */

type Item = { id: string }
export type SyncData = { todos: Item[]; snippets: Item[] }
export type Resolution = 'merge' | 'local' | 'remote'

export type SyncState =
  | { status: 'idle' }
  | { status: 'syncing' }
  | { status: 'synced'; at: number }
  | { status: 'error'; message: string }
  | { status: 'conflict'; local: SyncData; remote: SyncData }

const KEYS = { todos: 'newtab.todos', snippets: 'newtab.snippets' } as const
const META_KEY = 'newtab.sync'
const FILE = 'newtab-sync.json'
const DESCRIPTION = 'New tab sync (todos and snippets)'
const PUSH_DELAY = 1500
const PULL_INTERVAL = 30_000

/** Per device: which user this device last synced with, and whether it has unpushed edits. */
type Meta = { login: string; gistId: string; dirty: boolean }

type Gist = { id: string; description: string | null; files: Record<string, { content?: string; truncated?: boolean; raw_url?: string }> }

// --- observable state -------------------------------------------------------

let state: SyncState = { status: 'idle' }
const listeners = new Set<() => void>()

function setState(next: SyncState) {
  state = next
  for (const l of listeners) l()
}

const IDLE: SyncState = { status: 'idle' }

export function useSyncState() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => IDLE,
  )
}

// --- helpers ------------------------------------------------------------------

const readMeta = () => readStored<Meta | null>(META_KEY, null)
const writeMeta = (meta: Meta) => writeStored(META_KEY, meta, 'sync')

function readLocal(): SyncData {
  return { todos: readStored<Item[]>(KEYS.todos, []), snippets: readStored<Item[]>(KEYS.snippets, []) }
}

function applyLocal(data: SyncData) {
  writeStored(KEYS.todos, data.todos, 'sync')
  writeStored(KEYS.snippets, data.snippets, 'sync')
}

const isEmpty = (d: SyncData) => d.todos.length === 0 && d.snippets.length === 0
const same = (a: SyncData, b: SyncData) => JSON.stringify(a) === JSON.stringify(b)

/** Union by id. When both sides have an item, this device's version wins. */
function mergeList(local: Item[], remote: Item[]) {
  const ids = new Set(local.map((i) => i.id))
  return [...local, ...remote.filter((i) => !ids.has(i.id))]
}

function merge(local: SyncData, remote: SyncData): SyncData {
  return { todos: mergeList(local.todos, remote.todos), snippets: mergeList(local.snippets, remote.snippets) }
}

function parse(content: string | undefined): SyncData {
  try {
    const json = JSON.parse(content ?? '{}')
    return {
      todos: Array.isArray(json.todos) ? json.todos : [],
      snippets: Array.isArray(json.snippets) ? json.snippets : [],
    }
  } catch {
    return { todos: [], snippets: [] }
  }
}

async function readGist(gist: Gist): Promise<SyncData> {
  const file = gist.files[FILE]
  if (!file) return { todos: [], snippets: [] }
  // The API truncates big files; the raw URL has the whole thing.
  if (file.truncated && file.raw_url) return parse(await fetch(file.raw_url).then((r) => r.text()))
  return parse(file.content)
}

const fileBody = (data: SyncData) => ({
  files: { [FILE]: { content: JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), ...data }, null, 2) } },
})

async function findGist(): Promise<Gist | null> {
  for (let page = 1; page <= 5; page++) {
    const list = await gh<Gist[]>(`gists?per_page=100&page=${page}`)
    const hit = list.find((g) => FILE in g.files)
    if (hit) return gh<Gist>(`gists/${hit.id}`)
    if (list.length < 100) break
  }
  return null
}

// --- engine -----------------------------------------------------------------

let login: string | null = null
let gistId: string | null = null
let pushTimer = 0
let lastPull = 0
let busy = false
let unsubscribe: (() => void) | null = null

async function push() {
  if (!login || !gistId || state.status === 'conflict') return
  setState({ status: 'syncing' })
  try {
    await gh(`gists/${gistId}`, { method: 'PATCH', body: fileBody(readLocal()) })
    writeMeta({ login, gistId, dirty: false })
    setState({ status: 'synced', at: Date.now() })
  } catch (e) {
    setState({ status: 'error', message: e instanceof Error ? e.message : 'Sync failed' })
  }
}

function schedulePush() {
  clearTimeout(pushTimer)
  pushTimer = window.setTimeout(push, PUSH_DELAY)
}

/** Fetches the gist and reconciles. Creates the gist if this user has none. */
async function pull() {
  if (!login || busy || state.status === 'conflict') return
  busy = true
  lastPull = Date.now()
  setState({ status: 'syncing' })
  try {
    const meta = readMeta()
    const firstSync = !meta || meta.login !== login

    let gist: Gist | null = null
    if (!firstSync && meta.gistId) gist = await gh<Gist>(`gists/${meta.gistId}`).catch(() => null)
    if (!gist) gist = await findGist()

    if (!gist) {
      const created = await gh<Gist>('gists', {
        method: 'POST',
        body: { description: DESCRIPTION, public: false, ...fileBody(readLocal()) },
      })
      gistId = created.id
      writeMeta({ login, gistId, dirty: false })
      setState({ status: 'synced', at: Date.now() })
      return
    }

    gistId = gist.id
    const remote = await readGist(gist)
    // Read local state only now, so edits made during the requests aren't lost.
    const local = readLocal()

    if (firstSync) {
      // Only ask when there's actually something to choose between.
      if (same(local, remote) || isEmpty(remote)) {
        writeMeta({ login, gistId, dirty: true })
        await push()
      } else if (isEmpty(local)) {
        applyLocal(remote)
        writeMeta({ login, gistId, dirty: false })
        setState({ status: 'synced', at: Date.now() })
      } else {
        setState({ status: 'conflict', local, remote })
      }
      return
    }

    if (readMeta()?.dirty) {
      // Edits made while offline or before the last push landed: keep both sides.
      applyLocal(merge(local, remote))
      writeMeta({ login, gistId, dirty: true })
      await push()
    } else {
      if (!same(local, remote)) applyLocal(remote)
      setState({ status: 'synced', at: Date.now() })
    }
  } catch (e) {
    if (state.status === 'syncing') {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'Sync failed' })
    }
  } finally {
    busy = false
  }
}

/** Answers the first-sync question. */
export async function resolveConflict(choice: Resolution) {
  if (state.status !== 'conflict' || !login || !gistId) return
  const { local, remote } = state
  const data = choice === 'local' ? local : choice === 'remote' ? remote : merge(local, remote)
  applyLocal(data)
  writeMeta({ login, gistId, dirty: true })
  setState({ status: 'syncing' })
  await push()
}

function onVisible() {
  if (document.visibilityState === 'visible' && Date.now() - lastPull > PULL_INTERVAL) pull()
}

export function startSync(user: string) {
  if (login === user) return
  stopSync()
  login = user

  unsubscribe = subscribeStored((key, source) => {
    if (source !== 'user' || (key !== KEYS.todos && key !== KEYS.snippets)) return
    const meta = readMeta()
    if (meta && meta.login === login) writeMeta({ ...meta, dirty: true })
    schedulePush()
  })
  document.addEventListener('visibilitychange', onVisible)
  pull()
}

export function stopSync() {
  clearTimeout(pushTimer)
  unsubscribe?.()
  unsubscribe = null
  document.removeEventListener('visibilitychange', onVisible)
  login = null
  gistId = null
  setState({ status: 'idle' })
}

export function syncNow() {
  if (readMeta()?.dirty) push()
  else pull()
}
