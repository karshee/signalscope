import { clsx } from 'clsx'

type QualityTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

const tierConfig: Record<
  QualityTier,
  { label: string; description: string; bg: string; text: string; border: string; glow: string }
> = {
  S: {
    label: 'S',
    description: 'Elite',
    bg: 'var(--accent-gradient-soft)',
    text: 'var(--accent)',
    border: 'var(--accent)',
    glow: '0 0 18px rgba(0,229,179,0.3)',
  },
  A: {
    label: 'A',
    description: 'Excellent',
    bg: 'var(--win-dim)',
    text: 'var(--win)',
    border: 'var(--win)',
    glow: '0 0 16px rgba(52,217,123,0.22)',
  },
  B: {
    label: 'B',
    description: 'Good',
    bg: 'rgba(99,102,241,0.12)',
    text: '#818cf8',
    border: '#818cf8',
    glow: '0 0 16px rgba(99,102,241,0.2)',
  },
  C: {
    label: 'C',
    description: 'Average',
    bg: 'var(--active-dim)',
    text: 'var(--active)',
    border: 'var(--active)',
    glow: '0 0 16px rgba(255,178,36,0.2)',
  },
  D: {
    label: 'D',
    description: 'Below Average',
    bg: 'rgba(249,115,22,0.12)',
    text: '#fb923c',
    border: '#fb923c',
    glow: '0 0 16px rgba(249,115,22,0.2)',
  },
  F: {
    label: 'F',
    description: 'Poor',
    bg: 'var(--loss-dim)',
    text: 'var(--loss)',
    border: 'var(--loss)',
    glow: '0 0 16px rgba(255,93,108,0.2)',
  },
}

interface QualityBadgeProps {
  tier: QualityTier
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function QualityBadge({
  tier,
  size = 'md',
  showLabel = false,
  className,
}: QualityBadgeProps) {
  const config = tierConfig[tier]

  const sizeMap = {
    sm: { box: 'w-7 h-7', font: 14 },
    md: { box: 'w-10 h-10', font: 18 },
    lg: { box: 'w-14 h-14', font: 26 },
  }

  const s = sizeMap[size]

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className={clsx(
          s.box,
          'flex items-center justify-center rounded-[var(--radius-md)] font-bold border flex-shrink-0'
        )}
        style={{
          background: config.bg,
          color: config.text,
          borderColor: config.border,
          fontSize: s.font,
          fontFamily: 'var(--font-mono)',
          boxShadow: config.glow,
        }}
      >
        {config.label}
      </div>
      {showLabel && (
        <div>
          <div
            className="font-semibold text-[var(--text)]"
            style={{ fontSize: 'var(--text-sm)', color: config.text }}
          >
            Tier {config.label}
          </div>
          <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
            {config.description}
          </div>
        </div>
      )}
    </div>
  )
}
