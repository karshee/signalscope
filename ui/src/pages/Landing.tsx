import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Check, ArrowRight, TrendingUp, BarChart2, Shield } from 'lucide-react'
import { clsx } from 'clsx'

// ── Signal data for hero preview ──────────────────────────────────────────────

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
    channelScore: 84,
    channelTier: 'A',
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
    channelScore: 91,
    channelTier: 'S',
    time: '18m',
  },
  {
    id: 3,
    pair: 'EURUSD',
    dir: 'BUY',
    entry: '1.0821',
    sl: '1.0798',
    tp1: '1.0860',
    status: 'loss',
    channel: 'EuroFX Daily',
    channelScore: 31,
    channelTier: 'F',
    time: '1h',
  },
]

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  active: { color: '#f59e0b', label: 'ACTIVE' },
  win:    { color: '#22c55e', label: 'TP1 HIT' },
  loss:   { color: '#ef4444', label: 'SL HIT' },
  pending:{ color: '#6366f1', label: 'PENDING' },
}

const TIER_COLOR: Record<string, string> = {
  S: '#00d4aa', A: '#22c55e', B: '#818cf8', C: '#f59e0b', D: '#f97316', F: '#ef4444',
}

// ── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(10,10,11,0.92)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
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
        <span className="font-semibold text-white" style={{ fontSize: '16px' }}>SignalScope</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {[
          { label: 'How it works', href: '#how-it-works' },
          { label: 'Pricing', href: '#pricing' },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="transition-colors"
            style={{ fontSize: '14px', color: 'rgba(232,232,234,0.65)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,232,234,0.65)')}
          >
            {item.label}
          </a>
        ))}
        <button
          onClick={() => navigate('/login')}
          className="transition-colors"
          style={{ fontSize: '14px', color: 'rgba(232,232,234,0.65)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'white')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,232,234,0.65)')}
        >
          Login
        </button>
      </div>

      <button
        onClick={() => navigate('/register')}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
        style={{ background: 'var(--accent)', color: '#0a0a0b', fontSize: '14px' }}
      >
        Get Started <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}

// ── Fake signal card ──────────────────────────────────────────────────────────

