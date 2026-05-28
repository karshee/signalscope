import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Signal } from '../../lib/api'
import { SignalBadge } from './SignalBadge'

function formatPrice(p?: number) {
  if (p == null) return '—'
  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })
}

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

interface SignalDetailProps {
  signal: Signal | null
  onClose: () => void
}

export function SignalDetail({ signal, onClose }: SignalDetailProps) {
  useEffect(() => {
    if (!signal) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [signal, onClose])

  if (!signal) return null

  const isBuy = signal.direction?.toUpperCase() === 'BUY'
  const directionColor = isBuy ? 'var(--win)' : 'var(--loss)'
  const directionArrow = isBuy ? '▲' : '▼'

  const priceFields = [
    { label: 'ENTRY', value: signal.entry_price },
    { label: 'STOP LOSS', value: signal.stop_loss },
    { label: 'TP1', value: signal.tp1 },
    { label: 'TP2', value: signal.tp2 },
  ].filter((f) => f.value != null)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-[400px] z-50 flex flex-col border-l border-[var(--border)] overflow-hidden"
        style={{
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'drawerIn 250ms cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      >
        <style>{`
          @keyframes drawerIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
            Signal Detail
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-sm)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Pair + Status */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="font-bold text-[var(--text)]"
                  style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-mono)' }}
                >
                  {signal.pair}
                </span>
                <span
                  className="font-semibold"
                  style={{ color: directionColor, fontSize: 'var(--text-xl)', fontFamily: 'var(--font-mono)' }}
                >
                  {directionArrow} {signal.direction?.toUpperCase()}
                </span>
              </div>
              <span
                className="text-[var(--text-muted)]"
                style={{ fontSize: 'var(--text-sm)' }}
              >
                {signal.channel_name || 'Unknown Channel'} · {timeAgo(signal.posted_at)}
              </span>
            </div>
            <SignalBadge status={signal.status || 'pending'} />
          </div>

          {/* Price grid */}
          {priceFields.length > 0 && (
            <div>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${Math.min(priceFields.length, 2)}, 1fr)` }}
              >
                {priceFields.map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-[var(--radius-md)] p-3"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <div
                      className="text-[var(--text-muted)] mb-1"
                      style={{ fontSize: 'var(--text-xs)' }}
                    >
                      {label}
                    </div>
                    <div
                      className="font-semibold text-[var(--text)]"
                      style={{ fontSize: 'var(--text-md)', fontFamily: 'var(--font-mono)' }}
                    >
                      {formatPrice(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TP3 if present */}
          {signal.tp3 != null && (
            <div
              className="rounded-[var(--radius-md)] p-3"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="text-[var(--text-muted)] mb-1" style={{ fontSize: 'var(--text-xs)' }}>
                TP3
              </div>
              <div
                className="font-semibold text-[var(--text)]"
                style={{ fontSize: 'var(--text-md)', fontFamily: 'var(--font-mono)' }}
              >
                {formatPrice(signal.tp3)}
              </div>
            </div>
          )}

          {/* Pips result if resolved */}
          {signal.pips_result != null && (
            <div
              className="rounded-[var(--radius-md)] p-3 flex items-center justify-between"
              style={{
                background: signal.pips_result >= 0 ? 'var(--win-dim)' : 'var(--loss-dim)',
                border: `1px solid ${signal.pips_result >= 0 ? 'var(--win)' : 'var(--loss)'}`,
              }}
            >
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                Result
              </span>
              <span
                className="font-bold"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-lg)',
                  color: signal.pips_result >= 0 ? 'var(--win)' : 'var(--loss)',
                }}
              >
                {signal.pips_result >= 0 ? '+' : ''}{signal.pips_result} pips
              </span>
            </div>
          )}

          {/* Original message */}
          {signal.raw_text && (
            <div>
              <div
                className="font-medium text-[var(--text-muted)] mb-2 flex items-center gap-2"
                style={{ fontSize: 'var(--text-xs)' }}
              >
                <span className="h-px flex-1 bg-[var(--border)]" />
                ORIGINAL MESSAGE
                <span className="h-px flex-1 bg-[var(--border)]" />
              </div>
              <div
                className="rounded-[var(--radius-md)] p-3 text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap"
                style={{ background: 'var(--surface-2)', fontSize: 'var(--text-sm)' }}
              >
                {signal.raw_text}
              </div>
            </div>
          )}

          {/* Parse confidence */}
          {signal.confidence != null && (
            <div>
              <div
                className="font-medium text-[var(--text-muted)] mb-2 flex items-center gap-2"
                style={{ fontSize: 'var(--text-xs)' }}
              >
                <span className="h-px flex-1 bg-[var(--border)]" />
                PARSE CONFIDENCE
                <span className="h-px flex-1 bg-[var(--border)]" />
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(signal.confidence * 100)}%`,
                      background:
                        signal.confidence > 0.8
                          ? 'var(--win)'
                          : signal.confidence > 0.5
                          ? 'var(--active)'
                          : 'var(--loss)',
                    }}
                  />
                </div>
                <span
                  className="font-semibold flex-shrink-0"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text)',
                  }}
                >
                  {Math.round(signal.confidence * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
