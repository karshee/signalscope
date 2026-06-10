import type { ChannelScore } from '../../lib/api'

function ProgressBar({ value, max = 100, color = 'var(--accent)' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      className="w-full h-2 rounded-full overflow-hidden"
      style={{ background: 'var(--surface-3)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

interface MetricRowProps {
  label: string
  value: string | number
  pct: number
  color?: string
}

function MetricRow({ label, value, pct, color }: MetricRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
          {label}
        </span>
        <span
          className="font-semibold text-[var(--text)]"
          style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}
        >
          {value}
        </span>
      </div>
      <ProgressBar value={pct} color={color} />
    </div>
  )
}

interface ChannelScorecardProps {
  score: ChannelScore
}

export function ChannelScorecard({ score }: ChannelScorecardProps) {
  return (
    <div className="glass card-lift rounded-[var(--radius-lg)] p-5 flex flex-col gap-4">
      <h3 className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
        Performance Scorecard
      </h3>

      <div className="flex flex-col gap-4">
        <MetricRow
          label="Win Rate"
          value={score.win_rate != null ? `${Math.round(score.win_rate)}%` : '—'}
          pct={score.win_rate ?? 0}
          color="var(--win)"
        />
        <MetricRow
          label="Avg R:R"
          value={score.avg_rr != null ? `${score.avg_rr.toFixed(2)}x` : '—'}
          pct={score.avg_rr != null ? Math.min(100, (score.avg_rr / 5) * 100) : 0}
          color="var(--accent-gradient)"
        />
        <MetricRow
          label="Entry Accuracy"
          value={score.entry_accuracy != null ? `${Math.round(score.entry_accuracy)}%` : '—'}
          pct={score.entry_accuracy ?? 0}
          color="var(--pending)"
        />
        <MetricRow
          label="Quality Score"
          value={`${score.quality_score}/100`}
          pct={score.quality_score}
          color="var(--active)"
        />

        {/* Signal count */}
        <div className="pt-1 flex items-center justify-between" style={{ borderTop: '1px solid var(--divider)' }}>
          <span className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
            Total Signals
          </span>
          <span
            className="font-semibold text-[var(--text)]"
            style={{ fontSize: 'var(--text-md)', fontFamily: 'var(--font-mono)' }}
          >
            {score.signal_count}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
            Window
          </span>
          <span
            className="font-medium text-[var(--text)]"
            style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}
          >
            {score.window}
          </span>
        </div>
      </div>
    </div>
  )
}
