import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
  connected?: boolean
}

export function AppShell({ children, connected = false }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="absolute z-10 left-0 top-14 -translate-y-1/2 hidden lg:flex items-center justify-center w-5 h-8 bg-[var(--surface-2)] border border-[var(--border)] rounded-r-md text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            style={{ marginLeft: collapsed ? '64px' : '240px', transition: 'margin 300ms' }}
          >
            {collapsed ? <PanelLeftOpen className="w-3 h-3" /> : <PanelLeftClose className="w-3 h-3" />}
          </button>
        </div>
        <TopBar connected={connected} />
        <main className="flex-1 overflow-y-auto bg-[var(--bg)] page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
