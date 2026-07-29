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
    <section aria-labelledby="todo-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="todo-heading" className="font-serif text-lg">
          Todos
        </h2>
        <span className="font-sans text-xs tabular-nums text-muted-foreground">
          {remaining} left
        </span>
      </div>

      <form onSubmit={addTodo} className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task"
          className="w-full bg-transparent border-b border-border pb-1 font-sans text-sm outline-none placeholder:text-muted-foreground focus:border-foreground transition-colors"
        />
        <button
          type="submit"
          aria-label="Add task"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>

      <ul className="flex flex-col">
        {todos.length === 0 && (
          <li className="py-2 font-sans text-sm text-muted-foreground">Nothing here yet.</li>
        )}
        {ordered.map((todo) => (
          <li key={todo.id} className="group flex items-center gap-3 py-1.5">
            <button
              type="button"
              onClick={() => toggle(todo.id)}
              aria-label={todo.done ? 'Mark as not done' : 'Mark as done'}
              aria-pressed={todo.done}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                todo.done
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground'
              }`}
            >
              {todo.done && <Check className="h-3 w-3" />}
            </button>
            <span
              className={`flex-1 font-sans text-sm ${
                todo.done ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}
            >
              {todo.text}
            </span>
            <button
              type="button"
              onClick={() => remove(todo.id)}
              aria-label="Delete task"
              className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
