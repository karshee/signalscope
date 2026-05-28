import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { QualityBadge } from '../components/channels/QualityBadge'
import { api, type LeaderboardEntry } from '../lib/api'
import { clsx } from 'clsx'

type Window = '7d' | '30d' | '90d'
type MinSignals = 10 | 25 | 50

type QualityTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
function isValidTier(t?: string): t is QualityTier {
  return ['S', 'A', 'B', 'C', 'D', 'F'].includes(t || '')
}

const RANK_COLORS: Record<number, string> = {
  1: '#f59e0b',
  2: '#9ca3af',
  3: '#cd7f32',
}

type SortKey = 'quality_score' | 'win_rate' | 'avg_rr' | 'entry_accuracy' | 'signal_count'

export default function Leaderboard() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [window_, setWindow] = useState<Window>('30d')
  const [minSignals, setMinSignals] = useState<MinSignals>(10)
  const [sortBy, setSortBy] = useState<SortKey>('quality_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.scores.leaderboard({
          window: window_,
          min_signals: minSignals,
        })
        setEntries(res.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [window_, minSignals])

  const sorted = [...entries].sort((a, b) => {
    const av = (a[sortBy] ?? 0) as number
    const bv = (b[sortBy] ?? 0) as number
    return sortDir === 'desc' ? bv - av : av - bv
  })

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setSortDir('desc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span style={{ opacity: sortBy === k ? 1 : 0.3, marginLeft: '4px' }}>
      {sortBy === k ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  )

  const FilterBtn = ({
    active,
    label,
    onClick,
  }: {
    active: boolean
    label: string
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 rounded-[var(--radius-sm)] font-medium transition-colors border',
        active
          ? 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent)]'
          : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
      )}
      style={{ fontSize: 'var(--text-xs)' }}
    >
      {label}
    </button>
  )

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-1">
            <span className="text-[var(--text-muted)] mr-2" style={{ fontSize: 'var(--text-sm)' }}>
              Timeframe:
            </span>
            {(['7d', '30d', '90d'] as Window[]).map((w) => (
              <FilterBtn key={w} active={window_ === w} label={w} onClick={() => setWindow(w)} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[var(--text-muted)] mr-2" style={{ fontSize: 'var(--text-sm)' }}>
              Min signals:
            </span>
            {([10, 25, 50] as MinSignals[]).map((n) => (
              <FilterBtn key={n} active={minSignals === n} label={`${n}+`} onClick={() => setMinSignals(n)} />
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(8)].map((_, i) => <SkeletonBlock key={i} height={52} />)}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<Trophy className="w-7 h-7" />}
            title="Not enough data"
            description="Add at least 3 channels and wait for signals to resolve."
            action={{ label: 'Add Channels', onClick: () => navigate('/app/channels') }}
          />
        ) : (
          <div
            className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden"
            style={{ background: 'var(--surface)' }}
          >
            <table className="w-full border-collapse" style={{ fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-4 py-3 w-12 font-medium" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>#</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Channel</th>
                  <th className="text-left px-3 py-3 font-medium" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Tier</th>
                  <th
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)]"
                    style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}
                    onClick={() => handleSort('signal_count')}
                  >
                    Signals <SortIcon k="signal_count" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)]"
                    style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}
                    onClick={() => handleSort('win_rate')}
                  >
                    Win% <SortIcon k="win_rate" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)]"
                    style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}
                    onClick={() => handleSort('avg_rr')}
                  >
                    Avg R:R <SortIcon k="avg_rr" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)]"
                    style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}
                    onClick={() => handleSort('entry_accuracy')}
                  >
                    Entry% <SortIcon k="entry_accuracy" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)]"
                    style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}
                    onClick={() => handleSort('quality_score')}
                  >
                    Score <SortIcon k="quality_score" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, i) => {
                  const rank = i + 1
                  const tier = isValidTier(entry.quality_tier) ? entry.quality_tier : undefined
                  const rankColor = RANK_COLORS[rank]

                  return (
                    <tr
                      key={entry.channel_id}
                      className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                      style={{ animation: `pageFadeIn 200ms ease ${i * 50}ms both` }}
                      onClick={() => navigate(`/app/channels/${entry.channel_id}`)}
                    >
                      {/* Rank */}
                      <td className="px-4 py-3">
                        {rank <= 3 ? (
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[var(--text-inverse)] inline-flex"
                            style={{
                              background: rankColor,
                              fontSize: 'var(--text-xs)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {rank}
                          </span>
                        ) : (
                          <span
                            className="text-[var(--text-faint)]"
                            style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
                          >
                            {rank}
                          </span>
                        )}
                      </td>

                      {/* Channel */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[var(--text-inverse)] flex-shrink-0"
                            style={{ background: 'var(--accent)', fontSize: '12px' }}
                          >
                            {entry.title?.[0]?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--text)]" style={{ fontSize: 'var(--text-sm)' }}>
                              {entry.title}
                            </div>
                            <div className="text-[var(--text-faint)]" style={{ fontSize: 'var(--text-xs)' }}>
                              @{entry.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="px-3 py-3">
                        {tier ? <QualityBadge tier={tier} size="sm" /> : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                      </td>

                      {/* Signals */}
                      <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {entry.signal_count}
                      </td>

                      {/* Win% */}
                      <td
                        className="px-4 py-3 text-right font-semibold"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: (entry.win_rate ?? 0) >= 50 ? 'var(--win)' : 'var(--loss)',
                        }}
                      >
                        {entry.win_rate != null ? `${Math.round(entry.win_rate)}%` : '—'}
                      </td>

                      {/* R:R */}
                      <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                        {entry.avg_rr != null ? `${entry.avg_rr.toFixed(1)}x` : '—'}
                      </td>

                      {/* Entry% */}
                      <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {entry.entry_accuracy != null ? `${Math.round(entry.entry_accuracy)}%` : '—'}
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3 text-right font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                        {entry.quality_score}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
