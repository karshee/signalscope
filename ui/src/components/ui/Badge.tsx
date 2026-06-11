import { clsx } from 'clsx'

type SignalStatus = 'win' | 'loss' | 'active' | 'expired' | 'pending'
type QualityTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

interface BadgeProps {
  status: SignalStatus
  className?: string
}

const statusConfig: Record<SignalStatus, { label: string; style: string }> = {
  win: {
    label: 'Win',
    style: 'bg-[var(--win-dim)] text-[var(--win)] border border-[var(--win)]',
  },
  loss: {
    label: 'Loss',
    style: 'bg-[var(--loss-dim)] text-[var(--loss)] border border-[var(--loss)]',
  },
  active: {
    label: 'Active',
    style: 'bg-[var(--active-dim)] text-[var(--active)] border border-[var(--active)]',
  },
  expired: {
    label: 'Expired',
    style: 'bg-[var(--expired-dim)] text-[var(--expired)] border border-[var(--expired)]',
  },
  pending: {
    label: 'Pending',
    style: 'bg-[var(--pending-dim)] text-[var(--pending)] border border-[var(--pending)]',
  },
}

export function Badge({ status, className }: BadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium',
        config.style,
        className
      )}
      style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.01em' }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: 'currentColor' }}
      />
      {config.label}
    </span>
  )
}

const tierConfig: Record<
  QualityTier,
  { label: string; bg: string; text: string; border: string }
> = {
  S: {
    label: 'S',
    bg: 'var(--accent-dim)',
    text: 'var(--accent)',
    border: 'var(--accent)',
  },
  A: {
    label: 'A',
    bg: 'var(--win-dim)',
    text: 'var(--win)',
    border: 'var(--win)',
  },
  B: {
    label: 'B',
    bg: 'rgba(99,102,241,0.12)',
    text: '#818cf8',
    border: '#818cf8',
  },
  C: {
    label: 'C',
    bg: 'var(--active-dim)',
    text: 'var(--active)',
    border: 'var(--active)',
  },
  D: {
    label: 'D',
    bg: 'rgba(249,115,22,0.12)',
    text: '#fb923c',
    border: '#fb923c',
  },
  F: {
    label: 'F',
    bg: 'var(--loss-dim)',
    text: 'var(--loss)',
    border: 'var(--loss)',
  },
}

interface QualityBadgeProps {
  tier: QualityTier
  className?: string
}

export function QualityBadge({ tier, className }: QualityBadgeProps) {
  const config = tierConfig[tier]
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] font-bold border',
        className
      )}
      style={{
        background: config.bg,
        color: config.text,
        borderColor: config.border,
        fontSize: 'var(--text-md)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {config.label}
    </span>
  )
}
