interface PairData {
  pair: string
  wins: number
  losses: number
  total: number
}

interface PairHeatmapProps {
  data: PairData[]
}

function winRateColor(pct: number): string {
  if (pct >= 70) return { bg: 'rgba(34,197,94,0.3)', text: '#22c55e' }.bg
  if (pct >= 55) return 'rgba(34,197,94,0.15)'
  if (pct >= 45) return 'rgba(245,158,11,0.15)'
  if (pct >= 30) return 'rgba(239,68,68,0.15)'
  return 'rgba(239,68,68,0.3)'
}

function winRateTextColor(pct: number): string {
  if (pct >= 55) return '#22c55e'
  if (pct >= 45) return '#f59e0b'
  return '#ef4444'
}

export function PairHeatmap({ data }: PairHeatmapProps) {
  if (data.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-lg)] p-8 text-center"
        style={{ background: 'var(--surface-2)' }}
      >
        <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
          No pair data available yet
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Pair', 'Signals', 'Wins', 'Losses', 'Win Rate'].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 font-medium"
                style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const pct = row.total > 0 ? Math.round((row.wins / row.total) * 100) : 0
            return (
              <tr
                key={row.pair}
                className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <td
                  className="px-4 py-3 font-semibold"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}
                >
                  {row.pair}
                </td>
                <td
                  className="px-4 py-3"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
                >
                  {row.total}
                </td>
                <td
                  className="px-4 py-3"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--win)' }}
                >
                  {row.wins}
                </td>
                <td
                  className="px-4 py-3"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--loss)' }}
                >
                  {row.losses}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block px-2 py-0.5 rounded"
                    style={{
                      background: winRateColor(pct),
                      color: winRateTextColor(pct),
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                    }}
                  >
                    {pct}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
