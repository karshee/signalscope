import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface WeekData {
  week: string
  wins: number
  losses: number
}

interface WinRateChartProps {
  data: WeekData[]
}

export function WinRateChart({ data }: WinRateChartProps) {
  const winRates = data.map((d) => {
    const total = d.wins + d.losses
    return total > 0 ? Math.round((d.wins / total) * 100) : 0
  })

  const barColors = winRates.map((r) =>
    r >= 50 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'
  )
  const borderColors = winRates.map((r) =>
    r >= 50 ? '#22c55e' : '#ef4444'
  )

  const chartData = {
    labels: data.map((d) => d.week),
    datasets: [
      {
        label: 'Win Rate %',
        data: winRates,
        backgroundColor: barColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181c',
        borderColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        titleColor: '#e8e8ea',
        bodyColor: '#8888a0',
        callbacks: {
          label: (ctx: import('chart.js').TooltipItem<'bar'>) => `${ctx.parsed.y ?? 0}% win rate`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#8888a0',
          font: { family: 'JetBrains Mono', size: 11 },
        },
        border: { color: 'rgba(255,255,255,0.07)' },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#8888a0',
          font: { family: 'JetBrains Mono', size: 11 },
          callback: (val: string | number) => `${val}%`,
        },
        border: { color: 'rgba(255,255,255,0.07)' },
      },
    },
  }

  return (
    <div style={{ height: '200px' }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
