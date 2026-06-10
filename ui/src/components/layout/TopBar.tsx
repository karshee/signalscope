import { Bell, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../lib/auth'

const routeTitles: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/channels': 'Channels',
  '/app/templates': 'Templates',
  '/app/automations': 'Automations',
  '/app/settings': 'Settings',
}

interface TopBarProps {
  connected?: boolean
  onMenuClick?: () => void
}

export function TopBar({ connected = false, onMenuClick }: TopBarProps) {
  const location = useLocation()
  const { user } = useAuthStore()

  const title = Object.entries(routeTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'Tapwire'

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <header
      className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0"
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-md)] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1
          className="font-semibold text-[var(--text)]"
          style={{ fontSize: 'var(--text-lg)' }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Watcher status */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-[var(--win)] pulse-dot' : 'bg-[var(--loss)]'}`}
          />
          <span
            className="text-[var(--text-muted)]"
            style={{ fontSize: 'var(--text-sm)' }}
          >
            Watcher
          </span>
        </div>

        {/* Notification bell */}
        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-md)] transition-colors relative">
          <Bell className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-inverse)] font-semibold cursor-pointer select-none"
          style={{
            background: 'var(--accent)',
            fontSize: 'var(--text-xs)',
          }}
          title={user?.name}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
