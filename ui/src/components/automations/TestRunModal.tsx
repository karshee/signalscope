import { CheckCircle2, Loader2, SkipForward, XCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import type { ExecutionStep } from '../../lib/api'
import { KIND_COLORS, NODE_REGISTRY, type Lookups } from './registry'

export interface TestRunResult {
  status: string
  reason?: string
  trace?: { steps: ExecutionStep[]; actions_run: number; error?: string }
}

interface TestRunModalProps {
  isOpen: boolean
  onClose: () => void
  running: boolean
  result: TestRunResult | null
  error: string | null
  lookups: Lookups
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; border: string; label: string }> = {
    dry_run: { bg: 'var(--win-dim)', color: 'var(--win)', border: 'var(--win)', label: 'Dry run OK' },
    success: { bg: 'var(--win-dim)', color: 'var(--win)', border: 'var(--win)', label: 'Success' },
    skipped: { bg: 'var(--active-dim)', color: 'var(--active)', border: 'var(--active)', label: 'Skipped' },
    error: { bg: 'var(--loss-dim)', color: 'var(--loss)', border: 'var(--loss)', label: 'Error' },
  }
  const s = styles[status] ?? {
    bg: 'var(--surface-2)',
    color: 'var(--text-muted)',
    border: 'var(--border-strong)',
    label: status,
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] font-medium border"
      style={{ background: s.bg, color: s.color, borderColor: s.border, fontSize: 'var(--text-xs)' }}
    >
      {s.label}
    </span>
  )
}

function StepRow({ step, lookups }: { step: ExecutionStep; lookups: Lookups }) {
  const meta = NODE_REGISTRY[step.type]
  const Icon = meta?.icon
  const colors = KIND_COLORS[step.kind]
  const detail = step.detail ?? {}

  let detailText = ''
  if (step.kind === 'action') {
    const text = typeof detail.text === 'string' ? detail.text : ''
    const caption = typeof detail.caption === 'string' ? detail.caption : ''
    const channelId = detail.channel_id ? String(detail.channel_id) : ''
    const channelTitle =
      typeof detail.channel_title === 'string'
        ? detail.channel_title
        : channelId
          ? (lookups.channels[channelId] ?? channelId)
          : ''
    const what = text || caption
    detailText = [what && `"${what}"`, channelTitle && `→ ${channelTitle}`].filter(Boolean).join(' ')
  } else if (typeof detail.reason === 'string') {
    detailText = detail.reason
  }

  return (
    <div
      className="flex items-start gap-3 px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--border)]"
      style={{ background: 'var(--bg)' }}
    >
      <span
        className="flex items-center justify-center rounded-[var(--radius-sm)] flex-shrink-0 mt-0.5"
        style={{ width: 22, height: 22, background: colors.dim, color: colors.main }}
      >
        {Icon && <Icon style={{ width: 12, height: 12 }} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[var(--text)] font-medium" style={{ fontSize: 'var(--text-sm)' }}>
          {meta?.label ?? step.type}
        </div>
        {detailText && (
          <div
            className="text-[var(--text-muted)] break-words whitespace-pre-wrap mt-0.5"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            {detailText}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 mt-0.5">
        {step.kind === 'condition' ? (
          step.passed ? (
            <span className="inline-flex items-center gap-1 text-[var(--win)]" style={{ fontSize: 'var(--text-xs)' }}>
              <CheckCircle2 className="w-4 h-4" /> passed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[var(--loss)]" style={{ fontSize: 'var(--text-xs)' }}>
              <XCircle className="w-4 h-4" /> failed
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1 text-[var(--accent)]" style={{ fontSize: 'var(--text-xs)' }}>
            <CheckCircle2 className="w-4 h-4" /> would run
          </span>
        )}
      </div>
    </div>
  )
}

export function TestRunModal({ isOpen, onClose, running, result, error, lookups }: TestRunModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Test run" className="max-w-xl">
      {running ? (
        <div className="flex items-center gap-3 py-8 justify-center text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Running with a sample event…
        </div>
      ) : error ? (
        <div
          className="rounded-[var(--radius-md)] border border-[var(--loss)] px-4 py-3 text-[var(--loss)]"
          style={{ background: 'var(--loss-dim)', fontSize: 'var(--text-sm)' }}
        >
          {error}
        </div>
      ) : result ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={result.status} />
            <span className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
              No messages were actually sent — this is a dry run.
            </span>
          </div>

          {result.status === 'skipped' && (
            <div
              className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--active)] px-4 py-3"
              style={{ background: 'var(--active-dim)', fontSize: 'var(--text-sm)', color: 'var(--active)' }}
            >
              <SkipForward className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{result.reason ?? 'The rule did not fire for the sample event.'}</span>
            </div>
          )}

          {result.trace?.error && (
            <div
              className="rounded-[var(--radius-md)] border border-[var(--loss)] px-4 py-3 text-[var(--loss)]"
              style={{ background: 'var(--loss-dim)', fontSize: 'var(--text-sm)' }}
            >
              {result.trace.error}
            </div>
          )}

          {result.trace && result.trace.steps.length > 0 && (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {result.trace.steps.map((step, i) => (
                <StepRow key={step.node_id ?? i} step={step} lookups={lookups} />
              ))}
            </div>
          )}

          {result.trace && (
            <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
              {result.trace.actions_run} action{result.trace.actions_run === 1 ? '' : 's'} would have run.
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  )
}
