import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, Filter, Pencil, Plus, Target, Trash2, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { SkeletonCard } from '../components/ui/Skeleton'
import { api, type Rule } from '../lib/api'
import { KIND_COLORS, NODE_REGISTRY, type NodeKind } from '../components/automations/registry'

function timeAgo(ts?: number | null): string {
  if (!ts) return 'never'
  const s = Math.floor(Date.now() / 1000) - ts
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      title={on ? 'Enabled — click to disable' : 'Disabled — click to enable'}
      className="relative flex-shrink-0 rounded-full transition-all"
      style={{
        width: 36,
        height: 20,
        background: on ? 'var(--accent-gradient)' : 'var(--surface-3)',
        border: `1px solid ${on ? 'transparent' : 'var(--border-strong)'}`,
        boxShadow: on ? '0 0 12px rgba(0, 229, 179, 0.35)' : 'none',
      }}
    >
      <span
        className="absolute top-0.5 rounded-full transition-all"
        style={{
          width: 14,
          height: 14,
          left: on ? 18 : 3,
          background: on ? '#fff' : 'var(--text-muted)',
        }}
      />
    </button>
  )
}

/** Mini node chip used in the empty-state illustration */
function MiniNode({ kind, icon: Icon, label }: { kind: NodeKind; icon: LucideIcon; label: string }) {
  const colors = KIND_COLORS[kind]
  return (
    <span
      className="glass inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] flex-shrink-0"
      style={{ borderColor: 'var(--border-strong)' }}
    >
      <span
        className="flex items-center justify-center rounded-[5px] flex-shrink-0"
        style={{ width: 18, height: 18, background: colors.dim, color: colors.main }}
      >
        <Icon style={{ width: 10, height: 10 }} />
      </span>
      <span className="text-[var(--text)] whitespace-nowrap" style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>
        {label}
      </span>
    </span>
  )
}

function MiniConnector() {
  return (
    <span
      aria-hidden
      className="flex-shrink-0"
      style={{ width: 26, height: 2, borderRadius: 1, background: 'var(--accent-gradient)', opacity: 0.5 }}
    />
  )
}

function EmptyAutomations({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      className="flex flex-col items-center text-center gap-5 rounded-[var(--radius-xl)] border border-[var(--border)] px-8 py-14"
      style={{ background: 'var(--accent-gradient-soft)' }}
    >
      {/* example rule illustration: trigger → condition → action */}
      <div className="flex items-center float-y" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <MiniNode kind="trigger" icon={Target} label="TP2 hit" />
        <MiniConnector />
        <MiniNode kind="condition" icon={Filter} label="Gold only" />
        <MiniConnector />
        <MiniNode kind="action" icon={Image} label="Post GIF" />
      </div>

      <div className="flex flex-col gap-2 items-center">
        <h2 className="text-[var(--text)]" style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
          Put your channels on <span className="gradient-text">autopilot</span>
        </h2>
        <p className="text-[var(--text-muted)] max-w-md leading-relaxed" style={{ fontSize: 'var(--text-sm)' }}>
          Build visual rules that react to signals, schedules, and webhooks. For example: "When TP2 hits
          on Gold → post the celebration GIF to your VIP channel."
        </p>
      </div>

      <Button onClick={onCreate} style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-accent)' }}>
        <Plus className="w-4 h-4" /> Build your first automation
      </Button>
    </div>
  )
}

export default function Automations() {
  const navigate = useNavigate()
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<Rule | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await api.rules.list()
      setRules(res.data)
    } catch {
      setError('Could not load automations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggle = async (rule: Rule) => {
    const next = !rule.is_enabled
    // optimistic flip
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, is_enabled: next } : r)))
    try {
      if (next) await api.rules.enable(rule.id)
      else await api.rules.disable(rule.id)
    } catch {
      setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, is_enabled: rule.is_enabled } : r)))
      setError(`Could not ${next ? 'enable' : 'disable'} "${rule.name}"`)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const rule = deleting
    setDeleting(null)
    try {
      await api.rules.delete(rule.id)
      setRules((rs) => rs.filter((r) => r.id !== rule.id))
    } catch {
      setError(`Could not delete "${rule.name}"`)
    }
  }

  return (
    <AppShell>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto page-enter">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
            {loading
              ? 'Loading automations…'
              : `${rules.length} automation${rules.length === 1 ? '' : 's'} — rules that watch your channels and act for you`}
          </p>
          <Button
            onClick={() => navigate('/app/automations/new')}
            style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-accent)' }}
          >
            <Plus className="w-4 h-4" /> New automation
          </Button>
        </div>

        {error && (
          <div
            className="mb-4 rounded-[var(--radius-md)] border border-[var(--loss)] px-4 py-2.5 text-[var(--loss)] flex items-center justify-between"
            style={{ background: 'var(--loss-dim)', fontSize: 'var(--text-sm)' }}
          >
            <span>{error}</span>
            <button onClick={() => setError('')} className="hover:opacity-70">
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <EmptyAutomations onCreate={() => navigate('/app/automations/new')} />
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map((rule) => {
              const triggerMeta = NODE_REGISTRY[rule.trigger_type]
              const triggerColors = KIND_COLORS[triggerMeta?.kind ?? 'trigger']
              const TriggerIcon = triggerMeta?.icon ?? Zap
              return (
                <div
                  key={rule.id}
                  className="glass card-lift rounded-[var(--radius-lg)] px-5 py-4 flex items-center gap-4 cursor-pointer"
                  style={{ opacity: rule.is_enabled ? 1 : 0.6 }}
                  onClick={() => navigate(`/app/automations/${rule.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[var(--text)] truncate" style={{ fontWeight: 600 }}>
                        {rule.name}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] border flex-shrink-0"
                        style={{
                          background: triggerColors.dim,
                          borderColor: triggerColors.glow,
                          color: triggerColors.main,
                          fontSize: 'var(--text-xs)',
                          fontWeight: 500,
                        }}
                      >
                        <TriggerIcon className="w-3 h-3" />
                        {triggerMeta?.label ?? rule.trigger_type}
                      </span>
                    </div>
                    {rule.description && (
                      <div className="text-[var(--text-muted)] truncate mt-1" style={{ fontSize: 'var(--text-sm)' }}>
                        {rule.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 mt-2" style={{ fontSize: 'var(--text-xs)' }}>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] border border-[var(--border)] text-[var(--text-muted)]"
                        style={{ background: 'var(--surface-2)' }}
                      >
                        <Zap className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                        ran {rule.executions_24h ?? 0}× / 24h
                      </span>
                      <span className="text-[var(--text-faint)] font-mono">
                        last fired {timeAgo(rule.last_fired_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Toggle on={rule.is_enabled} onChange={() => toggle(rule)} />
                    <button
                      onClick={() => navigate(`/app/automations/${rule.id}`)}
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(rule)}
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--loss)] hover:bg-[var(--loss-dim)] transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={deleting !== null} onClose={() => setDeleting(null)} title="Delete automation?">
        <div className="flex flex-col gap-4">
          <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
            "{deleting?.name}" will stop running and its rule graph will be deleted. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
