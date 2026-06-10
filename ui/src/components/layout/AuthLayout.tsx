import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Decorative floating gradient orbs */}
      <div
        aria-hidden
        className="absolute pointer-events-none float-y"
        style={{
          top: '10%',
          left: '12%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 229, 179, 0.14), transparent 70%)',
          filter: 'blur(42px)',
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none float-y"
        style={{
          bottom: '8%',
          right: '10%',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 179, 255, 0.12), transparent 70%)',
          filter: 'blur(52px)',
          animationDelay: '2.2s',
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none float-y"
        style={{
          top: '58%',
          left: '64%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129, 140, 248, 0.10), transparent 70%)',
          filter: 'blur(36px)',
          animationDelay: '1.1s',
        }}
      />

      <div className="relative w-full max-w-md page-enter">
        {/* Logo + wordmark */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none" className="flex-shrink-0">
            <circle cx="16" cy="16" r="13" stroke="var(--accent)" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="7" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
            <line x1="2" y1="16" x2="8" y2="16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="24" y1="16" x2="30" y2="16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="2" x2="16" y2="8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="24" x2="16" y2="30" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="16" cy="16" r="2.5" fill="var(--accent)" />
          </svg>
          <span
            className="font-extrabold gradient-text"
            style={{ fontSize: '22px', letterSpacing: '-0.02em' }}
          >
            Tapwire
          </span>
        </div>

        {/* Card */}
        <div
          className="glass rounded-[var(--radius-xl)] p-8"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          {children}
        </div>

        {/* Footer */}
        <p
          className="text-center mt-8 text-[var(--text-faint)]"
          style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.02em' }}
        >
          Tapwire — Telegram channel automation
        </p>
      </div>
    </div>
  )
}
