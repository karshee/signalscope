import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8">
      {icon && (
        <div
          className="w-16 h-16 rounded-[var(--radius-xl)] flex items-center justify-center mb-5 text-[var(--accent)] border border-[var(--border)] float-y"
          style={{
            background: 'var(--accent-gradient-soft)',
            boxShadow: '0 0 32px rgba(0, 229, 179, 0.10)',
          }}
        >
          {icon}
        </div>
      )}
      <h3
        className="font-semibold text-[var(--text)] mb-2"
        style={{ fontSize: 'var(--text-lg)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-[var(--text-muted)] max-w-sm mb-6"
          style={{ fontSize: 'var(--text-sm)' }}
        >
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
