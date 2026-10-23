'use client'

import { Check, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocalStorage } from '@/lib/use-local-storage'

type Todo = {
  id: string
  text: string
  done: boolean
}

export function TodoList() {
  const [todos, setTodos] = useLocalStorage<Todo[]>('newtab.todos', [])
  const [draft, setDraft] = useState('')

  function addTodo(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setTodos((prev) => [{ id: crypto.randomUUID(), text, done: false }, ...prev])
    setDraft('')
  }

  function toggle(id: string) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function remove(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const remaining = todos.filter((t) => !t.done).length

  // Pending todos first, completed at the bottom, each group keeping insertion order.
  const ordered = useMemo(
    () => [...todos].sort((a, b) => Number(a.done) - Number(b.done)),
    [todos],
  )

  return (
    <section aria-labelledby="todo-heading" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 id="todo-heading" className="font-serif text-xl font-medium tracking-tight">
          Todos
        </h2>
        <span className="rounded-md bg-border/50 px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {remaining} left
        </span>
      </div>

      <form
        onSubmit={addTodo}
        className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background pl-3.5 pr-1 shadow-sm transition-colors focus-within:border-foreground/40"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Add task"
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color,transform] hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.94]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>

      <ul className="flex flex-col divide-y divide-dashed divide-border">
        {todos.length === 0 && (
          <li className="rounded-xl border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
            Nothing here yet.
          </li>
        )}
        {ordered.map((todo) => (
          <li key={todo.id} className="group flex items-center gap-3 px-1 py-2.5">
            <button
              type="button"
              onClick={() => toggle(todo.id)}
              aria-label={todo.done ? 'Mark as not done' : 'Mark as done'}
              aria-pressed={todo.done}
              className={`relative -my-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                todo.done
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-muted-foreground/40 hover:border-foreground'
              }`}
            >
              <Check
                className={`absolute inset-0 m-auto h-3 w-3 transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${
                  todo.done ? 'scale-100 opacity-100 blur-none' : 'scale-[0.25] opacity-0 blur-[4px]'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => toggle(todo.id)}
              aria-pressed={todo.done}
              className={`-my-1.5 min-w-0 flex-1 cursor-pointer text-left text-sm transition-colors ${
                todo.done ? 'text-muted-foreground line-through decoration-border' : 'text-foreground'
              }`}
            >
              {todo.text}
            </button>
            <button
              type="button"
              onClick={() => remove(todo.id)}
              aria-label="Delete task"
              className="-my-1.5 -ml-1.5 text-muted-foreground opacity-0 transition-[opacity,transform] hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
