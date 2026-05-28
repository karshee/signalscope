import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface RadarScoreProps {
  scores: {
    winRate: number
    rrAccuracy: number
    entryPrecision: number
    frequency: number
    transparency: number
    consistency: number
  }
}

export function RadarScore({ scores }: RadarScoreProps) {
  const data = {
    labels: [
      'Win Rate',
      'R:R Accuracy',
      'Entry Precision',
      'Frequency',
      'Transparency',
      'Consistency',
    ],
    datasets: [
      {
        label: 'Channel Score',
        data: [
          scores.winRate,
          scores.rrAccuracy,
          scores.entryPrecision,
          scores.frequency,
          scores.transparency,
          scores.consistency,
        ],
        backgroundColor: 'rgba(0,212,170,0.15)',
        borderColor: '#00d4aa',
        borderWidth: 2,
        pointBackgroundColor: '#00d4aa',
        pointBorderColor: '#00d4aa',
        pointRadius: 3,
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
          label: (ctx: { parsed: { r: number } }) => `${ctx.parsed.r}/100`,
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.06)' },
        angleLines: { color: 'rgba(255,255,255,0.06)' },
        ticks: {
          display: false,
          stepSize: 25,
        },
        pointLabels: {
          color: '#8888a0',
          font: { family: 'Inter', size: 11 },
        },
      },
    },
  }

  return (
    <div style={{ height: '280px' }}>
      <Radar data={data} options={options} />
    </div>
  )
}
