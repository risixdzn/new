'use client'

import { Check, Copy, Plus, Search, Star, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { fuzzyMatch } from '@/lib/fuzzy'
import { useLocalStorage } from '@/lib/use-local-storage'

type Snippet = {
  id: string
  title: string
  body: string
  starred?: boolean
}

export function Snippets() {
  const [snippets, setSnippets] = useLocalStorage<Snippet[]>('newtab.snippets', [])
  const [filter, setFilter] = useState('')
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const base = filter.trim()
      ? snippets
          .map((s) => {
            const match = fuzzyMatch(filter, `${s.title} ${s.body}`)
            return match ? { snippet: s, score: match.score } : null
          })
          .filter((x): x is { snippet: Snippet; score: number } => x !== null)
          .sort((a, b) => b.score - a.score)
          .map((x) => x.snippet)
      : snippets
    // Starred snippets float to the top while preserving their relative order.
    return [...base].sort((a, b) => Number(Boolean(b.starred)) - Number(Boolean(a.starred)))
  }, [snippets, filter])

  function addSnippet(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    const b = body.trim()
    if (!t && !b) return
    setSnippets((prev) => [
      { id: crypto.randomUUID(), title: t || 'Untitled', body: b, starred: false },
      ...prev,
    ])
    setTitle('')
    setBody('')
    setAdding(false)
  }

  function remove(id: string) {
    setSnippets((prev) => prev.filter((s) => s.id !== id))
  }

  function toggleStar(id: string) {
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, starred: !s.starred } : s)),
    )
  }

  async function copy(snippet: Snippet) {
    const text = snippet.body
    let ok = false
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        ok = true
      }
    } catch {
      ok = false
    }
    if (!ok) {
      // Fallback for iframes / non-secure contexts where the Clipboard API is blocked.
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        ok = true
      } catch {
        ok = false
      }
    }
    if (ok) {
      setCopiedId(snippet.id)
      setTimeout(() => setCopiedId((cur) => (cur === snippet.id ? null : cur)), 1200)
    }
  }

  return (
    <section aria-labelledby="snippets-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="snippets-heading" className="font-serif text-lg">
          Snippets
        </h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {adding ? 'Cancel' : 'New'}
        </button>
      </div>

      {adding && (
        <form onSubmit={addSnippet} className="flex flex-col gap-2 rounded-md border border-border p-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent font-sans text-sm outline-none placeholder:text-muted-foreground"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Paste your snippet…"
            rows={3}
            className="w-full resize-y bg-transparent font-mono text-xs leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full border border-border px-3 py-1 font-sans text-xs transition-colors hover:border-foreground hover:text-foreground"
            >
              Save
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-2 border-b border-border pb-1.5 focus-within:border-foreground transition-colors">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Fuzzy find snippets"
          aria-label="Filter snippets"
          className="w-full bg-transparent font-sans text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <ul className="flex flex-col gap-2">
        {snippets.length === 0 && (
          <li className="font-sans text-sm text-muted-foreground">No snippets saved yet.</li>
        )}
        {snippets.length > 0 && filtered.length === 0 && (
          <li className="font-sans text-sm text-muted-foreground">No matches.</li>
        )}
        {filtered.map((snippet) => (
          <li
            key={snippet.id}
            className="group flex flex-col gap-1 rounded-md border border-border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-sans text-sm font-medium">{snippet.title}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleStar(snippet.id)}
                  aria-label={snippet.starred ? 'Unstar snippet' : 'Star snippet'}
                  aria-pressed={snippet.starred}
                  className={`transition-colors ${
                    snippet.starred
                      ? 'text-foreground'
                      : 'text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100'
                  }`}
                >
                  <Star
                    className="h-3.5 w-3.5"
                    fill={snippet.starred ? 'currentColor' : 'none'}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => copy(snippet)}
                  aria-label="Copy snippet"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copiedId === snippet.id ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(snippet.id)}
                  aria-label="Delete snippet"
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {snippet.body && (
              <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted-foreground">
                {snippet.body}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
