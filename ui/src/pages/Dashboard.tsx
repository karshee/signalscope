import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap,
  Activity,
  Send,
  Radio,
  Plus,
  FileText,
  AlertTriangle,
  X,
  Workflow,
  ChevronRight,
} from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { SkeletonBlock, SkeletonLine } from '../components/ui/Skeleton'
import { api, type Execution, type Rule } from '../lib/api'
import { useSignalFeed } from '../lib/websocket'

interface ExecStats {
  total_24h: number
  success_24h: number
  errors_24h: number
  active_rules: number
  sent_7d: number
}

interface RuleExecutionEvent {
  id: string
  rule_id: string
  rule_name?: string
  event_type: string
  status: string
  actions_run?: number
  created_at: number
}

interface RuleDisabledAlert {
  rule_id: string
  name: string
  reason: string
}

const EVENT_LABELS: Record<string, string> = {
  'message.received': 'Message',
  'outcome.event': 'TP/SL',
  'schedule.tick': 'Schedule',
  'webhook.received': 'Webhook',
}

function eventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType
}

function statusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'var(--win)'
    case 'error':
    case 'rate_limited':
      return 'var(--loss)'
    case 'dry_run':
      return 'var(--accent)'
    default:
      // condition_failed and anything unknown
      return 'var(--text-faint)'
  }
}

function statusDim(status: string): string {
  switch (status) {
    case 'success':
      return 'var(--win-dim)'
    case 'error':
    case 'rate_limited':
      return 'var(--loss-dim)'
    case 'dry_run':
      return 'var(--accent-dim)'
    default:
      return 'var(--expired-dim)'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'success':
      return 'Ran'
    case 'error':
      return 'Error'
    case 'rate_limited':
      return 'Rate limited'
    case 'condition_failed':
      return 'Skipped'
    case 'dry_run':
      return 'Dry run'
    default:
      return status
  }
}

