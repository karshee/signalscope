import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Radio, FileText, Workflow, Settings, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '../../lib/auth'

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/channels', icon: Radio, label: 'Channels' },
  { to: '/app/templates', icon: FileText, label: 'Templates' },
  { to: '/app/automations', icon: Workflow, label: 'Automations' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  collapsed?: boolean
  onClose?: () => void
}

export function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <aside
      className={clsx(
        'flex flex-col h-full border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          'flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]',
          collapsed && 'justify-center px-0'
        )}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="flex-shrink-0">
          <circle cx="16" cy="16" r="13" stroke="var(--accent)" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="7" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
          <line x1="2" y1="16" x2="8" y2="16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="24" y1="16" x2="30" y2="16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="2" x2="16" y2="8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="24" x2="16" y2="30" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2.5" fill="var(--accent)" />
        </svg>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="font-bold gradient-text"
              style={{ fontSize: 'var(--text-md)', letterSpacing: '-0.01em' }}
            >
              Tapwire
            </span>
            <span
              className="px-1.5 py-0.5 rounded-full border border-[var(--border-strong)] text-[var(--accent)] font-semibold uppercase flex-shrink-0"
              style={{ fontSize: '9px', letterSpacing: '0.06em', background: 'var(--accent-dim)' }}
            >
              beta
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-all duration-200 relative',
                'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] hover:translate-x-[2px]',
                isActive && [
                  'text-[var(--accent)] hover:text-[var(--accent)] hover:bg-transparent hover:translate-x-0',
                  'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-6 before:rounded-r-full before:[background:var(--accent-gradient)]',
                ],
                collapsed && 'justify-center px-0'
              )
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'var(--accent-gradient-soft)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(0, 229, 179, 0.14), 0 0 18px rgba(0, 229, 179, 0.08)',
                  }
                : undefined
            }
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && (
              <span style={{ fontSize: 'var(--text-sm)' }} className="font-medium">
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-[var(--border)] p-3">
        <div
          className={clsx(
            'glass rounded-[var(--radius-lg)] flex items-center gap-3',
            collapsed ? 'flex-col gap-2 p-2' : 'p-2.5'
          )}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[var(--text-inverse)] font-semibold"
            style={{
              background: 'var(--accent-gradient)',
              fontSize: 'var(--text-xs)',
              boxShadow: '0 0 12px rgba(0, 229, 179, 0.25)',
            }}
          >
            {initials}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div
                className="font-medium text-[var(--text)] truncate"
                style={{ fontSize: 'var(--text-sm)' }}
              >
                {user?.name || 'User'}
              </div>
              <span
                className="inline-flex px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--accent-dim)] text-[var(--accent)] font-medium capitalize"
                style={{ fontSize: 'var(--text-xs)' }}
              >
                {user?.plan || 'free'}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--loss)] hover:bg-[var(--loss-dim)] rounded-[var(--radius-sm)] transition-colors flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
