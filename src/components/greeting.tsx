'use client'

import { useEffect, useState } from 'react'

const NAME = 'Ricardo'

function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good night'
}

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function Greeting() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(id)
  }, [])

  const greeting = now ? greetingFor(now.getHours()) : 'Hello'

  return (
    <header className="flex animate-slide-in-top flex-col items-center gap-2 text-center">
      <h1 className="font-serif text-4xl font-medium tracking-tight text-balance md:text-5xl">
        {greeting}, <span className="italic">{NAME}</span>
      </h1>
      <p className="text-sm tabular-nums text-muted-foreground">
        {now ? formatClock(now) : '\u00A0'}
      </p>
    </header>
  )
}