function timeAgo(ts: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - ts)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function StatCard({
  icon,
  label,
  value,
  sub,
  loading,
  hero,
  tint,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: React.ReactNode
  loading?: boolean
  hero?: boolean
  tint?: string
}) {
  return (
    <div
      className="glass rounded-[var(--radius-lg)] p-5 relative overflow-hidden"
      style={tint ? { backgroundImage: `linear-gradient(150deg, ${tint}, transparent 55%)` } : undefined}
    >
      {loading ? (
        <div className="flex flex-col gap-2">
          <SkeletonLine className="w-1/2" />
          <SkeletonBlock height={32} className="w-2/3" />
          <SkeletonLine className="w-1/3" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <span className="text-[var(--text-muted)] pt-1.5" style={{ fontSize: 'var(--text-sm)' }}>
              {label}
            </span>
            <div
              className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--accent)] border border-[var(--border)] flex-shrink-0"
              style={{ background: 'var(--accent-gradient-soft)' }}
            >
              {icon}
            </div>
          </div>
          <div
            className={hero ? 'gradient-text mb-1' : 'text-[var(--text)] mb-1'}
            style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em' }}
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

function QuickAction({
  to,
  icon,
  label,
}: {
  to: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      to={to}
      className="card-lift flex items-center gap-3 w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--text)]"
      style={{ fontSize: 'var(--text-sm)', background: 'var(--surface-2)' }}
    >
      <span
        className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--accent)] border border-[var(--border)] flex-shrink-0"
        style={{ background: 'var(--accent-gradient-soft)' }}
      >
        {icon}
      </span>
      <span className="flex-1 font-medium truncate">{label}</span>
      <ChevronRight className="w-4 h-4 text-[var(--text-faint)] flex-shrink-0" />
    </Link>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<ExecStats | null>(null)
  const [executions, setExecutions] = useState<Execution[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [channelCount, setChannelCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [alerts, setAlerts] = useState<RuleDisabledAlert[]>([])

  const handleWsMessage = useCallback((msg: unknown) => {
    const m = msg as { type?: string; data?: unknown }
    if (m.type === 'rule_execution' && m.data) {
      const d = m.data as RuleExecutionEvent
      const exec: Execution = {
        id: d.id,
        rule_id: d.rule_id,
        rule_name: d.rule_name,
        event_type: d.event_type,
        status: d.status,
        detail: { actions_run: d.actions_run },
        created_at: d.created_at,
      }
      setExecutions((prev) => [exec, ...prev.filter((e) => e.id !== exec.id)].slice(0, 50))
      setNewIds((prev) => new Set([...prev, d.id]))
      setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev)
          next.delete(d.id)
          return next
        })
      }, 1000)
    } else if (m.type === 'rule_disabled' && m.data) {
      const d = m.data as RuleDisabledAlert
      setAlerts((prev) => [...prev.filter((a) => a.rule_id !== d.rule_id), d])
    }
  }, [])

  const connected = useSignalFeed(handleWsMessage)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, execRes, rulesRes, chanRes] = await Promise.allSettled([
          api.executions.stats(),
          api.executions.list({ limit: 20 }),
          api.rules.list(),
          api.channels.list(),
        ])
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
        if (execRes.status === 'fulfilled') {
          const data = execRes.value.data
          setExecutions(Array.isArray(data) ? data : [])
        }
        if (rulesRes.status === 'fulfilled') {
          const data = rulesRes.value.data
          setRules(Array.isArray(data) ? data : [])
        }
        if (chanRes.status === 'fulfilled') setChannelCount(chanRes.value.data.length)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const topRules = [...rules]
    .sort((a, b) => (b.executions_24h ?? 0) - (a.executions_24h ?? 0))
    .slice(0, 5)

  return (
    <AppShell connected={connected}>
      <div className="p-4 lg:p-6 max-w-7xl mx-auto page-enter">
        {/* Rule auto-disabled warnings */}
        {alerts.map((a) => (
          <div
            key={a.rule_id}
            className="flex items-start gap-3 rounded-[var(--radius-lg)] border p-4 mb-4"
            style={{ background: 'var(--loss-dim)', borderColor: 'var(--loss)' }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--loss)' }} />
            <div className="flex-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>
              Rule <span className="font-semibold">{a.name}</span> was auto-disabled: {a.reason}
            </div>
            <button
              onClick={() => setAlerts((prev) => prev.filter((x) => x.rule_id !== a.rule_id))}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="Active automations"
            value={stats?.active_rules ?? 0}
            sub={
              <Link to="/app/automations" className="text-[var(--accent)] hover:underline">
                Manage rules
              </Link>
            }
            loading={loading}
            hero
            tint="rgba(0, 229, 179, 0.08)"
          />
          <StatCard
            icon={<Activity className="w-4 h-4" />}
            label="Executions 24h"
            value={stats?.total_24h ?? 0}
            sub={
              stats ? (
                <span>
                  <span style={{ color: 'var(--win)' }}>{stats.success_24h} ok</span>
                  {' · '}
                  <span style={{ color: stats.errors_24h > 0 ? 'var(--loss)' : 'var(--text-muted)' }}>
                    {stats.errors_24h} errors
                  </span>
                </span>
              ) : undefined
            }
            loading={loading}
            tint="rgba(0, 179, 255, 0.07)"
          />
          <StatCard
            icon={<Send className="w-4 h-4" />}
            label="Messages sent 7d"
            value={stats?.sent_7d ?? 0}
            loading={loading}
            tint="rgba(129, 140, 248, 0.07)"
          />
          <StatCard
            icon={<Radio className="w-4 h-4" />}
            label="Channels connected"
            value={channelCount}
            sub={
              <Link to="/app/channels" className="text-[var(--accent)] hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add channel
              </Link>
            }
            loading={loading}
            tint="rgba(255, 178, 36, 0.06)"
          />
        </div>

        {/* First-run CTA — shown when user has no rules yet */}
        {!loading && rules.length === 0 && (
          <div
            className="glass rounded-[var(--radius-xl)] p-8 text-center mb-6 relative overflow-hidden"
            style={{ backgroundImage: 'var(--accent-gradient-soft)' }}
          >
            <div
              className="w-16 h-16 rounded-[var(--radius-xl)] flex items-center justify-center mx-auto mb-4 text-[var(--accent)] border border-[var(--border-strong)] float-y"
              style={{ background: 'var(--accent-gradient-soft)' }}
            >
              <Workflow className="w-8 h-8" />
            </div>
            <h2 className="text-[var(--text)] mb-2" style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>
              Create your first automation
            </h2>
            <p
              className="text-[var(--text-muted)] max-w-sm mx-auto mb-6"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              When TP2 hits → post the GIF to VIP. Build it in under a minute.
            </p>
            <Link
              to="/app/automations/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] font-semibold transition-opacity hover:opacity-90"
              style={{
                background: 'var(--accent-gradient)',
                color: 'var(--text-inverse)',
                boxShadow: 'var(--shadow-accent)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <Plus className="w-4 h-4" />
              New automation
            </Link>
          </div>
        )}

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live activity feed — wider */}
          <div className="lg:col-span-2 glass rounded-[var(--radius-lg)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--win)] pulse-dot" />
              <h2 className="font-bold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
                Live activity
              </h2>
              <span
                className="ml-auto uppercase tracking-widest text-[var(--text-faint)]"
                style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
              >
                live
              </span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              {loading ? (
                <div className="p-4 flex flex-col gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <SkeletonBlock height={8} width={8} className="rounded-full flex-shrink-0" />
                      <SkeletonLine className="flex-1" />
                      <SkeletonLine className="w-16" />
                    </div>
                  ))}
                </div>
              ) : executions.length === 0 ? (
                <div className="py-16 text-center px-6">
                  <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
                    Automations will appear here as they run.
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {executions.map((e) => {
                    const actionsRun = e.detail?.actions_run
                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--surface-hover)] transition-colors"
                        style={
                          newIds.has(e.id)
                            ? { background: 'var(--accent-dim)' }
                            : undefined
                        }
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: statusColor(e.status) }}
                          title={statusLabel(e.status)}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-medium text-[var(--text)] truncate"
                            style={{ fontSize: 'var(--text-sm)' }}
                          >
                            {e.rule_name || 'Unnamed rule'}
                          </div>
                          {e.status === 'error' && e.detail?.error && (
                            <div
                              className="text-[var(--text-muted)] truncate"
                              style={{ fontSize: 'var(--text-xs)' }}
                            >
                              {e.detail.error}
                            </div>
                          )}
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{
                            fontSize: 'var(--text-xs)',
                            background: statusDim(e.status),
                            color: statusColor(e.status),
                          }}
                        >
                          {statusLabel(e.status)}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] flex-shrink-0"
                          style={{ fontSize: 'var(--text-xs)', background: 'var(--surface-2)' }}
                        >
                          {eventLabel(e.event_type)}
                        </span>
                        {actionsRun != null && (
                          <span
                            className="text-[var(--text-muted)] flex-shrink-0"
                            style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
                            title="Actions run"
                          >
                            {actionsRun} act
                          </span>
                        )}
                        <span
                          className="text-[var(--text-faint)] flex-shrink-0 w-16 text-right"
                          style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
                        >
                          {timeAgo(e.created_at)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Your automations */}
            <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="font-bold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
                  Your automations
                </h2>
                <Link
                  to="/app/automations"
                  className="text-[var(--accent)] hover:underline"
                  style={{ fontSize: 'var(--text-xs)' }}
                >
                  View all
                </Link>
              </div>
              <div className="p-2">
                {loading ? (
                  <div className="p-3 flex flex-col gap-3">
                    {[...Array(3)].map((_, i) => (
                      <SkeletonLine key={i} />
                    ))}
                  </div>
                ) : topRules.length === 0 ? (
                  <div className="py-8 text-center px-4">
                    <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
                      No automations yet
                    </p>
                  </div>
                ) : (
                  topRules.map((r) => (
                    <Link
                      key={r.id}
                      to="/app/automations"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: r.is_enabled ? 'var(--win)' : 'var(--text-faint)' }}
                        title={r.is_enabled ? 'Enabled' : 'Disabled'}
                      />
                      <span
                        className="font-medium text-[var(--text)] flex-1 truncate"
                        style={{ fontSize: 'var(--text-sm)' }}
                      >
                        {r.name}
                      </span>
                      <span
                        className="text-[var(--text-muted)] flex-shrink-0"
                        style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
                        title="Executions in the last 24h"
                      >
                        {r.executions_24h ?? 0}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h2 className="font-bold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
                  Quick actions
                </h2>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <QuickAction
                  to="/app/automations/new"
                  icon={<Plus className="w-4 h-4" />}
                  label="New automation"
                />
                <QuickAction
                  to="/app/templates"
                  icon={<FileText className="w-4 h-4" />}
                  label="New template"
                />
                <QuickAction
                  to="/app/channels"
                  icon={<Radio className="w-4 h-4" />}
                  label="Open channels"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
