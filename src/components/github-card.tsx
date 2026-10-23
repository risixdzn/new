'use client'

import { useEffect, useState } from 'react'
import { GitHubActivity, type Contribution, type RepoContribution } from '@/components/ui/github-activity'
import { fetchContributions, useSession, type TopRepo } from '@/lib/github'

const TTL = 1000 * 60 * 30
const CARD = 'flex flex-col rounded-2xl border border-border bg-background px-5 pt-5 shadow-sm dark:bg-background'

type Cached = { contributions: Contribution[]; repos: TopRepo[]; at: number }

function readCache(login: string): Cached | null {
  try {
    const raw = localStorage.getItem(`newtab.contributions:${login}`)
    return raw ? (JSON.parse(raw) as Cached) : null
  } catch {
    return null
  }
}

function useContributions(login: string | undefined) {
  const [data, setData] = useState<Cached | null>(null)

  useEffect(() => {
    if (!login) return setData(null)
    const cached = readCache(login)
    setData(cached)
    if (cached && Date.now() - cached.at < TTL) return

    let active = true
    fetchContributions()
      .then((fresh) => {
        const entry = { ...fresh, at: Date.now() }
        try {
          localStorage.setItem(`newtab.contributions:${login}`, JSON.stringify(entry))
        } catch {
          // ignore
        }
        if (active) setData(entry)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [login])

  return data
}

export function GitHubCard() {
  const session = useSession()
  const login = session.viewer?.login
  const data = useContributions(login)

  if (session.status === 'signed-out') {
    return (
      <section className={`${CARD} items-start justify-center gap-3 pb-5`}>
        <h2 className="font-serif text-xl font-medium tracking-tight">GitHub activity</h2>
        <p className="text-sm text-pretty text-muted-foreground">
          Sign in to see your contributions, private ones included, and sync your todos and snippets to a private
          gist.
        </p>
        <a
          href="/api/auth/login"
          className="mt-1 rounded-md bg-foreground px-3.5 py-1.5 text-sm font-semibold tracking-tight text-background transition-transform active:scale-[0.97]"
        >
          Sign in with GitHub
        </a>
      </section>
    )
  }

  if (!data) return <div className={`${CARD} min-h-[300px] animate-pulse pb-5`} aria-hidden="true" />

  const repos: RepoContribution[] = data.repos.map((r) => ({
    name: r.name,
    count: r.count,
    href: r.url,
    // Own repos show their initial; others show the owner's avatar.
    logo: r.owner === login ? undefined : <img src={r.avatarUrl} alt="" />,
  }))

  return (
    <GitHubActivity
      contributions={data.contributions}
      repos={repos}
      accent="var(--foreground)"
      cellSize={13}
      showMonths
      label="Most pushed to:"
      className={`${CARD} ${repos.length ? '' : 'pb-5'}`}
      style={{ width: '100%' }}
    />
  )
}
