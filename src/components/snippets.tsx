"use client";

import { Check, Copy, Plus, Search, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { fuzzyMatch } from "@/lib/fuzzy";
import { useLocalStorage } from "@/lib/use-local-storage";

type Snippet = {
  id: string;
  title: string;
  body: string;
  starred?: boolean;
};

export function Snippets() {
  const [snippets, setSnippets] = useLocalStorage<Snippet[]>(
    "newtab.snippets",
    [],
  );
  const [filter, setFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const base = filter.trim()
      ? snippets
          .map((s) => {
            const match = fuzzyMatch(filter, `${s.title} ${s.body}`);
            return match ? { snippet: s, score: match.score } : null;
          })
          .filter((x): x is { snippet: Snippet; score: number } => x !== null)
          .sort((a, b) => b.score - a.score)
          .map((x) => x.snippet)
      : snippets;
    // Starred snippets float to the top while preserving their relative order.
    return [...base].sort(
      (a, b) => Number(Boolean(b.starred)) - Number(Boolean(a.starred)),
    );
  }, [snippets, filter]);

  function addSnippet(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    if (!t && !b) return;
    setSnippets((prev) => [
      {
        id: crypto.randomUUID(),
        title: t || "Untitled",
        body: b,
        starred: false,
      },
      ...prev,
    ]);
    setTitle("");
    setBody("");
    setAdding(false);
  }

  function remove(id: string) {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }

  function toggleStar(id: string) {
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, starred: !s.starred } : s)),
    );
  }

  async function copy(snippet: Snippet) {
    const text = snippet.body;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      // Fallback for iframes / non-secure contexts where the Clipboard API is blocked.
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopiedId(snippet.id);
      setTimeout(
        () => setCopiedId((cur) => (cur === snippet.id ? null : cur)),
        1200,
      );
    }
  }

  return (
    <section aria-labelledby="snippets-heading" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 id="snippets-heading" className="font-serif text-xl font-medium tracking-tight">
          Snippets
        </h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-md bg-border/50 px-2 py-0.5 text-xs text-muted-foreground transition-[background-color,color,transform] hover:bg-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
        >
          {adding ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {adding ? "Cancel" : "New"}
        </button>
      </div>

      {adding && (
        <form
          onSubmit={addSnippet}
          className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3.5 shadow-sm"
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
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
              className="rounded-md bg-foreground px-3 py-1 text-sm font-semibold tracking-tight text-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              Save
            </button>
          </div>
        </form>
      )}

      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 shadow-sm transition-colors focus-within:border-foreground/40">
        <Search
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Fuzzy find snippets"
          aria-label="Filter snippets"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <ul className="flex flex-col gap-2">
        {snippets.length === 0 && (
          <li className="rounded-xl border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
            No snippets saved yet.
          </li>
        )}
        {snippets.length > 0 && filtered.length === 0 && (
          <li className="rounded-xl border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
            No matches.
          </li>
        )}
        {filtered.map((snippet) => (
          <li
            key={snippet.id}
            className="group flex flex-col gap-1.5 rounded-xl border border-border bg-muted/40 p-3.5 transition-colors hover:bg-muted"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold tracking-tight">
                {snippet.title}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleStar(snippet.id)}
                  aria-label={
                    snippet.starred ? "Unstar snippet" : "Star snippet"
                  }
                  aria-pressed={snippet.starred}
                  className={`-m-1.5 p-1.5 transition-[color,opacity,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] ${
                    snippet.starred
                      ? "text-foreground"
                      : "text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                  }`}
                >
                  <Star
                    className={`h-3.5 w-3.5 transition-[fill] ${
                      snippet.starred ? "fill-current" : "fill-none"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => copy(snippet)}
                  aria-label="Copy snippet"
                  className="relative -m-1.5 p-1.5 text-muted-foreground transition-[color,transform] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
                >
                  <Check
                    className={`absolute inset-0 m-auto h-3.5 w-3.5 transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${
                      copiedId === snippet.id
                        ? "scale-100 opacity-100 blur-none"
                        : "scale-[0.25] opacity-0 blur-[4px]"
                    }`}
                  />
                  <Copy
                    className={`absolute inset-0 m-auto h-3.5 w-3.5 transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${
                      copiedId === snippet.id
                        ? "scale-[0.25] opacity-0 blur-[4px]"
                        : "scale-100 opacity-100 blur-none"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => remove(snippet.id)}
                  aria-label="Delete snippet"
                  className="-m-1.5 p-1.5 text-muted-foreground opacity-0 transition-[opacity,transform] hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
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
  );
}
