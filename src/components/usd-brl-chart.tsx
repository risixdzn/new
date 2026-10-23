'use client'

import { TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LineChart, type Point } from '@/components/line-chart'
import { useLocalStorage } from '@/lib/use-local-storage'
import { useCachedFetch } from '@/lib/use-cached-fetch'

type Quote = { bid: string; timestamp: string }

const RANGES = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
] as const

type RangeKey = (typeof RANGES)[number]['key']

// 90 business days covers the longest range with room to spare.
const URL = 'https://economia.awesomeapi.com.br/json/daily/USD-BRL/90'
const TTL = 1000 * 60 * 15

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})
const brlShort = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

export function UsdBrlChart() {
  const res = useCachedFetch<Quote[]>('newtab.usdbrl', URL, TTL)
  const [range, setRange] = useLocalStorage<RangeKey>('newtab.usdbrl.range', '30d')

  // Oldest first, as chart points.
  const all = useMemo<Point[]>(
    () =>
      res.status === 'ready'
        ? res.data
            .map((q) => ({ x: Number(q.timestamp) * 1000, y: Number(q.bid) }))
            .filter((p) => Number.isFinite(p.y))
            .sort((a, b) => a.x - b.x)
        : [],
    [res],
  )

  const days = RANGES.find((r) => r.key === range)?.days ?? 30
  const points = useMemo(() => {
    if (!all.length) return all
    const cutoff = all[all.length - 1].x - days * 86_400_000
    return all.filter((p) => p.x >= cutoff)
  }, [all, days])

  const last = points[points.length - 1]
  const first = points[0]
  const change = last && first ? ((last.y - first.y) / first.y) * 100 : 0
  const Trend = change >= 0 ? TrendingUp : TrendingDown

  return (
    <section
      aria-labelledby="usdbrl-heading"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="usdbrl-heading" className="font-serif text-xl font-medium tracking-tight">
            USD x BRL
          </h2>
          <p className="text-sm text-muted-foreground">Commercial rate</p>
        </div>
        <div role="group" aria-label="Time range" className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
              className={`rounded-md px-2 py-0.5 text-xs tabular-nums transition-[background-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] ${
                range === r.key
                  ? 'bg-foreground text-background'
                  : 'bg-border/50 text-muted-foreground hover:bg-border hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {res.status === 'error' && (
        <p className="rounded-xl border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
          Couldn't load the exchange rate.
        </p>
      )}

      {res.status === 'loading' && <div className="h-[178px] animate-pulse rounded-xl bg-muted/60" />}

      {res.status === 'ready' && last && (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{brl.format(last.y)}</p>
            <p
              className={`inline-flex items-center gap-1 text-sm font-medium tabular-nums ${
                change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              <Trend className="size-3.5" aria-hidden="true" />
              {change >= 0 ? '+' : ''}
              {change.toFixed(2)}%
              <span className="font-normal text-muted-foreground">in {days} days</span>
            </p>
          </div>

          <LineChart
            points={points}
            label={`USD to BRL, last ${days} days`}
            formatY={(y) => brlShort.format(y)}
            startLabel={first ? day.format(first.x) : undefined}
            endLabel={`Updated ${time.format(res.fetchedAt)}`}
            renderTooltip={(p) => (
              <>
                <span className="font-medium tabular-nums">{brl.format(p.y)}</span>
                <span className="ml-1.5 text-muted-foreground">{day.format(p.x)}</span>
              </>
            )}
          />
        </>
      )}
    </section>
  )
}
