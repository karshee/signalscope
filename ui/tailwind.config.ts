import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        ui: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      colors: {
        bg: '#0a0a0b',
        surface: '#111114',
        'surface-2': '#18181c',
        'surface-3': '#1f1f24',
        'surface-hover': '#26262c',
        accent: '#00d4aa',
        'accent-hover': '#00bfa0',
        win: '#22c55e',
        loss: '#ef4444',
        active: '#f59e0b',
        expired: '#6b7280',
        pending: '#6366f1',
      },
    },
  },
  plugins: [],
} satisfies Config
