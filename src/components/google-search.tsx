'use client'

import { Search, Sparkles } from 'lucide-react'
import { useState } from 'react'

export function GoogleSearch() {
  const [query, setQuery] = useState('')
  const [askGpt, setAskGpt] = useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    const url = askGpt
      ? `https://chatgpt.com/?q=${encodeURIComponent(q)}`
      : `https://www.google.com/search?q=${encodeURIComponent(q)}`
    window.location.href = url
  }

  return (
    <form onSubmit={onSubmit} role="search" className="w-full">
      <label htmlFor="web-search" className="sr-only">
        {askGpt ? 'Ask ChatGPT' : 'Search Google'}
      </label>
      <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-background pl-4 pr-1.5 shadow-sm transition-colors focus-within:border-foreground/40">
        <span className="relative block h-4 w-4 shrink-0">
          <Search
            className={`absolute inset-0 h-4 w-4 text-muted-foreground transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${
              askGpt ? 'scale-[0.25] opacity-0 blur-[4px]' : 'scale-100 opacity-100 blur-none'
            }`}
            aria-hidden="true"
          />
          <Sparkles
            className={`absolute inset-0 h-4 w-4 text-foreground transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${
              askGpt ? 'scale-100 opacity-100 blur-none' : 'scale-[0.25] opacity-0 blur-[4px]'
            }`}
            aria-hidden="true"
          />
        </span>
        <input
          id="web-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={askGpt ? 'Ask ChatGPT anything' : 'Search the web'}
          autoComplete="off"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => setAskGpt((v) => !v)}
          aria-pressed={askGpt}
          aria-label="Toggle ChatGPT mode"
          className={`flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-[background-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] ${
            askGpt
              ? 'bg-foreground text-background'
              : 'bg-border/50 text-muted-foreground hover:bg-border hover:text-foreground'
          }`}
        >
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          GPT
        </button>
      </div>
    </form>
  )
}
