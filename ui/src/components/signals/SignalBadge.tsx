import { clsx } from 'clsx'

const statusMap: Record<string, { label: string; dot: string; style: string }> = {
  win: { label: 'WIN', dot: 'bg-[var(--win)]', style: 'bg-[var(--win-dim)] text-[var(--win)] border-[var(--win)]' },
  loss: { label: 'LOSS', dot: 'bg-[var(--loss)]', style: 'bg-[var(--loss-dim)] text-[var(--loss)] border-[var(--loss)]' },
  active: { label: 'ACTIVE', dot: 'bg-[var(--active)] pulse-dot', style: 'bg-[var(--active-dim)] text-[var(--active)] border-[var(--active)]' },
  expired: { label: 'EXPIRED', dot: 'bg-[var(--expired)]', style: 'bg-[var(--expired-dim)] text-[var(--expired)] border-[var(--expired)]' },
  pending: { label: 'PENDING', dot: 'bg-[var(--pending)]', style: 'bg-[var(--pending-dim)] text-[var(--pending)] border-[var(--pending)]' },
}

interface SignalBadgeProps {
  status?: string
  className?: string
}

export function SignalBadge({ status = 'pending', className }: SignalBadgeProps) {
  const config = statusMap[status.toLowerCase()] || statusMap.pending

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-sm)] font-medium border',
        config.style,
        className
      )}
      style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      {config.label}
    </span>
  )
}
