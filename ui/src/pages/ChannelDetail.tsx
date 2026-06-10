import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { AppShell } from '../components/layout/AppShell'
import { SignalFeed } from '../components/signals/SignalFeed'
import { SignalDetail } from '../components/signals/SignalDetail'
import { RadarScore } from '../components/charts/RadarScore'
import { WinRateChart } from '../components/charts/WinRateChart'
import { PairHeatmap } from '../components/charts/PairHeatmap'
import { QualityBadge } from '../components/channels/QualityBadge'
import { channelGradient } from '../components/chat/ChannelList'
import { SkeletonBlock, SkeletonLine } from '../components/ui/Skeleton'
import { SignalBadge } from '../components/signals/SignalBadge'
import { api, type Channel, type Signal, type ChannelScore } from '../lib/api'

type QualityTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
function isValidTier(t?: string): t is QualityTier {
  return ['S', 'A', 'B', 'C', 'D', 'F'].includes(t || '')
}

type Tab = 'overview' | 'signals' | 'pairs' | 'history'

function formatPrice(p?: number) {
  if (p == null) return '—'
  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })
}

function timeStr(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function ChannelDetail() {
  const { id } = useParams<{ id: string }>()
  const [channel, setChannel] = useState<Channel | null>(null)
  const [score, setScore] = useState<ChannelScore | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [selected, setSelected] = useState<Signal | null>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [chRes, sigRes, scoreRes] = await Promise.allSettled([
          api.channels.get(id),
          api.signals.list({ channel_id: id, limit: 100 }),
          api.scores.channel(id),
        ])
        if (chRes.status === 'fulfilled') setChannel(chRes.value.data)
        if (sigRes.status === 'fulfilled') {
          const data = sigRes.value.data
          setSignals(Array.isArray(data) ? data : [])
        }
        if (scoreRes.status === 'fulfilled') setScore(scoreRes.value.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Build mock weekly chart data from signals
  const weeklyData = (() => {
    const weeks: Record<string, { wins: number; losses: number }> = {}
    for (const s of signals) {
      if (!s.status || (s.status !== 'win' && s.status !== 'loss')) continue
      const d = new Date(s.posted_at * 1000)
      const week = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('en', { month: 'short' })}`
      if (!weeks[week]) weeks[week] = { wins: 0, losses: 0 }
      if (s.status === 'win') weeks[week].wins++
      else weeks[week].losses++
    }
    return Object.entries(weeks).slice(-12).map(([week, v]) => ({ week, ...v }))
  })()

  // Build pair data
  const pairData = (() => {
    const pairs: Record<string, { wins: number; losses: number }> = {}
    for (const s of signals) {
      if (!s.pair) continue
      if (!pairs[s.pair]) pairs[s.pair] = { wins: 0, losses: 0 }
      if (s.status === 'win') pairs[s.pair].wins++
      else if (s.status === 'loss') pairs[s.pair].losses++
    }
    return Object.entries(pairs).map(([pair, v]) => ({
      pair,
      ...v,
      total: v.wins + v.losses,
    }))
  })()

  const radarScores = {
    winRate: score?.win_rate ?? 0,
    rrAccuracy: score?.avg_rr != null ? Math.min(100, (score.avg_rr / 3) * 100) : 0,
    entryPrecision: score?.entry_accuracy ?? 0,
    frequency: Math.min(100, ((score?.signal_count ?? 0) / 50) * 100),
    transparency: 70,
    consistency: score?.quality_score ?? 0,
  }

  const tier = isValidTier(channel?.quality_tier) ? channel?.quality_tier : undefined

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'signals', label: 'Signals' },
    { key: 'pairs', label: 'Pair Analysis' },
    { key: 'history', label: 'History' },
  ]

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto page-enter">
        {loading ? (
          <div className="flex flex-col gap-4">
            <SkeletonBlock height={100} />
            <SkeletonBlock height={300} />
          </div>
        ) : (
          <>
            {/* Channel header */}
            <div className="glass rounded-[var(--radius-xl)] p-6 mb-6 shadow-[var(--shadow-md)]">
              <div className="flex flex-wrap items-start gap-5">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-[var(--text-inverse)] flex-shrink-0"
                  style={{
                    background: channelGradient(channel?.title),
                    fontSize: '22px',
                    boxShadow: 'var(--accent-glow)',
                  }}
                >
                  {channel?.title?.[0]?.toUpperCase() || 'C'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h1 className="font-bold text-[var(--text)]" style={{ fontSize: 'var(--text-xl)' }}>
                      {channel?.title}
                    </h1>
                    {tier && <QualityBadge tier={tier} size="lg" showLabel />}
                  </div>
                  <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
                    @{channel?.username}
                    {channel?.subscriber_count && ` · ${channel.subscriber_count.toLocaleString()} subscribers`}
                  </div>

                  {/* Inline metrics */}
                  <div className="flex flex-wrap gap-6 mt-4">
                    {[
                      { label: 'Win Rate', value: channel?.win_rate != null ? `${Math.round(channel.win_rate)}%` : '—', color: 'var(--win)' },
                      { label: 'Avg R:R', value: channel?.avg_rr != null ? `${channel.avg_rr.toFixed(1)}x` : '—', color: 'var(--text)' },
                      { label: 'Signals', value: channel?.signal_count ?? '—', color: 'var(--text)' },
                      { label: 'Score', value: channel?.quality_score != null ? `${channel.quality_score}/100` : '—', color: 'var(--accent)' },
                      { label: 'Status', value: channel?.is_active ? 'Active' : 'Inactive', color: channel?.is_active ? 'var(--win)' : 'var(--expired)' },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
                          {m.label}
                        </div>
                        <div
                          className="font-semibold"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', color: m.color }}
                        >
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid var(--divider)' }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={clsx(
                    'px-4 py-2.5 font-medium transition-colors relative',
                    tab === t.key
                      ? 'text-[var(--accent)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:[background:var(--accent-gradient)] after:shadow-[0_0_12px_rgba(0,229,179,0.4)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  )}
                  style={{ fontSize: 'var(--text-sm)' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Radar */}
                <div className="glass card-lift rounded-[var(--radius-lg)] p-5">
                  <h3 className="font-semibold text-[var(--text)] mb-4" style={{ fontSize: 'var(--text-md)' }}>
                    Performance Profile
                  </h3>
                  <RadarScore scores={radarScores} />
                </div>

                {/* Win rate chart */}
                <div className="glass card-lift rounded-[var(--radius-lg)] p-5">
                  <h3 className="font-semibold text-[var(--text)] mb-4" style={{ fontSize: 'var(--text-md)' }}>
                    Win Rate (12 weeks)
                  </h3>
                  {weeklyData.length > 0 ? (
                    <WinRateChart data={weeklyData} />
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
                        Not enough data yet
                      </p>
                    </div>
                  )}
                </div>

                {/* Recent signals table */}
                <div className="glass lg:col-span-2 rounded-[var(--radius-lg)] overflow-hidden">
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
                    <h3 className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
                      Recent Signals
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ fontSize: 'var(--text-sm)' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Time', 'Pair', 'Dir', 'Entry', 'SL', 'TP1', 'Status'].map((h) => (
                            <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {signals.slice(0, 10).map((s) => (
                          <tr
                            key={s.id}
                            className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                            onClick={() => setSelected(s)}
                          >
                            <td className="px-4 py-3 text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
                              {timeStr(s.posted_at)}
                            </td>
                            <td className="px-4 py-3 font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                              {s.pair}
                            </td>
                            <td className="px-4 py-3" style={{ fontFamily: 'var(--font-mono)', color: s.direction?.toUpperCase() === 'BUY' ? 'var(--win)' : 'var(--loss)' }}>
                              {s.direction?.toUpperCase() === 'BUY' ? '▲' : '▼'} {s.direction?.toUpperCase()}
                            </td>
                            <td className="px-4 py-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{formatPrice(s.entry_price)}</td>
                            <td className="px-4 py-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--loss)' }}>{formatPrice(s.stop_loss)}</td>
                            <td className="px-4 py-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--win)' }}>{formatPrice(s.tp1)}</td>
                            <td className="px-4 py-3"><SignalBadge status={s.status || 'pending'} /></td>
                          </tr>
                        ))}
                        {signals.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
                              No signals yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'signals' && (
              <div className="max-w-xl">
                <SignalFeed
                  signals={signals}
                  onSignalClick={setSelected}
                  loading={loading}
                />
              </div>
            )}

            {tab === 'pairs' && (
              <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
                  <h3 className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
                    Performance by Pair
                  </h3>
                </div>
                <div className="p-5">
                  <PairHeatmap data={pairData} />
                </div>
              </div>
            )}

            {tab === 'history' && (
              <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
                  <h3 className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
                    Full Signal History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ fontSize: 'var(--text-sm)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Date', 'Pair', 'Dir', 'Entry', 'SL', 'TP1', 'Status', 'Result'].map((h) => (
                          <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {signals.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                          onClick={() => setSelected(s)}
                        >
                          <td className="px-4 py-3 text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
                            {timeStr(s.posted_at)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                            {s.pair}
                          </td>
                          <td className="px-4 py-3" style={{ fontFamily: 'var(--font-mono)', color: s.direction?.toUpperCase() === 'BUY' ? 'var(--win)' : 'var(--loss)' }}>
                            {s.direction?.toUpperCase() === 'BUY' ? '▲' : '▼'} {s.direction?.toUpperCase()}
                          </td>
                          <td className="px-4 py-3" style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice(s.entry_price)}</td>
                          <td className="px-4 py-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--loss)' }}>{formatPrice(s.stop_loss)}</td>
                          <td className="px-4 py-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--win)' }}>{formatPrice(s.tp1)}</td>
                          <td className="px-4 py-3"><SignalBadge status={s.status || 'pending'} /></td>
                          <td className="px-4 py-3" style={{ fontFamily: 'var(--font-mono)', color: s.pips_result != null ? (s.pips_result >= 0 ? 'var(--win)' : 'var(--loss)') : 'var(--text-faint)' }}>
                            {s.pips_result != null ? `${s.pips_result >= 0 ? '+' : ''}${s.pips_result}p` : '—'}
                          </td>
                        </tr>
                      ))}
                      {signals.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">
                            No signals in history
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <SignalDetail signal={selected} onClose={() => setSelected(null)} />
    </AppShell>
  )
}
