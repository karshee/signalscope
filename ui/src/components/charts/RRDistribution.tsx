import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface RRDistributionProps {
  values: number[]
}

export function RRDistribution({ values }: RRDistributionProps) {
  // Build histogram buckets: 0-1, 1-2, 2-3, 3-4, 4-5, 5+
  const buckets = [0, 0, 0, 0, 0, 0]
  const labels = ['0–1', '1–2', '2–3', '3–4', '4–5', '5+']

  for (const v of values) {
    if (v < 1) buckets[0]++
    else if (v < 2) buckets[1]++
    else if (v < 3) buckets[2]++
    else if (v < 4) buckets[3]++
    else if (v < 5) buckets[4]++
    else buckets[5]++
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Signals',
        data: buckets,
        backgroundColor: 'rgba(0,212,170,0.6)',
        borderColor: '#00d4aa',
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
          title: (items: import('chart.js').TooltipItem<'bar'>[]) => `R:R ${items[0].label}`,
          label: (ctx: import('chart.js').TooltipItem<'bar'>) => `${ctx.parsed.y ?? 0} signals`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8888a0', font: { size: 11 } },
        border: { color: 'rgba(255,255,255,0.07)' },
        title: { display: true, text: 'R:R Ratio', color: '#8888a0', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#8888a0', font: { size: 11 } },
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
