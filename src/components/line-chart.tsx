'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

export type Point = { x: number; y: number }

type Props = {
  points: Point[]
  /** Accessible name for the chart, e.g. "USD to BRL, last 30 days". */
  label: string
  formatY: (y: number) => string
  /** Tooltip contents for the hovered point. */
  renderTooltip: (point: Point, index: number) => React.ReactNode
  /** Labels shown under the plot, at the start and end. */
  startLabel?: string
  endLabel?: string
  height?: number
}

const PAD_TOP = 10
const PAD_BOTTOM = 6
// Space on the right for the high/low labels, so the line never runs under them.
const GUTTER = 52

// Single-series line + soft area in foreground ink, with a crosshair tooltip.
export function LineChart({
  points,
  label,
  formatY,
  renderTooltip,
  startLabel,
  endLabel,
  height = 120,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const gradientId = useId()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const geo = useMemo(() => {
    if (points.length < 2 || width === 0) return null
    const ys = points.map((p) => p.y)
    const min = Math.min(...ys)
    const max = Math.max(...ys)
    // Breathing room so a flat series doesn't hug the edges.
    const span = max - min || Math.abs(max) * 0.01 || 1
    const lo = min - span * 0.08
    const hi = max + span * 0.08
    const x0 = points[0].x
    const x1 = points[points.length - 1].x
    const plotW = width - GUTTER
    const sx = (x: number) => ((x - x0) / (x1 - x0)) * plotW
    const sy = (y: number) => PAD_TOP + (1 - (y - lo) / (hi - lo)) * (height - PAD_TOP - PAD_BOTTOM)
    const xy = points.map((p) => [sx(p.x), sy(p.y)] as const)
    const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('')
    const area = `${line}L${plotW},${height}L0,${height}Z`
    return { xy, line, area, min, max, sy, plotW }
  }, [points, width, height])

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!geo) return
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left
    let best = 0
    for (let i = 1; i < geo.xy.length; i++) {
      if (Math.abs(geo.xy[i][0] - x) < Math.abs(geo.xy[best][0] - x)) best = i
    }
    setHover(best)
  }

  const active = hover !== null && geo ? geo.xy[hover] : null

  return (
    <figure className="flex flex-col gap-1.5">
      <div ref={wrapRef} data-no-grid className="relative" style={{ height }}>
        {geo && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`${label}. Low ${formatY(geo.min)}, high ${formatY(geo.max)}.`}
            className="block touch-none overflow-visible"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Recessive guides at the series high and low. */}
            {[geo.max, geo.min].map((v) => (
              <line
                key={v}
                x1={0}
                x2={geo.plotW + 6}
                y1={geo.sy(v)}
                y2={geo.sy(v)}
                stroke="var(--border)"
                strokeDasharray="3 4"
              />
            ))}

            <path d={geo.area} fill={`url(#${gradientId})`} />
            <path
              d={geo.line}
              fill="none"
              stroke="var(--foreground)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {active && (
              <>
                <line
                  x1={active[0]}
                  x2={active[0]}
                  y1={0}
                  y2={height}
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.5}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={active[0]}
                  cy={active[1]}
                  r={4}
                  fill="var(--foreground)"
                  stroke="var(--background)"
                  strokeWidth={2}
                />
              </>
            )}
          </svg>
        )}

        {/* High and low values, pinned to the right edge above their guide. */}
        {geo && (
          <>
            <span
              className="pointer-events-none absolute right-0 -translate-y-1/2 text-[11px] leading-none tabular-nums text-muted-foreground"
              style={{ top: geo.sy(geo.max) }}
            >
              {formatY(geo.max)}
            </span>
            <span
              className="pointer-events-none absolute right-0 -translate-y-1/2 text-[11px] leading-none tabular-nums text-muted-foreground"
              style={{ top: geo.sy(geo.min) }}
            >
              {formatY(geo.min)}
            </span>
          </>
        )}

        {active && hover !== null && (
          <div
            className="pointer-events-none absolute -top-2 z-10 whitespace-nowrap rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs shadow-sm"
            style={{
              left: Math.min(Math.max(active[0], 70), width - 70),
              transform: 'translate(-50%, -100%)',
            }}
          >
            {renderTooltip(points[hover], hover)}
          </div>
        )}
      </div>

      {(startLabel || endLabel) && (
        <figcaption
          className="flex justify-between text-[11px] text-muted-foreground"
          style={{ paddingRight: GUTTER }}
        >
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </figcaption>
      )}
    </figure>
  )
}
