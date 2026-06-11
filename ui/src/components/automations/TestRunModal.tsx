import { AlertCircle, CheckCircle2, FlaskConical, Loader2, SkipForward } from 'lucide-react'
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

function StatusBanner({ status, reason }: { status: string; reason?: string }) {
  const ok = status === 'dry_run' || status === 'success'
  const skipped = status === 'skipped'
  const failed = status === 'error'

  const banner = ok
    ? {
        bg: 'var(--accent-gradient-soft)',
        border: 'rgba(0, 229, 179, 0.35)',
        color: 'var(--accent)',
        icon: <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />,
        title: status === 'dry_run' ? 'Dry run complete' : 'Success',
        sub: 'No messages were actually sent — this is a dry run.',
      }
    : skipped
      ? {
          bg: 'var(--active-dim)',
          border: 'var(--active)',
          color: 'var(--active)',
          icon: <SkipForward className="w-4 h-4 flex-shrink-0 mt-0.5" />,
          title: 'Skipped',
          sub: reason ?? 'The rule did not fire for the sample event.',
        }
      : {
          bg: failed ? 'var(--loss-dim)' : 'var(--surface-2)',
          border: failed ? 'var(--loss)' : 'var(--border-strong)',
          color: failed ? 'var(--loss)' : 'var(--text-muted)',
          icon: <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />,
          title: failed ? 'Error' : status,
          sub: reason ?? '',
        }

  return (
    <div
      className="flex items-start gap-2.5 rounded-[var(--radius-lg)] border px-4 py-3"
      style={{ background: banner.bg, borderColor: banner.border, color: banner.color }}
    >
      {banner.icon}
      <div className="min-w-0 flex-1">
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{banner.title}</div>
        {banner.sub && (
          <div className="text-[var(--text-muted)] mt-0.5" style={{ fontSize: 'var(--text-xs)' }}>
            {banner.sub}
          </div>
        )}
      </div>
    </div>
  )
}

function PassChip({ passed }: { passed?: boolean }) {
  return passed ? (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] font-medium flex-shrink-0"
      style={{ background: 'var(--win-dim)', color: 'var(--win)', fontSize: 'var(--text-xs)' }}
    >
      ✓ pass
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] font-medium flex-shrink-0"
      style={{ background: 'var(--loss-dim)', color: 'var(--loss)', fontSize: 'var(--text-xs)' }}
    >
      ✗ fail
    </span>
  )
}

function TimelineStep({
  step,
  index,
  isLast,
  lookups,
}: {
  step: ExecutionStep
  index: number
  isLast: boolean
  lookups: Lookups
}) {
  const meta = NODE_REGISTRY[step.type]
  const Icon = meta?.icon
  const colors = KIND_COLORS[step.kind]
  const detail = step.detail ?? {}

  const text = typeof detail.text === 'string' ? detail.text : ''
  const caption = typeof detail.caption === 'string' ? detail.caption : ''
  const channelId = detail.channel_id ? String(detail.channel_id) : ''
  const channelTitle =
    typeof detail.channel_title === 'string'
      ? detail.channel_title
      : channelId
        ? (lookups.channels[channelId] ?? channelId)
        : ''
  const message = text || caption
  const reason = typeof detail.reason === 'string' ? detail.reason : ''

  return (
    <div className="flex gap-3">
      {/* timeline rail: icon chip + connecting line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <span
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            background: colors.dim,
            color: colors.main,
            boxShadow: `inset 0 0 0 1px ${colors.glow}`,
          }}
        >
          {Icon ? <Icon style={{ width: 13, height: 13 }} /> : <span style={{ fontSize: 'var(--text-xs)' }}>{index + 1}</span>}
        </span>
        {!isLast && (
          <span
            className="flex-1"
            style={{ width: 2, minHeight: 14, marginTop: 4, marginBottom: 4, borderRadius: 1, background: 'var(--border-strong)' }}
          />
        )}
      </div>

      {/* step content */}
      <div className="min-w-0 flex-1 pb-4">
        <div className="flex items-center gap-2">
          <span
            className="font-mono flex-shrink-0"
            style={{ fontSize: 10, color: 'var(--text-faint)' }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-[var(--text)] truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            {meta?.label ?? step.type}
          </span>
          <span className="flex-1" />
          {step.kind === 'condition' ? (
            <PassChip passed={step.passed} />
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] font-medium flex-shrink-0"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 'var(--text-xs)' }}
            >
              would run
            </span>
          )}
        </div>

        {step.kind === 'action' && (message || channelTitle) ? (
          <div className="mt-2 flex flex-col items-start gap-1.5">
            {message && (
              <div
                className="px-3 py-2 break-words whitespace-pre-wrap text-[var(--text)]"
                style={{
                  fontSize: 'var(--text-xs)',
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px 12px 12px 12px',
                  maxWidth: '100%',
                }}
              >
                {message}
              </div>
            )}
            {channelTitle && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] border"
                style={{
                  fontSize: 'var(--text-xs)',
                  background: 'var(--accent-dim)',
                  borderColor: 'rgba(0, 229, 179, 0.3)',
                  color: 'var(--accent)',
                }}
              >
                → {channelTitle}
              </span>
            )}
          </div>
        ) : reason ? (
          <div className="text-[var(--text-muted)] break-words mt-1" style={{ fontSize: 'var(--text-xs)' }}>
            {reason}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function TestRunModal({ isOpen, onClose, running, result, error, lookups }: TestRunModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Test run" className="max-w-xl">
      {running ? (
        <div className="flex flex-col items-center gap-3 py-10 text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
          <span
            className="flex items-center justify-center rounded-[var(--radius-lg)]"
            style={{ width: 44, height: 44, background: 'var(--accent-gradient-soft)', color: 'var(--accent)' }}
          >
            <FlaskConical className="w-5 h-5" />
          </span>
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Running with a sample event…
          </span>
        </div>
      ) : error ? (
        <div
          className="flex items-start gap-2.5 rounded-[var(--radius-lg)] border border-[var(--loss)] px-4 py-3 text-[var(--loss)]"
          style={{ background: 'var(--loss-dim)', fontSize: 'var(--text-sm)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : result ? (
        <div className="flex flex-col gap-4">
          <StatusBanner status={result.status} reason={result.reason} />

          {result.trace?.error && (
            <div
              className="rounded-[var(--radius-md)] border border-[var(--loss)] px-4 py-3 text-[var(--loss)]"
              style={{ background: 'var(--loss-dim)', fontSize: 'var(--text-sm)' }}
            >
              {result.trace.error}
            </div>
          )}

          {result.trace && result.trace.steps.length > 0 && (
            <div className="flex flex-col max-h-80 overflow-y-auto pr-1 pt-1">
              {result.trace.steps.map((step, i) => (
                <TimelineStep
                  key={step.node_id ?? i}
                  step={step}
                  index={i}
                  isLast={i === result.trace!.steps.length - 1}
                  lookups={lookups}
                />
              ))}
            </div>
          )}

          {result.trace && (
            <div className="text-[var(--text-muted)] border-t border-[var(--divider)] pt-3" style={{ fontSize: 'var(--text-xs)' }}>
              {result.trace.actions_run} action{result.trace.actions_run === 1 ? '' : 's'} would have run.
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  )
}
