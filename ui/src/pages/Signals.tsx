import { useEffect, useState, useCallback } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { SignalFeed } from '../components/signals/SignalFeed'
import { SignalDetail } from '../components/signals/SignalDetail'
import { api, type Signal, type Channel } from '../lib/api'
import { useSignalFeed } from '../lib/websocket'
import { clsx } from 'clsx'

type Direction = 'ALL' | 'BUY' | 'SELL'
type Status = 'ALL' | 'active' | 'win' | 'loss' | 'expired' | 'pending'

export default function Signals() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Signal | null>(null)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  // Filters
  const [pair, setPair] = useState('')
  const [direction, setDirection] = useState<Direction>('ALL')
  const [status, setStatus] = useState<Status>('ALL')
  const [channelId, setChannelId] = useState('ALL')

  const handleWsMessage = useCallback((msg: unknown) => {
    const m = msg as { type?: string; signal?: Signal }
    if (m.type === 'new_signal' && m.signal) {
      setSignals((prev) => [m.signal!, ...prev.slice(0, 99)])
      setNewIds((prev) => new Set([...prev, m.signal!.id]))
      setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev)
          next.delete(m.signal!.id)
          return next
        })
      }, 1000)
    }
  }, [])

  const connected = useSignalFeed(handleWsMessage)

  useEffect(() => {
    const load = async () => {
      try {
        const [sigRes, chRes] = await Promise.allSettled([
          api.signals.list({ limit: 100 }),
          api.channels.list(),
        ])
        if (sigRes.status === 'fulfilled') {
          const data = sigRes.value.data
          setSignals(Array.isArray(data) ? data : [])
        }
        if (chRes.status === 'fulfilled') setChannels(chRes.value.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = signals.filter((s) => {
    if (pair && !s.pair?.toUpperCase().includes(pair.toUpperCase())) return false
    if (direction !== 'ALL' && s.direction?.toUpperCase() !== direction) return false
    if (status !== 'ALL' && s.status !== status) return false
    if (channelId !== 'ALL' && s.channel_id !== channelId) return false
    return true
  })

  const FilterBtn = ({
    label,
    active,
    onClick,
  }: {
    label: string
    active: boolean
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 rounded-[var(--radius-sm)] font-medium transition-colors',
        active
          ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent)]'
          : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)]'
      )}
      style={{ fontSize: 'var(--text-xs)' }}
    >
      {label}
    </button>
  )

  return (
    <AppShell connected={connected}>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Filter bar */}
        <div
          className="px-4 lg:px-6 py-3 border-b border-[var(--border)] flex-shrink-0"
          style={{ background: 'var(--surface)' }}
        >
          {/* Row 1: search + channel + count */}
          <div className="flex items-center gap-2 mb-2.5">
            <input
              type="text"
              placeholder="Pair… e.g. XAUUSD"
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="flex-1 min-w-0 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors"
              style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}
            />
            {channels.length > 0 && (
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="flex-shrink-0 max-w-[140px] px-2 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer"
                style={{ fontSize: 'var(--text-sm)' }}
              >
                <option value="ALL">All channels</option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            )}
            <span
              className="flex-shrink-0 text-[var(--text-muted)]"
              style={{ fontSize: 'var(--text-xs)' }}
            >
              {filtered.length}
            </span>
          </div>

          {/* Row 2: direction + status pills — horizontally scrollable */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {(['ALL', 'BUY', 'SELL'] as Direction[]).map((d) => (
              <FilterBtn key={d} label={d} active={direction === d} onClick={() => setDirection(d)} />
            ))}
            <div className="w-px flex-shrink-0 mx-0.5" style={{ background: 'var(--border)' }} />
            {(['ALL', 'active', 'win', 'loss', 'expired', 'pending'] as Status[]).map((s) => (
              <FilterBtn
                key={s}
                label={s === 'ALL' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                active={status === s}
                onClick={() => setStatus(s)}
              />
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto">
          <SignalFeed
            signals={filtered}
            onSignalClick={setSelected}
            loading={loading}
            newIds={newIds}
          />
        </div>
      </div>

      <SignalDetail signal={selected} onClose={() => setSelected(null)} />
    </AppShell>
  )
}
