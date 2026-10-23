'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Menu } from '@base-ui/react/menu'
import { GitMerge, HardDrive, Cloud, LogOut, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { signOut, useSession } from '@/lib/github'
import { resolveConflict, startSync, stopSync, syncNow, useSyncState, type Resolution, type SyncData } from '@/lib/sync'

function GithubMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  )
}

const timeFmt = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' })

export function Account() {
  const session = useSession()
  const sync = useSyncState()
  const login = session.viewer?.login

  useEffect(() => {
    if (login) startSync(login)
    else if (session.status === 'signed-out') stopSync()
  }, [login, session.status])

  if (session.status === 'loading') return <div className="size-9" aria-hidden="true" />

  if (session.status === 'signed-out') {
    return (
      <a
        href="/api/auth/login"
        className="flex h-9 items-center gap-2 rounded-md bg-foreground px-3.5 text-sm font-semibold tracking-tight text-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
      >
        <GithubMark className="size-4" />
        Sign in
      </a>
    )
  }

  const { viewer } = session
  const statusText =
    sync.status === 'syncing'
      ? 'Syncing…'
      : sync.status === 'synced'
        ? `Synced at ${timeFmt.format(sync.at)}`
        : sync.status === 'error'
          ? `Sync failed: ${sync.message}`
          : sync.status === 'conflict'
            ? 'Waiting for your choice'
            : 'Not synced'

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          aria-label={`Account: ${viewer.login}`}
          className="relative flex size-9 items-center justify-center rounded-md border border-border transition-[background-color,transform] hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.94] data-[popup-open]:bg-accent"
        >
          <img src={viewer.avatarUrl} alt="" className="size-6 rounded-[4px]" />
          {(sync.status === 'syncing' || sync.status === 'error') && (
            <span
              aria-hidden="true"
              className={`absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-background ${
                sync.status === 'error' ? 'bg-red-500' : 'animate-pulse bg-muted-foreground'
              }`}
            />
          )}
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={8} align="end" className="z-50">
            <Menu.Popup className="w-60 origin-[var(--transform-origin)] rounded-xl border border-border bg-background p-1.5 shadow-lg transition-[opacity,scale] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-semibold tracking-tight">{viewer.name ?? viewer.login}</p>
                <p className="truncate text-xs text-muted-foreground">@{viewer.login}</p>
                <p className="mt-1.5 text-xs text-muted-foreground" aria-live="polite">
                  {statusText}
                </p>
              </div>
              <Menu.Separator className="mx-1 my-1 border-t border-dashed border-border" />
              <Menu.Item
                onClick={syncNow}
                disabled={sync.status === 'syncing' || sync.status === 'conflict'}
                className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent"
              >
                <RefreshCw className="size-3.5 text-muted-foreground" />
                Sync now
              </Menu.Item>
              <Menu.Item
                onClick={signOut}
                className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-accent"
              >
                <LogOut className="size-3.5 text-muted-foreground" />
                Sign out
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {sync.status === 'conflict' && <FirstSyncDialog local={sync.local} remote={sync.remote} />}
    </>
  )
}

const count = (d: SyncData) => {
  const t = `${d.todos.length} ${d.todos.length === 1 ? 'todo' : 'todos'}`
  const s = `${d.snippets.length} ${d.snippets.length === 1 ? 'snippet' : 'snippets'}`
  return `${t}, ${s}`
}

function FirstSyncDialog({ local, remote }: { local: SyncData; remote: SyncData }) {
  const options: { choice: Resolution; title: string; hint: string; icon: typeof GitMerge }[] = [
    { choice: 'merge', title: 'Merge both', hint: 'Keep everything from this browser and from GitHub.', icon: GitMerge },
    { choice: 'local', title: 'Keep this browser', hint: `Use ${count(local)} and replace what's on GitHub.`, icon: HardDrive },
    { choice: 'remote', title: 'Keep GitHub', hint: `Use ${count(remote)} and replace what's here.`, icon: Cloud },
  ]

  return (
    // No way to dismiss: sync stays paused until a choice is made.
    <AlertDialog.Root open>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-1.5 shadow-lg">
          <div className="px-4 pb-3 pt-4">
            <AlertDialog.Title className="font-serif text-xl font-medium tracking-tight">
              Sync your lists
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-1 text-sm text-pretty text-muted-foreground">
              This browser has {count(local)}. Your GitHub gist has {count(remote)}. How should they be combined?
            </AlertDialog.Description>
          </div>
          <ul className="divide-y divide-dashed divide-border border-t border-dashed border-border">
            {options.map(({ choice, title, hint, icon: Icon }) => (
              <li key={choice}>
                <button
                  type="button"
                  onClick={() => resolveConflict(choice)}
                  className="group flex w-full items-center gap-4 rounded-xl px-3.5 py-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-accent/50 text-muted-foreground transition-[color,transform] duration-300 group-hover:-rotate-6 group-hover:text-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{title}</span>
                    <span className="block text-sm text-muted-foreground">{hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
