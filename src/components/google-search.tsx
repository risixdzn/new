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
      <div className="flex items-center gap-3 border-b border-border pb-2 focus-within:border-foreground transition-colors">
        {askGpt ? (
          <Sparkles className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <input
          id="web-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={askGpt ? 'Ask ChatGPT anything' : 'Search the web'}
          autoComplete="off"
          className="w-full bg-transparent font-sans text-base outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => setAskGpt((v) => !v)}
          aria-pressed={askGpt}
          aria-label="Toggle ChatGPT mode"
          className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-sans text-xs transition-colors ${
            askGpt
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          GPT
        </button>
      </div>
    </form>
  )
}
