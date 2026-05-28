import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'var(--bg)',
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(255,255,255,0.03) 35px, rgba(255,255,255,0.03) 36px),
          repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(255,255,255,0.03) 35px, rgba(255,255,255,0.03) 36px)
        `,
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="var(--accent)" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="7" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
            <line x1="2" y1="16" x2="8" y2="16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="24" y1="16" x2="30" y2="16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="2" x2="16" y2="8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="24" x2="16" y2="30" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="16" cy="16" r="2.5" fill="var(--accent)" />
          </svg>
          <span className="font-semibold text-[var(--text)]" style={{ fontSize: '20px' }}>
            Tapwire
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-[var(--radius-xl)] border border-[var(--border)] p-8"
          style={{
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
