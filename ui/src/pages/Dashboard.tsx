import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Zap, BarChart2, Radio, Plus } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { SignalFeed } from '../components/signals/SignalFeed'
import { SignalDetail } from '../components/signals/SignalDetail'
import { SkeletonBlock, SkeletonLine } from '../components/ui/Skeleton'
import { QualityBadge } from '../components/channels/QualityBadge'
import { api, type Signal, type LeaderboardEntry } from '../lib/api'
import { useSignalFeed } from '../lib/websocket'

type QualityTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

function isValidTier(t?: string): t is QualityTier {
  return ['S', 'A', 'B', 'C', 'D', 'F'].includes(t || '')
}

interface Stats {
  totalToday: number
  active: number
  avgScore: number
  channelCount: number
}

function StatCard({
  icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: React.ReactNode
  loading?: boolean
}) {
  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5"
      style={{ background: 'var(--surface)' }}
    >
      {loading ? (
        <div className="flex flex-col gap-2">
          <SkeletonLine className="w-1/2" />
          <SkeletonBlock height={32} className="w-2/3" />
          <SkeletonLine className="w-1/3" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
              {label}
            </span>
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--accent)]"
              style={{ background: 'var(--accent-dim)' }}>
              {icon}
            </div>
          </div>
          <div
            className="font-bold text-[var(--text)] mb-1"
            style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-mono)' }}
          >
            {value}
          </div>
          {sub && (
            <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
              {sub}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [sigLoading, setSigLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ totalToday: 0, active: 0, avgScore: 0, channelCount: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [topChannels, setTopChannels] = useState<LeaderboardEntry[]>([])
  const [selected, setSelected] = useState<Signal | null>(null)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  const handleWsMessage = useCallback((msg: unknown) => {
    const m = msg as { type?: string; signal?: Signal }
    if (m.type === 'new_signal' && m.signal) {
      setSignals((prev) => [m.signal!, ...prev.slice(0, 49)])
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
        const [sigRes, statsRes, leaderRes, chanRes] = await Promise.allSettled([
          api.signals.list({ limit: 20 }),
          api.signals.statsToday(),
          api.scores.leaderboard({ window: '30d', min_signals: 5 }),
          api.channels.list(),
        ])
        if (sigRes.status === 'fulfilled') {
          const data = sigRes.value.data
          setSignals(Array.isArray(data) ? data : [])
        }
        if (statsRes.status === 'fulfilled') {
          const s = statsRes.value.data
          setStats((prev) => ({ ...prev, totalToday: s.total_today, active: s.active }))
        }
        if (leaderRes.status === 'fulfilled') setTopChannels(leaderRes.value.data.slice(0, 5))
        if (chanRes.status === 'fulfilled') {
          const channels = chanRes.value.data
          const scores = channels.map((c) => c.quality_score ?? 0).filter((s) => s > 0)
          const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
          setStats((prev) => ({ ...prev, avgScore: avg, channelCount: channels.length }))
        }
      } finally {
        setSigLoading(false)
        setStatsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AppShell connected={connected}>
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Signals Today"
            value={stats.totalToday}
            loading={statsLoading}
          />
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="Active Signals"
            value={stats.active}
            sub={
              stats.active > 0
                ? `${stats.active} in play now`
                : 'None active'
            }
            loading={statsLoading}
          />
          <StatCard
            icon={<BarChart2 className="w-4 h-4" />}
            label="Avg Channel Score"
            value={stats.avgScore > 0 ? stats.avgScore : '—'}
            loading={statsLoading}
          />
          <StatCard
            icon={<Radio className="w-4 h-4" />}
            label="Channels Watching"
            value={stats.channelCount}
            sub={
              <Link to="/app/channels" className="text-[var(--accent)] hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add channel
              </Link>
            }
            loading={statsLoading}
          />
        </div>

        {/* Onboarding banner — shown when user has no channels yet */}
        {!statsLoading && stats.channelCount === 0 && (
          <div
            className="rounded-[var(--radius-lg)] border border-[var(--border)] p-8 text-center mb-6"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center mx-auto mb-4 text-[var(--accent)]"
              style={{ background: 'var(--accent-dim)' }}
            >
              <Radio className="w-7 h-7" />
            </div>
            <h2 className="font-bold text-[var(--text)] mb-2" style={{ fontSize: 'var(--text-xl)' }}>
              Welcome to Tapwire
            </h2>
            <p
              className="text-[var(--text-muted)] max-w-sm mx-auto mb-6"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              Add a Telegram signal channel to start tracking win rates, entry accuracy, and live signals in real time.
            </p>
            <Link
              to="/app/channels"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] font-medium transition-opacity hover:opacity-90"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-inverse)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <Plus className="w-4 h-4" />
              Add your first channel
            </Link>
          </div>
        )}

        {/* Main grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Signal feed — wider */}
          <div
            className="lg:col-span-3 rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden"
            style={{ background: 'var(--surface)' }}
          >
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--win)] pulse-dot" />
              <h2 className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
                Live Feed
              </h2>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              <SignalFeed
                signals={signals}
                onSignalClick={setSelected}
                loading={sigLoading}
                newIds={newIds}
              />
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Top Channels */}
            <div
              className="rounded-[var(--radius-lg)] border border-[var(--border)]"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
                  Top Channels
                </h2>
                <Link
                  to="/app/leaderboard"
                  className="text-[var(--accent)] hover:underline"
                  style={{ fontSize: 'var(--text-xs)' }}
                >
                  View all
                </Link>
              </div>
              <div className="p-2">
                {topChannels.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
                      No channel data yet
                    </p>
                  </div>
                ) : (
                  topChannels.map((ch, i) => {
                    const tier = isValidTier(ch.quality_tier) ? ch.quality_tier : undefined
                    return (
                      <div
                        key={ch.channel_id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <span
                          className="font-bold text-[var(--text-faint)] w-4 flex-shrink-0"
                          style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
                        >
                          {i + 1}
                        </span>
                        {tier && <QualityBadge tier={tier} size="sm" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--text)] truncate" style={{ fontSize: 'var(--text-sm)' }}>
                            {ch.title}
                          </div>
                        </div>
                        <span
                          className="font-semibold flex-shrink-0"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--win)',
                          }}
                        >
                          {ch.win_rate != null ? `${Math.round(ch.win_rate)}%` : '—'}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Recent Outcomes */}
            <div
              className="rounded-[var(--radius-lg)] border border-[var(--border)] flex-1"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h2 className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
                  Recent Outcomes
                </h2>
              </div>
              <div className="p-2">
                {signals
                  .filter((s) => s.status === 'win' || s.status === 'loss')
                  .slice(0, 5)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                      onClick={() => setSelected(s)}
                    >
                      <span
                        className="text-sm flex-shrink-0"
                        style={{ fontSize: '16px' }}
                      >
                        {s.status === 'win' ? '✅' : '✗'}
                      </span>
                      <span
                        className="font-medium text-[var(--text)] flex-1 truncate"
                        style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}
                      >
                        {s.pair}
                      </span>
                      {s.pips_result != null && (
                        <span
                          className="font-semibold flex-shrink-0"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-sm)',
                            color: s.pips_result >= 0 ? 'var(--win)' : 'var(--loss)',
                          }}
                        >
                          {s.pips_result >= 0 ? '+' : ''}{s.pips_result}p
                        </span>
                      )}
                    </div>
                  ))}
                {signals.filter((s) => s.status === 'win' || s.status === 'loss').length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
                      No resolved signals yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SignalDetail signal={selected} onClose={() => setSelected(null)} />
    </AppShell>
  )
}
