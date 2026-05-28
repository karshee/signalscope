import { clsx } from 'clsx'
import { MoreHorizontal, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Channel } from '../../lib/api'
import { QualityBadge } from '../ui/Badge'

interface ChannelCardProps {
  channel: Channel
  onMenuClick?: (e: React.MouseEvent) => void
}

type QualityTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

function isValidTier(t?: string): t is QualityTier {
  return ['S', 'A', 'B', 'C', 'D', 'F'].includes(t || '')
}

export function ChannelCard({ channel, onMenuClick }: ChannelCardProps) {
  const navigate = useNavigate()
  const tier = isValidTier(channel.quality_tier) ? channel.quality_tier : undefined

  return (
    <div
      className={clsx(
        'rounded-[var(--radius-lg)] border border-[var(--border)] p-5',
        'bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
        'transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]',
        'flex flex-col gap-4'
      )}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-[var(--text-inverse)]"
          style={{ background: 'var(--accent)', fontSize: '15px' }}
        >
          {channel.title?.[0]?.toUpperCase() || 'C'}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-[var(--text)] truncate"
            style={{ fontSize: 'var(--text-md)' }}
          >
            {channel.title}
          </div>
          <div
            className="text-[var(--text-muted)] truncate"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            @{channel.username}
          </div>
        </div>

        {tier && <QualityBadge tier={tier} />}
      </div>

      {/* Score row */}
      {channel.quality_score != null && (
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--surface-3)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${channel.quality_score}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
          <span
            className="text-[var(--text-muted)] flex-shrink-0"
            style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
          >
            {channel.quality_score}/100
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-[var(--border)]" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div
            className="font-semibold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)' }}
          >
            {channel.win_rate != null ? `${Math.round(channel.win_rate)}%` : '—'}
          </div>
          <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
            Win Rate
          </div>
        </div>
        <div>
          <div
            className="font-semibold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)' }}
          >
            {channel.avg_rr != null ? `${channel.avg_rr.toFixed(1)}x` : '—'}
          </div>
          <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
            R:R
          </div>
        </div>
        <div>
          <div
            className="font-semibold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)' }}
          >
            {channel.signal_count ?? '—'}
          </div>
          <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
            Signals
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border)]" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              'w-1.5 h-1.5 rounded-full',
              channel.is_active ? 'bg-[var(--win)] pulse-dot' : 'bg-[var(--expired)]'
            )}
          />
          <span
            className="text-[var(--text-muted)]"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            {channel.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/app/channels/${channel.id}`)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-sm)] text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-colors font-medium"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            View <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={onMenuClick}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-sm)] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
