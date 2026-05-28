import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react'
import { clsx } from 'clsx'

// ── Fake signal data for hero animation ──────────────────────────────────────

const FAKE_SIGNALS = [
  {
    id: 1,
    pair: 'XAUUSD',
    dir: 'BUY',
    entry: '2,341.50',
    sl: '2,328.00',
    tp1: '2,355.00',
    status: 'active',
    channel: 'GoldTrader Pro',
    time: '2m',
  },
  {
    id: 2,
    pair: 'GBPUSD',
    dir: 'SELL',
    entry: '1.2847',
    sl: '1.2875',
    tp1: '1.2810',
    status: 'win',
    channel: 'FX Signals Elite',
    time: '18m',
  },
  {
    id: 3,
    pair: 'EURUSD',
    dir: 'BUY',
    entry: '1.0821',
    sl: '1.0798',
    tp1: '1.0860',
    status: 'pending',
    channel: 'EuroFX Daily',
    time: '1h',
  },
]

const statusColors: Record<string, string> = {
  active: '#f59e0b',
  win: '#22c55e',
  pending: '#6366f1',
  loss: '#ef4444',
}

// ── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300',
        scrolled
          ? 'backdrop-blur-md border-b'
          : ''
      )}
      style={{
        background: scrolled ? 'rgba(10,10,11,0.85)' : 'transparent',
        borderColor: scrolled ? 'rgba(255,255,255,0.07)' : 'transparent',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="#00d4aa" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="7" stroke="#00d4aa" strokeWidth="1" opacity="0.5" />
          <line x1="2" y1="16" x2="8" y2="16" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="24" y1="16" x2="30" y2="16" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="2" x2="16" y2="8" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="24" x2="16" y2="30" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2.5" fill="#00d4aa" />
        </svg>
        <span className="font-semibold text-white" style={{ fontSize: '16px' }}>
          SignalScope
        </span>
      </div>

      {/* Links */}
      <div className="hidden md:flex items-center gap-8">
        {['How it works', 'Pricing', 'Login'].map((item) => (
          <a
            key={item}
            href={item === 'Login' ? '/login' : `#${item.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={(e) => {
              if (item === 'Login') {
                e.preventDefault()
                navigate('/login')
              }
            }}
            className="text-[rgba(232,232,234,0.7)] hover:text-white transition-colors"
            style={{ fontSize: '14px' }}
          >
            {item}
          </a>
        ))}
      </div>

      <button
        onClick={() => navigate('/register')}
        className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] font-medium transition-all"
        style={{
          background: 'var(--accent)',
          color: '#0a0a0b',
          fontSize: '14px',
        }}
      >
        Get Started <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function FakeSignalCard({
  signal,
  delay,
}: {
  signal: (typeof FAKE_SIGNALS)[0]
  delay: number
}) {
  const isBuy = signal.dir === 'BUY'
  return (
    <div
      className="rounded-[var(--radius-lg)] border p-4"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        animation: `slideInFromTop 400ms cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{signal.channel}</span>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
          {signal.time}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text)' }}>
          {signal.pair}
        </span>
        <span
          style={{
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: isBuy ? 'var(--win)' : 'var(--loss)',
          }}
        >
          {isBuy ? '▲' : '▼'} {signal.dir}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3" style={{ fontSize: '11px' }}>
        {[
          { l: 'Entry', v: signal.entry, c: 'var(--text)' },
          { l: 'SL', v: signal.sl, c: 'var(--loss)' },
          { l: 'TP1', v: signal.tp1, c: 'var(--win)' },
        ].map(({ l, v, c }) => (
          <div key={l}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{l}</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: c, fontWeight: 500 }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium"
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: statusColors[signal.status],
            background: `${statusColors[signal.status]}18`,
            border: `1px solid ${statusColors[signal.status]}`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: statusColors[signal.status] }}
          />
          {signal.status.toUpperCase()}
        </span>
      </div>
    </div>
  )
}

function Hero() {
  const navigate = useNavigate()
  return (
    <section
      className="relative min-h-screen flex items-center pt-20"
      style={{
        background: 'var(--bg)',
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 50% -20%, rgba(0,212,170,0.08) 0%, transparent 60%),
          repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.02) 60px, rgba(255,255,255,0.02) 61px),
          repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.02) 60px, rgba(255,255,255,0.02) 61px)
        `,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left */}
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6"
            style={{
              background: 'var(--accent-dim)',
              borderColor: 'rgba(0,212,170,0.3)',
              fontSize: '12px',
              color: 'var(--accent)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] pulse-dot" />
            Live signal tracking — no spreadsheets required
          </div>

          <h1
            className="font-bold text-white leading-tight mb-6"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.02em' }}
          >
            Finally know if your signal channels are actually{' '}
            <span style={{ color: 'var(--accent)' }}>good.</span>
          </h1>

          <p
            className="leading-relaxed mb-8"
            style={{ fontSize: '18px', color: 'rgba(232,232,234,0.65)', maxWidth: '520px' }}
          >
            SignalScope tracks every signal from every channel you follow — and shows you the real win
            rate, real R:R, and whether they're even reaching entry.
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] font-semibold transition-all hover:scale-[1.02]"
              style={{
                background: 'var(--accent)',
                color: '#0a0a0b',
                fontSize: '15px',
                boxShadow: '0 4px 24px rgba(0,212,170,0.3)',
              }}
            >
              Start Free <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] font-medium transition-colors hover:bg-[var(--surface-hover)]"
              style={{
                background: 'transparent',
                color: 'rgba(232,232,234,0.8)',
                fontSize: '15px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              See Live Demo
            </button>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            No credit card required · 14-day free trial · Cancel anytime
          </p>
        </div>

        {/* Right — fake signal cards */}
        <div className="flex flex-col gap-3 max-w-sm lg:max-w-none ml-auto">
          {FAKE_SIGNALS.map((s, i) => (
            <FakeSignalCard key={s.id} signal={s} delay={200 + i * 400} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { label: '12,400+', sub: 'signals tracked' },
    { label: '847', sub: 'channels analysed' },
    { label: '£2.1M', sub: 'in signals verified' },
  ]

  return (
    <div
      className="border-y"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="max-w-4xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-0">
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center">
            <div className="px-12 text-center">
              <div
                className="font-bold text-[var(--text)]"
                style={{ fontSize: '22px', fontFamily: 'var(--font-mono)' }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
            {i < stats.length - 1 && (
              <div className="w-px h-8" style={{ background: 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Connect Telegram',
      desc: 'Add your Telegram API credentials and link the signal channels you follow. Takes less than 2 minutes.',
    },
    {
      n: '02',
      title: 'Parse every signal',
      desc: 'Our AI parser reads every message and extracts entry, SL, TP levels, and direction — automatically.',
    },
    {
      n: '03',
      title: 'See the truth',
      desc: 'Track real outcomes against broker prices. See which channels actually deliver, and drop the rest.',
    },
  ]

  return (
    <section
      id="how-it-works"
      className="py-32"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="font-bold text-white mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}
          >
            How it works
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
            Set up once. Data flows forever.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.n}
              className="rounded-[var(--radius-xl)] border p-8"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div
                className="font-bold mb-4"
                style={{ fontSize: '48px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', opacity: 0.4, lineHeight: 1 }}
              >
                {step.n}
              </div>
              <h3
                className="font-semibold text-white mb-3"
                style={{ fontSize: '20px' }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const tiers = [
    { tier: 'S', score: 94, label: 'Elite' },
    { tier: 'A', score: 78, label: 'Excellent' },
    { tier: 'B', score: 62, label: 'Good' },
    { tier: 'C', score: 48, label: 'Average' },
    { tier: 'F', score: 21, label: 'Poor' },
  ]
  const tierColors: Record<string, string> = {
    S: '#00d4aa', A: '#22c55e', B: '#818cf8', C: '#f59e0b', F: '#ef4444',
  }

  return (
    <section
      style={{ background: 'var(--surface)', paddingTop: '80px', paddingBottom: '80px' }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Everything you need to trade smarter
          </h2>
        </div>

        {/* Asymmetric layout */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Wide left */}
          <div
            className="lg:col-span-3 rounded-[var(--radius-xl)] border p-8"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <div
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border mb-4"
              style={{ background: 'var(--win-dim)', borderColor: 'var(--win)', fontSize: '11px', color: 'var(--win)' }}
            >
              REAL OUTCOME TRACKING
            </div>
            <h3 className="font-bold text-white mb-3" style={{ fontSize: '24px' }}>
              Stop guessing. Start knowing.
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              Every signal is tracked from the moment it posts to when it resolves. Win, loss, or
              expired — you'll know exactly how every channel performs over time.
            </p>

            {/* Mock win-rate bars */}
            <div className="flex flex-col gap-3">
              {[
                { label: 'Week 1', pct: 72, wins: 18, losses: 7 },
                { label: 'Week 2', pct: 81, wins: 22, losses: 5 },
                { label: 'Week 3', pct: 44, wins: 11, losses: 14 },
                { label: 'Week 4', pct: 68, wins: 17, losses: 8 },
              ].map((w) => (
                <div key={w.label} className="flex items-center gap-3">
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: '48px', flexShrink: 0 }}>
                    {w.label}
                  </span>
                  <div className="flex-1 h-5 rounded overflow-hidden flex" style={{ background: 'var(--surface-3)' }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${w.pct}%`,
                        background: w.pct >= 50 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: w.pct >= 50 ? 'var(--win)' : 'var(--loss)', width: '36px', flexShrink: 0 }}>
                    {w.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right stack */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Leaderboard */}
            <div
              className="rounded-[var(--radius-xl)] border p-6 flex-1"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border mb-4"
                style={{ background: 'var(--active-dim)', borderColor: 'var(--active)', fontSize: '11px', color: 'var(--active)' }}
              >
                CHANNEL LEADERBOARD
              </div>
              <h3 className="font-semibold text-white mb-3" style={{ fontSize: '18px' }}>
                Rank every channel
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                A live leaderboard shows which channels are actually delivering alpha — sortable by
                win rate, R:R, and signal frequency.
              </p>
            </div>

            {/* Quality score */}
            <div
              className="rounded-[var(--radius-xl)] border p-6"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border mb-4"
                style={{ background: 'var(--accent-dim)', borderColor: 'var(--accent)', fontSize: '11px', color: 'var(--accent)' }}
              >
                QUALITY SCORE
              </div>
              <h3 className="font-semibold text-white mb-4" style={{ fontSize: '18px' }}>
                S→F tier ratings
              </h3>
              <div className="flex gap-2">
                {tiers.map((t) => (
                  <div
                    key={t.tier}
                    className="flex-1 flex flex-col items-center gap-1 p-2 rounded-[var(--radius-md)]"
                    style={{ background: `${tierColors[t.tier]}10` }}
                  >
                    <span
                      className="font-bold"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: tierColors[t.tier] }}
                    >
                      {t.tier}
                    </span>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {t.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  const [annual, setAnnual] = useState(false)

  const tiers = [
    {
      name: 'Free',
      price: 0,
      annualPrice: 0,
      features: [
        '3 channels',
        '30-day history',
        'Basic win rate & R:R',
        'Signal feed',
        null,
        null,
      ],
      cta: 'Start Free',
      featured: false,
    },
    {
      name: 'Pro',
      price: 19,
      annualPrice: 15,
      features: [
        '25 channels',
        'Unlimited history',
        'All metrics + Entry accuracy',
        'MT5 integration',
        'Telegram notifications',
        'CSV export',
      ],
      cta: 'Start Pro Trial',
      featured: true,
    },
    {
      name: 'Team',
      price: 79,
      annualPrice: 65,
      features: [
        'Unlimited channels',
        'Unlimited history',
        'All Pro features',
        'API access',
        'White-label reports',
        'Priority support',
      ],
      cta: 'Contact Sales',
      featured: false,
    },
  ]

  return (
    <section
      id="pricing"
      className="py-32"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Simple pricing
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
            Start free. Upgrade when you're ready.
          </p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span style={{ fontSize: '14px', color: annual ? 'var(--text-muted)' : 'var(--text)' }}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual((a) => !a)}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ background: annual ? 'var(--accent)' : 'var(--surface-3)' }}
            >
              <div
                className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                style={{ left: annual ? '24px' : '4px' }}
              />
            </button>
            <span style={{ fontSize: '14px', color: annual ? 'var(--text)' : 'var(--text-muted)' }}>
              Annual{' '}
              <span
                className="inline-flex px-1.5 py-0.5 rounded"
                style={{ background: 'var(--win-dim)', color: 'var(--win)', fontSize: '11px' }}
              >
                2 months free
              </span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="rounded-[var(--radius-xl)] border flex flex-col p-8"
              style={{
                background: tier.featured ? 'var(--surface)' : 'var(--surface)',
                borderColor: tier.featured ? 'var(--accent)' : 'var(--border)',
                boxShadow: tier.featured ? 'var(--shadow-accent)' : 'none',
                position: 'relative',
              }}
            >
              {tier.featured && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full font-medium"
                  style={{
                    background: 'var(--accent)',
                    color: '#0a0a0b',
                    fontSize: '11px',
                  }}
                >
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-white mb-2" style={{ fontSize: '18px' }}>
                  {tier.name}
                </h3>
                <div className="flex items-end gap-1">
                  <span
                    className="font-bold text-white"
                    style={{ fontSize: '36px', fontFamily: 'var(--font-mono)' }}
                  >
                    {tier.price === 0
                      ? 'Free'
                      : `£${annual ? tier.annualPrice : tier.price}`}
                  </span>
                  {tier.price > 0 && (
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', paddingBottom: '6px' }}>
                      /mo
                    </span>
                  )}
                </div>
                {annual && tier.price > 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    billed £{tier.annualPrice * 12}/year
                  </p>
                )}
              </div>

              <ul className="flex flex-col gap-3 flex-1 mb-8">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    {f ? (
                      <>
                        <Check
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: tier.featured ? 'var(--accent)' : 'var(--win)' }}
                        />
                        <span style={{ fontSize: '14px', color: 'var(--text)' }}>{f}</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
                        <span style={{ fontSize: '14px', color: 'var(--text-faint)' }}>—</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              <button
                className="w-full py-3 rounded-[var(--radius-md)] font-semibold transition-all"
                style={{
                  background: tier.featured ? 'var(--accent)' : 'var(--surface-3)',
                  color: tier.featured ? '#0a0a0b' : 'var(--text)',
                  fontSize: '14px',
                  border: tier.featured ? 'none' : '1px solid var(--border)',
                }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const quotes = [
    {
      quote:
        "I was following 8 channels thinking they were all decent. SignalScope showed 6 of them had sub-40% win rates. Dropped them immediately and my account started growing.",
      name: 'James K.',
      role: 'Retail FX trader, 4 years',
    },
    {
      quote:
        "The R:R tracking is what sold me. I realised my 'best' channel had a 70% win rate but the R:R was 0.4. I was actually losing money following signals that won most of the time.",
      name: 'Sarah M.',
      role: 'Crypto & commodities trader',
    },
    {
      quote:
        "Setup took 5 minutes. Now I have a clean leaderboard of all my channels. The tier system makes it instant to see who's actually delivering.",
      name: 'Tom R.',
      role: 'Part-time futures trader',
    },
  ]

  return (
    <section className="py-24" style={{ background: 'var(--surface)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <h2
          className="text-center font-bold text-white mb-12"
          style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
        >
          Traders who stopped guessing
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {quotes.map((q) => (
            <div
              key={q.name}
              className="rounded-[var(--radius-xl)] border p-6 flex flex-col gap-4"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, flex: 1 }}>
                "{q.quote}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '13px' }}
                >
                  {q.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-white" style={{ fontSize: '13px' }}>
                    {q.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'How does SignalScope get the signals?',
    a: 'You connect your Telegram account using the official Telegram API. SignalScope reads messages from the channels you specify — it never posts or interacts with them.',
  },
  {
    q: 'Does it work with any Telegram signal channel?',
    a: "Yes. As long as you can access the channel through your Telegram account, SignalScope can monitor it. This includes public channels, private channels you've joined, and groups.",
  },
  {
    q: 'How accurate is the signal parsing?',
    a: "Our AI parser handles 95%+ of common signal formats. For edge cases you can view the raw message alongside the parsed result — confidence scores show you when a parse might be incomplete.",
  },
  {
    q: 'Where does the price data come from for outcome tracking?',
    a: 'You connect your MT5 account (optional) for live broker price feeds. Without MT5 we use market price data — accuracy may vary slightly from your specific broker quotes.',
  },
  {
    q: 'Can I export my data?',
    a: 'Pro and Team plans can export full signal history as CSV. The API (Team plan) gives programmatic access to all your data.',
  },
  {
    q: 'Is my Telegram account safe?',
    a: "Yes. We use official Telegram API methods. Your API credentials are encrypted at rest. SignalScope only reads from channels — it never sends messages or modifies your account.",
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-6">
        <h2
          className="text-center font-bold text-white mb-12"
          style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
        >
          Frequently asked questions
        </h2>
        <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-lg)] border overflow-hidden"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--surface-hover)] transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-white" style={{ fontSize: '15px' }}>
                  {item.q}
                </span>
                <ChevronDown
                  className={clsx(
                    'w-4 h-4 text-[var(--text-muted)] flex-shrink-0 ml-4 transition-transform',
                    open === i && 'rotate-180'
                  )}
                />
              </button>
              {open === i && (
                <div
                  className="px-5 pb-4"
                  style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}
                >
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="#00d4aa" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="2.5" fill="#00d4aa" />
          </svg>
          <div>
            <div className="font-semibold text-white" style={{ fontSize: '14px' }}>
              SignalScope
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              Know if your channels are actually good.
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 justify-center">
          {['Privacy', 'Terms', 'Contact', 'Docs'].map((l) => (
            <a
              key={l}
              href="#"
              className="hover:text-white transition-colors"
              style={{ fontSize: '13px', color: 'var(--text-muted)' }}
            >
              {l}
            </a>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
          © 2025 SignalScope
        </div>
      </div>
    </footer>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Nav />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  )
}