function FakeSignalCard({
  signal,
  delay,
}: {
  signal: (typeof FAKE_SIGNALS)[0]
  delay: number
}) {
  const isBuy = signal.dir === 'BUY'
  const st = STATUS_STYLE[signal.status]
  const tierColor = TIER_COLOR[signal.channelTier]

  return (
    <div
      className="rounded-xl border p-3.5"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        animation: `slideInFromTop 500ms cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Channel row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{signal.channel}</span>
          <span
            className="px-1.5 py-0.5 rounded font-bold"
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: tierColor,
              background: `${tierColor}18`,
            }}
          >
            {signal.channelTier}
          </span>
        </div>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
          {signal.time}
        </span>
      </div>

      {/* Pair + direction */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '17px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text)' }}>
            {signal.pair}
          </span>
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: isBuy ? 'var(--win)' : 'var(--loss)',
            }}
          >
            {isBuy ? '▲' : '▼'} {signal.dir}
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded"
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: st.color,
            background: `${st.color}18`,
            border: `1px solid ${st.color}40`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
          {st.label}
        </span>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-3 gap-2" style={{ fontSize: '11px' }}>
        {[
          { l: 'Entry', v: signal.entry, c: 'var(--text)' },
          { l: 'SL', v: signal.sl, c: 'var(--loss)' },
          { l: 'TP1', v: signal.tp1, c: 'var(--win)' },
        ].map(({ l, v, c }) => (
          <div key={l}>
            <div style={{ color: 'var(--text-faint)', marginBottom: 2, fontSize: '10px' }}>{l}</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: c, fontWeight: 500 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  const navigate = useNavigate()

  return (
    <section
      className="relative"
      style={{
        background: 'var(--bg)',
        backgroundImage: `
          radial-gradient(ellipse 70% 50% at 60% 0%, rgba(0,212,170,0.07) 0%, transparent 55%),
          repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.018) 60px, rgba(255,255,255,0.018) 61px),
          repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.018) 60px, rgba(255,255,255,0.018) 61px)
        `,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Left */}
        <div className="pt-4">
          {/* Pain hook */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5"
            style={{
              background: 'rgba(239,68,68,0.08)',
              borderColor: 'rgba(239,68,68,0.25)',
              fontSize: '12px',
              color: '#f87171',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            The average Telegram signal channel wins less than 50% of trades
          </div>

          <h1
            className="font-bold text-white leading-tight mb-5"
            style={{ fontSize: 'clamp(36px, 3.8vw, 52px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
          >
            Finally know if your signal channels are actually{' '}
            <span style={{ color: 'var(--accent)' }}>good.</span>
          </h1>

          <p
            className="mb-8"
            style={{ fontSize: '17px', color: 'rgba(232,232,234,0.6)', maxWidth: '480px', lineHeight: 1.65 }}
          >
            SignalScope watches every channel you follow and tracks every signal to its outcome — so you can see the real win rate, real R:R, and whether entries even get hit.
          </p>

          <div className="flex flex-wrap gap-3 mb-5">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{
                background: 'var(--accent)',
                color: '#0a0a0b',
                fontSize: '15px',
                boxShadow: '0 4px 24px rgba(0,212,170,0.35)',
              }}
            >
              Start Free <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors"
              style={{
                background: 'transparent',
                color: 'rgba(232,232,234,0.75)',
                fontSize: '15px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            >
              View the app
            </button>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            Free forever · No credit card · Connect in 5 minutes
          </p>

          {/* Trust marks */}
          <div className="flex flex-wrap items-center gap-5 mt-8 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
            {[
              { icon: '🔒', text: 'Read-only Telegram access' },
              { icon: '📡', text: '35+ trading pairs' },
              { icon: '⚡', text: 'Real-time outcomes' },
            ].map((t) => (
              <div key={t.text} className="flex items-center gap-1.5">
                <span style={{ fontSize: '13px' }}>{t.icon}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — signal feed preview */}
        <div className="flex flex-col gap-3 lg:pt-4">
          {/* Mini header */}
          <div
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                LIVE SIGNAL FEED
              </span>
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
              3 channels
            </span>
          </div>

          {FAKE_SIGNALS.map((s, i) => (
            <FakeSignalCard key={s.id} signal={s} delay={100 + i * 200} />
          ))}

          {/* Channel score summary */}
          <div
            className="rounded-xl border p-3.5"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              animation: 'slideInFromTop 500ms cubic-bezier(0.16,1,0.3,1) 700ms both',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
                CHANNEL SCORES · 30D
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>win rate / R:R</span>
            </div>
            {[
              { name: 'GoldTrader Pro', tier: 'A', win: '68%', rr: '2.1x' },
              { name: 'FX Signals Elite', tier: 'S', win: '74%', rr: '2.8x' },
              { name: 'EuroFX Daily', tier: 'F', win: '38%', rr: '0.6x' },
            ].map((ch) => (
              <div key={ch.name} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--divider)' }}>
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold px-1.5 py-0.5 rounded"
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: TIER_COLOR[ch.tier],
                      background: `${TIER_COLOR[ch.tier]}18`,
                      minWidth: '22px',
                      textAlign: 'center',
                    }}
                  >
                    {ch.tier}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ch.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: parseFloat(ch.win) >= 50 ? 'var(--win)' : 'var(--loss)' }}>
                    {ch.win}
                  </span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {ch.rr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: '12,400+', label: 'signals tracked', icon: '⚡' },
    { value: '847',     label: 'channels analysed', icon: '📡' },
    { value: '£2.1M',   label: 'in verified signal value', icon: '📊' },
  ]

  return (
    <div
      className="border-y"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-wrap items-center justify-center gap-0">
        {stats.map((s, i) => (
          <div key={s.value} className="flex items-center">
            <div className="px-10 py-1 text-center">
              <div
                className="font-bold text-white"
                style={{ fontSize: '30px', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
            </div>
            {i < stats.length - 1 && (
              <div className="w-px h-10" style={{ background: 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pain section ──────────────────────────────────────────────────────────────

function PainSection() {
  const channels = [
    { name: 'ForexAlphaVIP', members: '41K', wr: 38, trend: 'down' },
    { name: 'CryptoCallsPro', members: '28K', wr: 44, trend: 'down' },
    { name: 'GoldSignalsDaily', members: '19K', wr: 52, trend: 'up' },
    { name: 'FXMasterAlerts', members: '67K', wr: 41, trend: 'down' },
    { name: 'PipsHunterPro', members: '33K', wr: 35, trend: 'down' },
  ]

  return (
    <section className="py-20" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border mb-5"
              style={{
                background: 'rgba(239,68,68,0.08)',
                borderColor: 'rgba(239,68,68,0.2)',
                fontSize: '11px',
                color: '#f87171',
                letterSpacing: '0.05em',
              }}
            >
              THE PROBLEM
            </div>
            <h2
              className="font-bold text-white mb-4 leading-tight"
              style={{ fontSize: 'clamp(24px, 3vw, 36px)', letterSpacing: '-0.02em' }}
            >
              Most channels are losing you money. You just don't have the data to see it.
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '20px' }}>
              Telegram signal channels rarely show their track record. You see the wins. You don't see the 60% of signals that quietly hit stop loss. 70% win rate means nothing if the R:R is 0.3.
            </p>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              SignalScope tracks every signal to its actual outcome — automatically, in the background, on every channel you follow.
            </p>
          </div>

          {/* Fake bad channel table */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
                YOUR CHANNELS · LAST 90 DAYS
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>win rate</span>
            </div>
            {channels.map((ch, i) => (
              <div
                key={ch.name}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: i < channels.length - 1 ? '1px solid var(--divider)' : 'none' }}
              >
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{ch.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                    {ch.members} members
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${ch.wr}%`,
                        background: ch.wr >= 50 ? 'var(--win)' : 'var(--loss)',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: ch.wr >= 50 ? 'var(--win)' : 'var(--loss)',
                      minWidth: '36px',
                      textAlign: 'right',
                    }}
                  >
                    {ch.wr}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── How it works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: '01',
      icon: <Shield className="w-5 h-5" />,
      title: 'Connect your Telegram',
      desc: 'Add your Telegram API credentials. SignalScope connects read-only — it never posts, never interacts, never touches your messages.',
      detail: 'Takes under 5 minutes',
    },
    {
      n: '02',
      icon: <BarChart2 className="w-5 h-5" />,
      title: 'Every signal is captured and parsed',
      desc: 'Entry, SL, TP levels, direction, and pair — extracted automatically from every message on every channel you watch.',
      detail: '35+ pairs supported',
    },
    {
      n: '03',
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'See who actually delivers',
      desc: 'Live price feeds track whether each signal hit entry, reached a TP, or stopped out. Real win rates. Real R:R. No cherry-picking.',
      detail: 'Updated in real-time',
    },
  ]

  return (
    <section id="how-it-works" className="py-28" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-16">
          <p
            className="font-semibold mb-3"
            style={{ fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.08em' }}
          >
            HOW IT WORKS
          </p>
          <h2
            className="font-bold text-white leading-tight"
            style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', letterSpacing: '-0.02em', maxWidth: '560px' }}
          >
            Set up in 5 minutes.
            <br />
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Data flows forever.</span>
          </h2>
        </div>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div
            className="hidden lg:block absolute top-9 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, var(--border) 10%, var(--border) 90%, transparent)', zIndex: 0 }}
          />

          <div className="grid lg:grid-cols-3 gap-px lg:gap-0 relative">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className="relative lg:px-8 pb-8 lg:pb-0"
                style={{ paddingTop: i === 0 ? 0 : undefined }}
              >
                {/* Mobile connector */}
                {i > 0 && (
                  <div
                    className="lg:hidden w-px h-6 mb-4"
                    style={{ background: 'var(--border)', marginLeft: '19px' }}
                  />
                )}

                {/* Number circle */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      background: 'var(--bg)',
                      borderColor: 'var(--accent)',
                      color: 'var(--accent)',
                    }}
                  >
                    {step.n}
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight
                      className="hidden lg:block absolute top-3 -right-3 w-4 h-4 z-10"
                      style={{ color: 'var(--text-faint)' }}
                    />
                  )}
                </div>

                <div className="lg:pr-6">
                  <h3
                    className="font-semibold text-white mb-2"
                    style={{ fontSize: '17px' }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '10px' }}>
                    {step.desc}
                  </p>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 500,
                    }}
                  >
                    → {step.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────

function Features() {
  const tiers = [
    { tier: 'S', score: 94 },
    { tier: 'A', score: 78 },
    { tier: 'B', score: 62 },
    { tier: 'C', score: 48 },
    { tier: 'F', score: 21 },
  ]

  return (
    <section style={{ background: 'var(--surface)', paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <p
            className="font-semibold mb-3"
            style={{ fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.08em' }}
          >
            FEATURES
          </p>
          <h2
            className="font-bold text-white leading-tight"
            style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', letterSpacing: '-0.02em' }}
          >
            One question. Every answer.
            <br />
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Is this channel actually worth following?</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* Wide left */}
          <div
            className="lg:col-span-3 rounded-xl border p-7"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <div
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border mb-4"
              style={{ background: 'var(--win-dim)', borderColor: 'rgba(34,197,94,0.3)', fontSize: '11px', color: 'var(--win)', letterSpacing: '0.05em' }}
            >
              REAL OUTCOME TRACKING
            </div>
            <h3 className="font-bold text-white mb-2" style={{ fontSize: '22px', letterSpacing: '-0.01em' }}>
              Stop guessing. Start knowing.
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '20px' }}>
              Every signal is tracked from the moment it posts to when it resolves — win, loss, or expired. You'll know exactly how each channel performs week by week.
            </p>

            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Week 1', pct: 72 },
                { label: 'Week 2', pct: 81 },
                { label: 'Week 3', pct: 44 },
                { label: 'Week 4', pct: 68 },
              ].map((w) => (
                <div key={w.label} className="flex items-center gap-3">
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', width: '46px', flexShrink: 0 }}>
                    {w.label}
                  </span>
                  <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${w.pct}%`,
                        background: w.pct >= 50 ? 'rgba(34,197,94,0.65)' : 'rgba(239,68,68,0.65)',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: w.pct >= 50 ? 'var(--win)' : 'var(--loss)',
                      width: '36px',
                      flexShrink: 0,
                      textAlign: 'right',
                    }}
                  >
                    {w.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right stack */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div
              className="rounded-xl border p-6 flex-1"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border mb-3"
                style={{ background: 'var(--active-dim)', borderColor: 'rgba(245,158,11,0.3)', fontSize: '11px', color: 'var(--active)', letterSpacing: '0.05em' }}
              >
                CHANNEL LEADERBOARD
              </div>
              <h3 className="font-semibold text-white mb-2" style={{ fontSize: '17px' }}>
                See who's actually delivering
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                A live leaderboard ranks every channel by real performance — sortable by win rate, R:R, and entry accuracy.
              </p>
            </div>

            <div
              className="rounded-xl border p-6"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border mb-3"
                style={{ background: 'var(--accent-dim)', borderColor: 'rgba(0,212,170,0.3)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.05em' }}
              >
                QUALITY SCORE
              </div>
              <h3 className="font-semibold text-white mb-3" style={{ fontSize: '17px' }}>
                Instant quality tiers
              </h3>
              <div className="flex gap-2">
                {tiers.map((t) => (
                  <div
                    key={t.tier}
                    className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg"
                    style={{ background: `${TIER_COLOR[t.tier]}12` }}
                  >
                    <span
                      className="font-bold"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', color: TIER_COLOR[t.tier] }}
                    >
                      {t.tier}
                    </span>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
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

// ── Mid-page CTA ──────────────────────────────────────────────────────────────

function MidCta() {
  const navigate = useNavigate()
  return (
    <section
      className="py-20 text-center"
      style={{
        background: 'var(--bg)',
        backgroundImage: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(0,212,170,0.05) 0%, transparent 70%)',
      }}
    >
      <div className="max-w-2xl mx-auto px-6">
        <h2
          className="font-bold text-white mb-4 leading-tight"
          style={{ fontSize: 'clamp(24px, 3vw, 36px)', letterSpacing: '-0.02em' }}
        >
          How does your current channel stack hold up?
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
          Connect your channels in 5 minutes and see the leaderboard. Free, no card required.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold transition-all hover:opacity-90"
          style={{
            background: 'var(--accent)',
            color: '#0a0a0b',
            fontSize: '15px',
            boxShadow: '0 4px 24px rgba(0,212,170,0.3)',
          }}
        >
          See your channel scores <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  )
}

// ── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  const [annual, setAnnual] = useState(false)
  const navigate = useNavigate()

  const tiers = [
    {
      name: 'Free',
      price: 0,
      annualPrice: 0,
      desc: 'Try it on your main channels',
      features: [
        '3 channels',
        '30-day history',
        'Win rate & R:R',
        'Signal feed',
      ],
      missing: ['Entry accuracy', 'MT5 integration'],
      cta: 'Start Free',
      action: () => navigate('/register'),
      featured: false,
    },
    {
      name: 'Pro',
      price: 19,
      annualPrice: 15,
      desc: 'For traders who want the full picture',
      features: [
        '25 channels',
        'Unlimited history',
        'All metrics incl. entry accuracy',
        'MT5 copy integration',
        'Telegram notifications',
        'CSV export',
      ],
      missing: [],
      cta: 'Start Pro Trial',
      action: () => navigate('/register'),
      featured: true,
    },
    {
      name: 'Team',
      price: 79,
      annualPrice: 65,
      desc: 'For prop firms and signal services',
      features: [
        'Unlimited channels',
        'Unlimited history',
        'All Pro features',
        'API access',
        'White-label reports',
        'Priority support',
      ],
      missing: [],
      cta: 'Contact Sales',
      action: () => {},
      featured: false,
    },
  ]

  return (
    <section id="pricing" className="py-28" style={{ background: 'var(--surface)' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <p
            className="font-semibold mb-3"
            style={{ fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.08em' }}
          >
            PRICING
          </p>
          <h2
            className="font-bold text-white mb-3"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-0.02em' }}
          >
            Simple pricing
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
            Start free. Upgrade when you're ready.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <span style={{ fontSize: '14px', color: annual ? 'var(--text-muted)' : 'var(--text)' }}>Monthly</span>
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

        <div className="grid md:grid-cols-3 gap-5">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="rounded-xl border flex flex-col p-7 relative"
              style={{
                background: 'var(--surface)',
                borderColor: tier.featured ? 'var(--accent)' : 'var(--border)',
                boxShadow: tier.featured ? '0 0 40px rgba(0,212,170,0.12)' : 'none',
              }}
            >
              {tier.featured && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full font-semibold"
                  style={{ background: 'var(--accent)', color: '#0a0a0b', fontSize: '11px' }}
                >
                  Most Popular
                </div>
              )}

              <div className="mb-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-white" style={{ fontSize: '17px' }}>{tier.name}</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '12px' }}>{tier.desc}</p>
                <div className="flex items-end gap-1">
                  <span
                    className="font-bold text-white"
                    style={{ fontSize: '34px', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}
                  >
                    {tier.price === 0 ? 'Free' : `£${annual ? tier.annualPrice : tier.price}`}
                  </span>
                  {tier.price > 0 && (
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', paddingBottom: '5px' }}>/mo</span>
                  )}
                </div>
                {annual && tier.price > 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                    billed £{tier.annualPrice * 12}/year
                  </p>
                )}
              </div>

              <ul className="flex flex-col gap-2.5 flex-1 mb-7">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      style={{ color: tier.featured ? 'var(--accent)' : 'var(--win)' }}
                    />
                    <span style={{ fontSize: '14px', color: 'var(--text)' }}>{f}</span>
                  </li>
                ))}
                {tier.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 opacity-40">
                    <div className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <div className="w-3 h-px" style={{ background: 'var(--text-faint)' }} />
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-faint)' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={tier.action}
                className="w-full py-3 rounded-lg font-semibold transition-all hover:opacity-90"
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

// ── Testimonials ──────────────────────────────────────────────────────────────

function Testimonials() {
  const quotes = [
    {
      quote: "I was following 8 channels thinking they were all decent. SignalScope showed 6 of them had sub-40% win rates. Dropped them immediately and my account started growing.",
      name: 'James K.',
      role: 'Retail FX trader, 4 years',
      stars: 5,
    },
    {
      quote: "The R:R tracking is what sold me. I realised my best channel had a 70% win rate but the R:R was 0.4. I was actually losing money following signals that won most of the time.",
      name: 'Sarah M.',
      role: 'Crypto & commodities trader',
      stars: 5,
    },
    {
      quote: "Setup took 5 minutes. Now I have a clean leaderboard of all my channels. The tier system makes it instant to see who's actually delivering.",
      name: 'Tom R.',
      role: 'Part-time futures trader',
      stars: 5,
    },
  ]

  return (
    <section className="py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2
            className="font-bold text-white"
            style={{ fontSize: 'clamp(24px, 3vw, 36px)', letterSpacing: '-0.02em' }}
          >
            Traders who stopped guessing
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {quotes.map((q) => (
            <div
              key={q.name}
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: q.stars }).map((_, i) => (
                  <span key={i} style={{ color: '#f59e0b', fontSize: '14px' }}>★</span>
                ))}
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.75, flex: 1 }}>
                “{q.quote}”
              </p>
              <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold flex-shrink-0"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '13px' }}
                >
                  {q.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-white" style={{ fontSize: '13px' }}>{q.name}</div>
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
    a: 'You connect your Telegram account using the official Telegram API. SignalScope reads messages from the channels you specify — it never posts, never interacts, never modifies anything.',
  },
  {
    q: 'Does it work with private channels?',
    a: "Yes. Any channel accessible through your Telegram account — public, private, or a group you're in — can be monitored.",
  },
  {
    q: 'How accurate is the signal parsing?',
    a: "95%+ of standard signal formats are parsed correctly. Confidence scores on every signal show when a parse is incomplete. You can always view the raw message alongside the parsed result.",
  },
  {
    q: 'Where does the price data come from?',
    a: 'Crypto outcomes use live Binance data. FX, gold, and indices use market data feeds. Optionally connect your MT5 account for broker-accurate pricing.',
  },
  {
    q: 'Can I export my data?',
    a: 'Pro and Team plans get full CSV export. Team plan includes API access for programmatic retrieval of all your signal and outcome data.',
  },
  {
    q: 'Is my Telegram account safe?',
    a: "Yes. We use official Telegram API methods with read-only access. Your API credentials are encrypted at rest. SignalScope never sends messages or interacts with channels on your behalf.",
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-24" style={{ background: 'var(--surface)' }}>
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <p
            className="font-semibold mb-3"
            style={{ fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.08em' }}
          >
            FAQ
          </p>
          <h2 className="font-bold text-white" style={{ fontSize: 'clamp(24px, 3vw, 36px)', letterSpacing: '-0.02em' }}>
            Common questions
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border overflow-hidden transition-colors"
              style={{
                borderColor: open === i ? 'rgba(0,212,170,0.3)' : 'var(--border)',
                background: open === i ? 'var(--surface-2)' : 'var(--bg)',
              }}
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-white pr-4" style={{ fontSize: '15px' }}>
                  {item.q}
                </span>
                <ChevronDown
                  className={clsx(
                    'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                    open === i ? 'rotate-180' : ''
                  )}
                  style={{ color: open === i ? 'var(--accent)' : 'var(--text-faint)' }}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5" style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.75 }}>
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
    <footer className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="#00d4aa" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="7" stroke="#00d4aa" strokeWidth="1" opacity="0.4" />
            <circle cx="16" cy="16" r="2.5" fill="#00d4aa" />
          </svg>
          <div>
            <div className="font-semibold text-white" style={{ fontSize: '14px' }}>SignalScope</div>
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
              className="transition-colors hover:text-white"
              style={{ fontSize: '13px', color: 'var(--text-muted)' }}
            >
              {l}
            </a>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>© 2026 SignalScope</div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Nav />
      <Hero />
      <StatsBar />
      <PainSection />
      <HowItWorks />
      <Features />
      <MidCta />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  )
}
