import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Plus, Trash2, Workflow, Zap } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { SkeletonCard } from '../components/ui/Skeleton'
import { api, type Rule } from '../lib/api'
import { NODE_REGISTRY } from '../components/automations/registry'

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
      className="relative flex-shrink-0 rounded-full transition-colors"
      style={{
        width: 36,
        height: 20,
        background: on ? 'var(--accent)' : 'var(--surface-3)',
        border: `1px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
      }}
    >
      <span
        className="absolute top-0.5 rounded-full transition-all"
        style={{
          width: 14,
          height: 14,
          left: on ? 18 : 3,
          background: on ? 'var(--text-inverse)' : 'var(--text-muted)',
        }}
      />
    </button>
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
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
            {loading
              ? 'Loading automations…'
              : `${rules.length} automation${rules.length === 1 ? '' : 's'} — rules that watch your channels and act for you`}
          </p>
          <Button onClick={() => navigate('/app/automations/new')}>
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
          <EmptyState
            icon={<Workflow className="w-7 h-7" />}
            title="Put your channels on autopilot"
            description='Build visual rules that react to signals, schedules, and webhooks. For example: "When TP2 hits on Gold → post the celebration GIF to your VIP channel."'
            action={{ label: 'Build your first automation', onClick: () => navigate('/app/automations/new') }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map((rule) => {
              const triggerMeta = NODE_REGISTRY[rule.trigger_type]
              return (
                <div
                  key={rule.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--border)] px-5 py-4 flex items-center gap-4 hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                  style={{ background: 'var(--surface)', opacity: rule.is_enabled ? 1 : 0.65 }}
                  onClick={() => navigate(`/app/automations/${rule.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-medium text-[var(--text)] truncate">{rule.name}</span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--accent)] text-[var(--accent)] flex-shrink-0"
                        style={{ background: 'var(--accent-dim)', fontSize: 'var(--text-xs)' }}
                      >
                        <Zap className="w-3 h-3" />
                        {triggerMeta?.label ?? rule.trigger_type}
                      </span>
                    </div>
                    {rule.description && (
                      <div className="text-[var(--text-muted)] truncate mt-1" style={{ fontSize: 'var(--text-sm)' }}>
                        {rule.description}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[var(--text-faint)]" style={{ fontSize: 'var(--text-xs)' }}>
                      <span>ran {rule.executions_24h ?? 0}× in 24h</span>
                      <span>·</span>
                      <span>last fired {timeAgo(rule.last_fired_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Toggle on={rule.is_enabled} onChange={() => toggle(rule)} />
                    <button
                      onClick={() => navigate(`/app/automations/${rule.id}`)}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(rule)}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--loss)] hover:bg-[var(--loss-dim)] transition-colors"
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
