import { useEffect, useState } from 'react'
import { LayoutGrid, List, Plus, Radio } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { AppShell } from '../components/layout/AppShell'
import { ChannelCard } from '../components/channels/ChannelCard'
import { AddChannelModal } from '../components/channels/AddChannelModal'
import { SkeletonCard } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { QualityBadge } from '../components/channels/QualityBadge'
import { api, type Channel } from '../lib/api'

type QualityTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

function isValidTier(t?: string): t is QualityTier {
  return ['S', 'A', 'B', 'C', 'D', 'F'].includes(t || '')
}

type SortKey = 'quality_score' | 'win_rate' | 'avg_rr' | 'signal_count'

export default function Channels() {
  const navigate = useNavigate()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [addOpen, setAddOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('quality_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const load = async () => {
    try {
      const res = await api.channels.list()
      setChannels(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const sorted = [...channels].sort((a, b) => {
    const av = a[sortBy] ?? 0
    const bv = b[sortBy] ?? 0
    return sortDir === 'desc' ? (bv as number) - (av as number) : (av as number) - (bv as number)
  })

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setSortDir('desc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1" style={{ opacity: sortBy === k ? 1 : 0.3 }}>
      {sortBy === k ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  )

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
              {channels.length} channel{channels.length !== 1 ? 's' : ''} tracked
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div
              className="flex items-center rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              {(['grid', 'table'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={clsx(
                    'px-3 py-2 transition-colors',
                    view === v
                      ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  )}
                >
                  {v === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <SkeletonCard />
          )
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<Radio className="w-7 h-7" />}
            title="No channels yet"
            description="Add your first Telegram signal channel to start tracking performance."
            action={{ label: 'Add Channel', onClick: () => setAddOpen(true) }}
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((ch) => (
              <ChannelCard key={ch.id} channel={ch} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden"
            style={{ background: 'var(--surface)' }}
          >
            <table className="w-full border-collapse" style={{ fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-5 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                    Channel
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)]"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleSort('quality_score')}>
                    Tier <SortIcon k="quality_score" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)]"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleSort('win_rate')}>
                    Win Rate <SortIcon k="win_rate" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)]"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleSort('avg_rr')}>
                    R:R <SortIcon k="avg_rr" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)]"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleSort('signal_count')}>
                    Signals <SortIcon k="signal_count" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((ch) => {
                  const tier = isValidTier(ch.quality_tier) ? ch.quality_tier : undefined
                  return (
                    <tr
                      key={ch.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                      onClick={() => navigate(`/app/channels/${ch.id}`)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-[var(--text-inverse)] flex-shrink-0"
                            style={{ background: 'var(--accent)', fontSize: '11px' }}
                          >
                            {ch.title?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--text)]">{ch.title}</div>
                            <div className="text-[var(--text-faint)]" style={{ fontSize: 'var(--text-xs)' }}>
                              @{ch.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {tier ? <QualityBadge tier={tier} size="sm" /> : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--win)' }}>
                        {ch.win_rate != null ? `${Math.round(ch.win_rate)}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                        {ch.avg_rr != null ? `${ch.avg_rr.toFixed(1)}x` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {ch.signal_count ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/app/channels/${ch.id}`) }}
                          className="px-3 py-1 rounded text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-colors"
                          style={{ fontSize: 'var(--text-xs)' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-[var(--shadow-accent)] flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ background: 'var(--accent)', color: '#0a0a0b' }}
        title="Add Channel"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AddChannelModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={load}
      />
    </AppShell>
  )
}
