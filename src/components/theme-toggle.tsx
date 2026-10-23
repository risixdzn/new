'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      // ignore
    }
    setTheme(next)
    // The pointer grid re-reads its ink colour on this.
    window.dispatchEvent(new CustomEvent('themeChange', { detail: next }))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground transition-[background-color,transform] hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.94]"
    >
      <span className="relative block h-4 w-4">
        <Sun
          className={`absolute inset-0 h-4 w-4 transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${
            mounted && theme === 'dark'
              ? 'scale-100 opacity-100 blur-none'
              : 'scale-[0.25] opacity-0 blur-[4px]'
          }`}
        />
        <Moon
          className={`absolute inset-0 h-4 w-4 transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${
            mounted && theme === 'dark'
              ? 'scale-[0.25] opacity-0 blur-[4px]'
              : 'scale-100 opacity-100 blur-none'
          }`}
        />
      </span>
    </button>
  )
}
