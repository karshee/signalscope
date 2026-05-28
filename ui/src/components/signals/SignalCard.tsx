import { clsx } from 'clsx'
import type { Signal } from '../../lib/api'
import { SignalBadge } from './SignalBadge'

function formatPrice(p?: number) {
  if (p == null) return '—'
  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })
}

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

interface SignalCardProps {
  signal: Signal
  onClick?: () => void
  isNew?: boolean
}

export function SignalCard({ signal, onClick, isNew = false }: SignalCardProps) {
  const isBuy = signal.direction?.toUpperCase() === 'BUY'
  const directionColor = isBuy ? 'var(--win)' : 'var(--loss)'
  const directionArrow = isBuy ? '▲' : '▼'

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-[var(--radius-lg)] border border-[var(--border)] p-4',
        'bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
        'transition-all duration-150 cursor-pointer',
        isNew && 'signal-enter'
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Channel avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[var(--text-inverse)] font-semibold"
            style={{
              background: 'var(--accent)',
              fontSize: '10px',
            }}
          >
            {(signal.channel_name || 'CH')[0].toUpperCase()}
          </div>
          <span
            className="text-[var(--text-muted)] font-medium truncate max-w-[140px]"
            style={{ fontSize: 'var(--text-sm)' }}
          >
            {signal.channel_name || 'Unknown Channel'}
          </span>
        </div>
        <span
          className="text-[var(--text-faint)] flex-shrink-0"
          style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
        >
          {timeAgo(signal.posted_at)}
        </span>
      </div>

      {/* Pair + direction */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="font-bold text-[var(--text)]"
          style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-mono)' }}
        >
          {signal.pair}
        </span>
        <span
          className="font-semibold flex items-center gap-1"
          style={{ color: directionColor, fontFamily: 'var(--font-mono)' }}
        >
          {directionArrow} {signal.direction?.toUpperCase()}
        </span>
      </div>

      {/* Price levels */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
        {signal.entry_price != null && (
          <div className="flex justify-between">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Entry</span>
            <span
              className="font-mono font-medium text-[var(--text)]"
              style={{ fontSize: 'var(--text-xs)' }}
            >
              {formatPrice(signal.entry_price)}
            </span>
          </div>
        )}
        {signal.stop_loss != null && (
          <div className="flex justify-between">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>SL</span>
            <span
              className="font-mono font-medium"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--loss)' }}
            >
              {formatPrice(signal.stop_loss)}
            </span>
          </div>
        )}
        {signal.tp1 != null && (
          <div className="flex justify-between">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>TP1</span>
            <span
              className="font-mono font-medium"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--win)' }}
            >
              {formatPrice(signal.tp1)}
            </span>
          </div>
        )}
        {signal.tp2 != null && (
          <div className="flex justify-between">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>TP2</span>
            <span
              className="font-mono font-medium"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--win)' }}
            >
              {formatPrice(signal.tp2)}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end">
        <SignalBadge status={signal.status || 'pending'} />
      </div>
    </div>
  )
}
