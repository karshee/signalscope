import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Check, Shield, Search, Bell, Users, Zap, Code2, ArrowRight, ChevronDown } from 'lucide-react'

// ── Light theme design tokens ─────────────────────────────────────────────────

const L = {
  bg:          '#ffffff',
  surface:     '#f8fafc',
  surface2:    '#f1f5f9',
  border:      'rgba(0,0,0,0.08)',
  text:        '#0f172a',
  textMuted:   '#64748b',
  textFaint:   '#94a3b8',
  accent:      '#00c49a',
  accentDim:   'rgba(0,196,154,0.10)',
  accentBorder:'rgba(0,196,154,0.35)',
  win:         '#16a34a',
  loss:        '#dc2626',
  mono:        "'JetBrains Mono', monospace",
  // Terminal dark panel
  term:        '#0d1117',
  termBorder:  'rgba(255,255,255,0.08)',
}

// ── Keyframe styles injected once ─────────────────────────────────────────────

const GLOBAL_STYLES = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseDot {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
  @keyframes termLine {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`

// ── Nav (light) ───────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '60px',
          background: scrolled ? 'rgba(255,255,255,0.92)' : '#ffffff',
          borderBottom: `1px solid ${scrolled ? L.border : 'transparent'}`,
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke={L.accent} strokeWidth="1.5" />
            <circle cx="16" cy="16" r="7" stroke={L.accent} strokeWidth="1" opacity="0.5" />
            <line x1="2" y1="16" x2="8" y2="16" stroke={L.accent} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="24" y1="16" x2="30" y2="16" stroke={L.accent} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="2" x2="16" y2="8" stroke={L.accent} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="24" x2="16" y2="30" stroke={L.accent} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="16" cy="16" r="2.5" fill={L.accent} />
          </svg>
          <span style={{ fontWeight: 600, fontSize: '16px', color: L.text }}>Tapwire</span>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {[
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Use Cases',    href: '#use-cases' },
            { label: 'Pricing',      href: '#pricing' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{ fontSize: '14px', color: L.textMuted, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = L.text)}
              onMouseLeave={e => (e.currentTarget.style.color = L.textMuted)}
            >
              {item.label}
            </a>
          ))}
          <button
            onClick={() => navigate('/login')}
            style={{ fontSize: '14px', color: L.textMuted, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = L.text)}
            onMouseLeave={e => (e.currentTarget.style.color = L.textMuted)}
          >
            Login
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/register')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 18px',
            borderRadius: '8px',
            background: L.accent,
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Get Started <ChevronRight style={{ width: 15, height: 15 }} />
        </button>
      </nav>
    </>
  )
}

// ── Terminal hero widget ───────────────────────────────────────────────────────

function TerminalWidget() {
  const lines = [
    { delay: 0,   content: <><span style={{ color: '#8b949e' }}>$ </span><span style={{ color: '#79c0ff' }}>pip install</span><span style={{ color: '#e6edf3' }}> tapwire</span></> },
    { delay: 200, content: <span style={{ color: '#3fb950' }}>Successfully installed tapwire 0.4.1</span> },
    { delay: 400, content: <span style={{ color: '#8b949e' }}>&nbsp;</span> },
    { delay: 600, content: <><span style={{ color: '#8b949e' }}>$ </span><span style={{ color: '#79c0ff' }}>tapwire watch</span><span style={{ color: '#e6edf3' }}> @cryptonews \</span></> },
    { delay: 700, content: <><span style={{ color: '#8b949e' }}>    </span><span style={{ color: '#ff7b72' }}>--keywords</span><span style={{ color: '#e6edf3' }}> &quot;bitcoin,eth,hack&quot; \</span></> },
    { delay: 800, content: <><span style={{ color: '#8b949e' }}>    </span><span style={{ color: '#ff7b72' }}>--webhook</span><span style={{ color: '#e6edf3' }}> https://your-app.com/hook</span></> },
    { delay: 1000, content: <span style={{ color: '#8b949e' }}>&nbsp;</span> },
    { delay: 1100, content: <><span style={{ color: L.accent }}>Watching @cryptonews...</span><span style={{ color: '#8b949e' }}> (3 extractors active)</span></> },
    { delay: 1300, content: <span style={{ color: '#8b949e' }}>&nbsp;</span> },
    { delay: 1500, content: <><span style={{ color: '#8b949e' }}>[14:22] </span><span style={{ color: '#f0883e' }}>[KEYWORD]</span><span style={{ color: '#3fb950' }}> bitcoin_hit</span><span style={{ color: '#8b949e' }}> (conf: 100%)</span></> },
    { delay: 1600, content: <><span style={{ color: '#8b949e' }}>  keyword: </span><span style={{ color: '#79c0ff' }}>bitcoin</span></> },
    { delay: 1700, content: <><span style={{ color: '#8b949e' }}>  context: &quot;</span><span style={{ color: '#e6edf3' }}>Bitcoin breaks $70k resistance...</span><span style={{ color: '#8b949e' }}>&quot;</span></> },
    { delay: 1900, content: <span style={{ color: '#8b949e' }}>&nbsp;</span> },
    { delay: 2100, content: <><span style={{ color: '#8b949e' }}>[14:23] </span><span style={{ color: '#f0883e' }}>[SENTIMENT]</span><span style={{ color: '#3fb950' }}> bullish</span><span style={{ color: '#8b949e' }}> (conf: 87%)</span></> },
    { delay: 2200, content: <><span style={{ color: '#8b949e' }}>  sentiment: </span><span style={{ color: '#3fb950' }}>bullish</span><span style={{ color: '#8b949e' }}>  bull_score: </span><span style={{ color: '#79c0ff' }}>4</span></> },
    { delay: 2400, content: <span style={{ color: '#8b949e' }}>&nbsp;</span> },
    { delay: 2600, content: <><span style={{ color: '#8b949e' }}>[14:24] </span><span style={{ color: '#f0883e' }}>[SIGNAL]</span><span style={{ color: '#3fb950' }}> trade_market</span><span style={{ color: '#8b949e' }}> (conf: 95%)</span></> },
    { delay: 2700, content: <><span style={{ color: '#8b949e' }}>  pair: </span><span style={{ color: '#79c0ff' }}>XAUUSD</span><span style={{ color: '#8b949e' }}>  direction: </span><span style={{ color: '#3fb950' }}>buy</span></> },
    { delay: 2800, content: <><span style={{ color: '#8b949e' }}>  entry: </span><span style={{ color: '#e6edf3' }}>2341.50</span><span style={{ color: '#8b949e' }}>  sl: </span><span style={{ color: '#f85149' }}>2328.00</span><span style={{ color: '#8b949e' }}>  tp1: </span><span style={{ color: '#3fb950' }}>2355.00</span></> },
  ]

  return (
    <div
      style={{
        background: L.term,
        borderRadius: '12px',
        border: `1px solid ${L.termBorder}`,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        fontFamily: L.mono,
        fontSize: '13px',
        lineHeight: 1.7,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.04)',
          borderBottom: `1px solid ${L.termBorder}`,
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <span style={{ fontSize: '11px', color: '#8b949e' }}>tapwire — zsh</span>
        {/* Live dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#3fb950',
              animation: 'pulseDot 1.5s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: '10px', color: '#3fb950', fontWeight: 600 }}>LIVE</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px' }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              animation: `termLine 300ms ease both`,
              animationDelay: `${line.delay}ms`,
            }}
          >
            {line.content}
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
      style={{
        background: L.bg,
        backgroundImage: 'radial-gradient(ellipse 70% 50% at 60% 0%, rgba(0,196,154,0.06) 0%, transparent 60%)',
        paddingTop: '100px',
        paddingBottom: '80px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '48px',
          alignItems: 'center',
        }}
      >
        {/* Left */}
        <div style={{ animation: 'slideUp 500ms ease both' }}>
          {/* Eyebrow */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: L.accentDim,
              border: `1px solid ${L.accentBorder}`,
              fontSize: '12px',
              fontWeight: 600,
              color: L.accent,
              marginBottom: '24px',
              letterSpacing: '0.03em',
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: L.accent,
                animation: 'pulseDot 1.5s ease-in-out infinite',
              }}
            />
            Telegram Intelligence Platform
          </div>

          <h1
            style={{
              fontSize: 'clamp(38px, 4vw, 56px)',
              fontWeight: 800,
              color: L.text,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              marginBottom: '20px',
            }}
          >
            Watch any Telegram.{' '}
            <span style={{ color: L.accent }}>Extract any signal.</span>
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: L.textMuted,
              lineHeight: 1.65,
              maxWidth: '480px',
              marginBottom: '32px',
            }}
          >
            Monitor any channel or group. Get structured data — trading signals, keyword alerts,
            sentiment scores, entity mentions — delivered in real-time to your app, webhook, or CLI.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '12px 24px',
                borderRadius: '8px',
                background: L.accent,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: `0 4px 20px rgba(0,196,154,0.35)`,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Start Free <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
            <a
              href="#cli-section"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '12px 24px',
                borderRadius: '8px',
                background: 'transparent',
                color: L.textMuted,
                fontWeight: 500,
                fontSize: '15px',
                border: `1px solid ${L.border}`,
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.18)'; e.currentTarget.style.color = L.text }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = L.border; e.currentTarget.style.color = L.textMuted }}
            >
              View docs
            </a>
          </div>

          <p style={{ fontSize: '12px', color: L.textFaint, marginBottom: '24px', fontFamily: L.mono }}>
            Free forever · No credit card · pip install tapwire
          </p>

          {/* Trust marks */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              paddingTop: '20px',
              borderTop: `1px solid ${L.border}`,
            }}
          >
            {[
              { icon: '🔒', text: 'Read-only access' },
              { icon: '📡', text: '35+ pairs' },
              { icon: '⚡', text: 'Real-time' },
              { icon: '🔗', text: 'REST API + Webhooks' },
            ].map((t) => (
              <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>{t.icon}</span>
                <span style={{ fontSize: '12px', color: L.textFaint }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — terminal */}
        <div style={{ animation: 'slideUp 500ms ease 150ms both' }}>
          <TerminalWidget />
        </div>
      </div>
    </section>
  )
}

// ── Use Cases ─────────────────────────────────────────────────────────────────

const USE_CASES = [
  {
    icon: '📈',
    title: 'Trading Signal Tracking',
    desc: 'Parse entry/SL/TP from any signal channel. Track win rates and R:R automatically.',
    lucide: <Zap style={{ width: 18, height: 18 }} />,
  },
  {
    icon: '🔍',
    title: 'Brand & Competitor Monitoring',
    desc: 'Get alerted when your brand, product, or competitors are mentioned in any group.',
    lucide: <Search style={{ width: 18, height: 18 }} />,
  },
  {
    icon: '🔐',
    title: 'OSINT & Threat Intelligence',
    desc: 'Monitor public groups for keywords related to threats, fraud, or specific entities.',
    lucide: <Shield style={{ width: 18, height: 18 }} />,
  },
  {
    icon: '💬',
    title: 'Community Health',
    desc: 'Score engagement, detect bot activity, track sentiment across your own groups.',
    lucide: <Users style={{ width: 18, height: 18 }} />,
  },
  {
    icon: '🚨',
    title: 'Real-time Keyword Alerts',
    desc: 'Receive webhook or Telegram notifications when any keyword appears in any channel.',
    lucide: <Bell style={{ width: 18, height: 18 }} />,
  },
  {
    icon: '🛠️',
    title: 'Developer SDK & API',
    desc: 'Use our Python SDK or REST API to build your own intelligence pipeline.',
    lucide: <Code2 style={{ width: 18, height: 18 }} />,
  },
]

function UseCases() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <section
      id="use-cases"
      style={{ background: L.surface, padding: '96px 0' }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 800,
              color: L.text,
              letterSpacing: '-0.025em',
              marginBottom: '12px',
            }}
          >
            Built for everyone watching Telegram
          </h2>
          <p style={{ fontSize: '16px', color: L.textMuted }}>One platform. Many intelligence needs.</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {USE_CASES.map((uc, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                background: L.bg,
                border: `1px solid ${hoveredIdx === i ? L.accentBorder : L.border}`,
                borderRadius: '12px',
                padding: '24px',
                cursor: 'default',
                transition: 'all 0.2s ease',
                boxShadow: hoveredIdx === i ? '0 8px 32px rgba(0,196,154,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                transform: hoveredIdx === i ? 'translateY(-2px)' : 'translateY(0)',
              }}
            >
              <div
                style={{
                  width: 40, height: 40,
                  borderRadius: '10px',
                  background: L.accentDim,
                  border: `1px solid ${L.accentBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: L.accent,
                  marginBottom: '16px',
                }}
              >
                {uc.lucide}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: L.text, marginBottom: '8px' }}>{uc.title}</h3>
              <p style={{ fontSize: '13px', color: L.textMuted, lineHeight: 1.65 }}>{uc.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Connect your Telegram',
      desc: 'Add your Telegram API credentials. Read-only access — Tapwire never posts, never interacts, never touches your messages.',
      detail: 'Takes about 2 minutes',
    },
    {
      n: '02',
      title: 'Configure extractors',
      desc: 'Choose what to extract: trading signals, keywords, sentiment scores, entity mentions — or enable all extractors at once.',
      detail: 'Mix and match per channel',
    },
    {
      n: '03',
      title: 'Receive structured data',
      desc: 'Results flow to your dashboard, JSON API, webhooks, or CLI output — however your workflow needs it.',
      detail: 'Updated in real-time',
    },
  ]

  return (
    <section id="how-it-works" style={{ background: L.bg, padding: '96px 0' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '56px' }}>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: L.accent,
              letterSpacing: '0.08em',
              marginBottom: '10px',
            }}
          >
            HOW IT WORKS
          </p>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 800,
              color: L.text,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
            }}
          >
            Up and running in minutes.
          </h2>
        </div>

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0',
            position: 'relative',
          }}
        >
          {/* Connector line */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '40px',
              right: '40px',
              height: '1px',
              background: `linear-gradient(to right, transparent, ${L.border} 10%, ${L.border} 90%, transparent)`,
            }}
          />

          {steps.map((step, i) => (
            <div key={i} style={{ paddingRight: '40px', position: 'relative' }}>
              {/* Circle */}
              <div
                style={{
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: L.bg,
                  border: `2px solid ${L.accent}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: L.mono,
                  fontWeight: 700,
                  fontSize: '13px',
                  color: L.accent,
                  marginBottom: '20px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {step.n}
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 700, color: L.text, marginBottom: '8px' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '14px', color: L.textMuted, lineHeight: 1.65, marginBottom: '10px' }}>
                {step.desc}
              </p>
              <span style={{ fontSize: '11px', color: L.accent, fontFamily: L.mono, fontWeight: 600 }}>
                → {step.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CLI / SDK Section ─────────────────────────────────────────────────────────

const CLI_TABS = ['CLI', 'Python SDK', 'REST API'] as const
type CliTab = typeof CLI_TABS[number]

const CLI_CONTENT: Record<CliTab, JSX.Element> = {
  CLI: (
    <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}>
      <span style={{ color: '#8b949e' }}># Install{'\n'}</span>
      <span style={{ color: '#79c0ff' }}>pip install</span>
      <span style={{ color: '#e6edf3' }}> tapwire{'\n\n'}</span>

      <span style={{ color: '#8b949e' }}># Watch for trading signals{'\n'}</span>
      <span style={{ color: '#79c0ff' }}>tapwire watch</span>
      <span style={{ color: '#e6edf3' }}> @forexalpha</span>
      <span style={{ color: '#ff7b72' }}> --extract</span>
      <span style={{ color: '#a5d6ff' }}> signals</span>
      <span style={{ color: '#ff7b72' }}> --output</span>
      <span style={{ color: '#a5d6ff' }}> json{'\n\n'}</span>

      <span style={{ color: '#8b949e' }}># Watch for keywords with webhook delivery{'\n'}</span>
      <span style={{ color: '#79c0ff' }}>tapwire watch</span>
      <span style={{ color: '#e6edf3' }}> @cryptonews</span>
      <span style={{ color: '#ff7b72' }}> --keywords</span>
      <span style={{ color: '#a5d6ff' }}> &quot;bitcoin,eth&quot;</span>
      <span style={{ color: '#ff7b72' }}> --webhook</span>
      <span style={{ color: '#a5d6ff' }}> https://hooks.slack.com/...{'\n\n'}</span>

      <span style={{ color: '#8b949e' }}># Export history as CSV{'\n'}</span>
      <span style={{ color: '#79c0ff' }}>tapwire export</span>
      <span style={{ color: '#ff7b72' }}> --channel</span>
      <span style={{ color: '#e6edf3' }}> @forexalpha</span>
      <span style={{ color: '#ff7b72' }}> --since</span>
      <span style={{ color: '#a5d6ff' }}> 30d</span>
      <span style={{ color: '#ff7b72' }}> --format</span>
      <span style={{ color: '#a5d6ff' }}> csv</span>
    </pre>
  ),

  'Python SDK': (
    <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}>
      <span style={{ color: '#ff7b72' }}>from</span>
      <span style={{ color: '#e6edf3' }}> tapwire </span>
      <span style={{ color: '#ff7b72' }}>import</span>
      <span style={{ color: '#79c0ff' }}> Watcher</span>
      <span style={{ color: '#e6edf3' }}>, </span>
      <span style={{ color: '#79c0ff' }}>ExtractorRegistry{'\n'}</span>
      <span style={{ color: '#ff7b72' }}>from</span>
      <span style={{ color: '#e6edf3' }}> tapwire.extractors </span>
      <span style={{ color: '#ff7b72' }}>import</span>
      <span style={{ color: '#79c0ff' }}> SignalExtractor</span>
      <span style={{ color: '#e6edf3' }}>, </span>
      <span style={{ color: '#79c0ff' }}>KeywordExtractor{'\n\n'}</span>

      <span style={{ color: '#ff7b72' }}>async def</span>
      <span style={{ color: '#d2a8ff' }}> main</span>
      <span style={{ color: '#e6edf3' }}>():{'\n'}</span>
      <span style={{ color: '#e6edf3' }}>    watcher </span>
      <span style={{ color: '#ff7b72' }}>=</span>
      <span style={{ color: '#79c0ff' }}> Watcher</span>
      <span style={{ color: '#e6edf3' }}>.</span>
      <span style={{ color: '#d2a8ff' }}>from_env</span>
      <span style={{ color: '#e6edf3' }}>(){'\n'}</span>
      <span style={{ color: '#e6edf3' }}>    registry </span>
      <span style={{ color: '#ff7b72' }}>=</span>
      <span style={{ color: '#79c0ff' }}> ExtractorRegistry</span>
      <span style={{ color: '#e6edf3' }}>(){'\n'}</span>
      <span style={{ color: '#e6edf3' }}>    registry.</span>
      <span style={{ color: '#d2a8ff' }}>register</span>
      <span style={{ color: '#e6edf3' }}>(</span>
      <span style={{ color: '#79c0ff' }}>SignalExtractor</span>
      <span style={{ color: '#e6edf3' }}>())</span>
      <span style={{ color: '#8b949e' }}>{'\n'}</span>
      <span style={{ color: '#e6edf3' }}>    registry.</span>
      <span style={{ color: '#d2a8ff' }}>register</span>
      <span style={{ color: '#e6edf3' }}>(</span>
      <span style={{ color: '#79c0ff' }}>KeywordExtractor</span>
      <span style={{ color: '#e6edf3' }}>(</span>
      <span style={{ color: '#a5d6ff' }}>[&quot;bitcoin&quot;, &quot;hack&quot;, &quot;launch&quot;]</span>
      <span style={{ color: '#e6edf3' }}>)){'\n\n'}</span>
      <span style={{ color: '#ff7b72' }}>    async for</span>
      <span style={{ color: '#e6edf3' }}> event </span>
      <span style={{ color: '#ff7b72' }}>in</span>
      <span style={{ color: '#e6edf3' }}> watcher.</span>
      <span style={{ color: '#d2a8ff' }}>stream</span>
      <span style={{ color: '#e6edf3' }}>(</span>
      <span style={{ color: '#a5d6ff' }}>&quot;@cryptonews&quot;</span>
      <span style={{ color: '#e6edf3' }}>):{'\n'}</span>
      <span style={{ color: '#e6edf3' }}>        events </span>
      <span style={{ color: '#ff7b72' }}>=</span>
      <span style={{ color: '#e6edf3' }}> registry.</span>
      <span style={{ color: '#d2a8ff' }}>process</span>
      <span style={{ color: '#e6edf3' }}>(event.text){'\n'}</span>
      <span style={{ color: '#ff7b72' }}>        for</span>
      <span style={{ color: '#e6edf3' }}> ev </span>
      <span style={{ color: '#ff7b72' }}>in</span>
      <span style={{ color: '#e6edf3' }}> events:{'\n'}</span>
      <span style={{ color: '#e6edf3' }}>            </span>
      <span style={{ color: '#79c0ff' }}>print</span>
      <span style={{ color: '#e6edf3' }}>(ev.event_type, ev.data)</span>
    </pre>
  ),

  'REST API': (
    <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}>
      <span style={{ color: '#8b949e' }}># List channels{'\n'}</span>
      <span style={{ color: '#3fb950' }}>GET</span>
      <span style={{ color: '#e6edf3' }}> /api/channels{'\n\n'}</span>

      <span style={{ color: '#8b949e' }}># Get signal feed{'\n'}</span>
      <span style={{ color: '#3fb950' }}>GET</span>
      <span style={{ color: '#e6edf3' }}> /api/signals</span>
      <span style={{ color: '#ff7b72' }}>?channel_id</span>
      <span style={{ color: '#e6edf3' }}>=xxx</span>
      <span style={{ color: '#ff7b72' }}>&amp;limit</span>
      <span style={{ color: '#e6edf3' }}>=50{'\n\n'}</span>

      <span style={{ color: '#8b949e' }}># Get leaderboard{'\n'}</span>
      <span style={{ color: '#3fb950' }}>GET</span>
      <span style={{ color: '#e6edf3' }}> /api/scores/leaderboard</span>
      <span style={{ color: '#ff7b72' }}>?window</span>
      <span style={{ color: '#e6edf3' }}>=30d</span>
      <span style={{ color: '#ff7b72' }}>&amp;min_signals</span>
      <span style={{ color: '#e6edf3' }}>=5{'\n\n'}</span>

      <span style={{ color: '#8b949e' }}># WebSocket live feed{'\n'}</span>
      <span style={{ color: '#f0883e' }}>WS</span>
      <span style={{ color: '#e6edf3' }}> /ws/feed</span>
      <span style={{ color: '#ff7b72' }}>?token</span>
      <span style={{ color: '#e6edf3' }}>=&lt;jwt&gt;</span>
    </pre>
  ),
}

function CliSection() {
  const [activeTab, setActiveTab] = useState<CliTab>('CLI')

  return (
    <section
      id="cli-section"
      style={{ background: L.term, padding: '96px 0' }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.6fr',
            gap: '64px',
            alignItems: 'start',
          }}
        >
          {/* Left text */}
          <div>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: L.accent,
                letterSpacing: '0.08em',
                marginBottom: '12px',
              }}
            >
              DEVELOPER-FIRST
            </p>
            <h2
              style={{
                fontSize: 'clamp(26px, 3vw, 36px)',
                fontWeight: 800,
                color: '#e6edf3',
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                marginBottom: '16px',
              }}
            >
              Developer-first from day one
            </h2>
            <p style={{ fontSize: '15px', color: '#8b949e', lineHeight: 1.7, marginBottom: '28px' }}>
              A clean Python SDK, REST API, and CLI. Pipe Telegram data anywhere. Build your own
              intelligence pipeline in minutes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'pip install tapwire',
                'Webhook delivery',
                'Full JSON / CSV export',
                'WebSocket live feed',
              ].map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Check style={{ width: 14, height: 14, color: L.accent, flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: '#8b949e', fontFamily: L.mono }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right code block */}
          <div>
            {/* Tab bar */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '0',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '10px 10px 0 0',
                border: `1px solid ${L.termBorder}`,
                borderBottom: 'none',
                padding: '6px 6px 0',
              }}
            >
              {CLI_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px 6px 0 0',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: L.mono,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: activeTab === tab ? L.term : 'transparent',
                    color: activeTab === tab ? '#e6edf3' : '#8b949e',
                    borderBottom: activeTab === tab ? `2px solid ${L.accent}` : '2px solid transparent',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Code area */}
            <div
              style={{
                background: L.term,
                border: `1px solid ${L.termBorder}`,
                borderRadius: '0 0 10px 10px',
                padding: '20px 22px',
                fontFamily: L.mono,
                fontSize: '13px',
                lineHeight: 1.7,
                overflowX: 'auto',
                minHeight: '240px',
              }}
            >
              {CLI_CONTENT[activeTab]}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Pricing ───────────────────────────────────────────────────────────────────

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
      missing: ['Entry accuracy', 'MT5 integration', 'CSV export'],
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
    <section id="pricing" style={{ background: L.surface, padding: '96px 0' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: L.accent, letterSpacing: '0.08em', marginBottom: '10px' }}>
            PRICING
          </p>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 800,
              color: L.text,
              letterSpacing: '-0.025em',
              marginBottom: '12px',
            }}
          >
            Simple pricing
          </h2>
          <p style={{ fontSize: '16px', color: L.textMuted, marginBottom: '24px' }}>
            Start free. Upgrade when you're ready.
          </p>

          {/* Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: annual ? L.textFaint : L.text }}>Monthly</span>
            <button
              onClick={() => setAnnual((a) => !a)}
              style={{
                position: 'relative',
                width: '44px', height: '24px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: annual ? L.accent : L.surface2,
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: annual ? '24px' : '4px',
                  width: '16px', height: '16px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }}
              />
            </button>
            <span style={{ fontSize: '14px', color: annual ? L.text : L.textFaint }}>
              Annual{' '}
              <span
                style={{
                  display: 'inline-flex',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(22,163,74,0.1)',
                  color: L.win,
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                2 months free
              </span>
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {tiers.map((tier) => (
            <div
              key={tier.name}
              style={{
                background: L.bg,
                border: `1px solid ${tier.featured ? L.accent : L.border}`,
                borderRadius: '16px',
                padding: '28px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: tier.featured ? `0 0 40px rgba(0,196,154,0.12)` : '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {tier.featured && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '3px 12px',
                    borderRadius: '999px',
                    background: L.accent,
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Most Popular
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: L.text, marginBottom: '4px' }}>{tier.name}</h3>
                <p style={{ fontSize: '13px', color: L.textFaint, marginBottom: '14px' }}>{tier.desc}</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '34px',
                      fontWeight: 800,
                      color: L.text,
                      fontFamily: L.mono,
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {tier.price === 0 ? 'Free' : `£${annual ? tier.annualPrice : tier.price}`}
                  </span>
                  {tier.price > 0 && (
                    <span style={{ fontSize: '14px', color: L.textMuted, paddingBottom: '4px' }}>/mo</span>
                  )}
                </div>
                {annual && tier.price > 0 && (
                  <p style={{ fontSize: '12px', color: L.textFaint, marginTop: '4px', fontFamily: L.mono }}>
                    billed £{tier.annualPrice * 12}/year
                  </p>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <Check
                      style={{
                        width: 14, height: 14, flexShrink: 0, marginTop: '2px',
                        color: tier.featured ? L.accent : L.win,
                      }}
                    />
                    <span style={{ fontSize: '14px', color: L.text }}>{f}</span>
                  </li>
                ))}
                {tier.missing.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', opacity: 0.35 }}>
                    <div style={{ width: 14, height: 14, flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 10, height: '1px', background: L.textFaint }} />
                    </div>
                    <span style={{ fontSize: '14px', color: L.textFaint }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={tier.action}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: tier.featured ? 'none' : `1px solid ${L.border}`,
                  background: tier.featured ? L.accent : L.surface,
                  color: tier.featured ? '#ffffff' : L.text,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
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
      quote: 'I was following 8 channels thinking they were all decent. Tapwire showed 6 of them had sub-40% win rates. Dropped them immediately.',
      name: 'James K.',
      role: 'Retail FX trader, 4 years',
      stars: 5,
    },
    {
      quote: 'The R:R tracking is what sold me. I realised my best channel had a 70% win rate but R:R of 0.4. I was actually losing money following signals that won most of the time.',
      name: 'Sarah M.',
      role: 'Crypto & commodities trader',
      stars: 5,
    },
    {
      quote: 'Setup took 5 minutes. Now I have a clean leaderboard of all my channels. The tier system makes it instant to see who is actually delivering.',
      name: 'Tom R.',
      role: 'Part-time futures trader',
      stars: 5,
    },
  ]

  return (
    <section style={{ background: L.bg, padding: '88px 0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 800,
              color: L.text,
              letterSpacing: '-0.025em',
            }}
          >
            Traders who stopped guessing
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {quotes.map((q) => (
            <div
              key={q.name}
              style={{
                background: L.surface,
                border: `1px solid ${L.border}`,
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: q.stars }).map((_, i) => (
                  <span key={i} style={{ color: '#f59e0b', fontSize: '14px' }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: '14px', color: L.textMuted, lineHeight: 1.75, flex: 1 }}>
                "{q.quote}"
              </p>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  paddingTop: '14px',
                  borderTop: `1px solid ${L.border}`,
                }}
              >
                <div
                  style={{
                    width: 32, height: 32,
                    borderRadius: '50%',
                    background: L.accentDim,
                    border: `1px solid ${L.accentBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: L.accent,
                    fontSize: '13px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {q.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: L.text }}>{q.name}</div>
                  <div style={{ fontSize: '12px', color: L.textFaint }}>{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCta() {
  const navigate = useNavigate()

  return (
    <section
      style={{
        background: `linear-gradient(135deg, #00b890 0%, #00c49a 40%, #00d4aa 100%)`,
        padding: '96px 24px',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.025em',
          marginBottom: '14px',
        }}
      >
        Start monitoring in 5 minutes
      </h2>
      <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginBottom: '36px' }}>
        Free plan. No card. Works with any Telegram channel.
      </p>
      <button
        onClick={() => navigate('/register')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 32px',
          borderRadius: '10px',
          background: '#ffffff',
          color: L.text,
          fontWeight: 700,
          fontSize: '15px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.18)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)' }}
      >
        Start Free <ArrowRight style={{ width: 16, height: 16 }} />
      </button>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      style={{
        background: L.surface,
        borderTop: `1px solid ${L.border}`,
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '40px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        {/* Logo + tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke={L.accent} strokeWidth="1.5" />
            <circle cx="16" cy="16" r="7" stroke={L.accent} strokeWidth="1" opacity="0.4" />
            <circle cx="16" cy="16" r="2.5" fill={L.accent} />
          </svg>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: L.text }}>Tapwire</div>
            <div style={{ fontSize: '11px', color: L.textFaint }}>Telegram intelligence platform</div>
          </div>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          {['Privacy', 'Terms', 'Contact', 'Docs'].map((l) => (
            <a
              key={l}
              href="#"
              style={{ fontSize: '13px', color: L.textMuted, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = L.text)}
              onMouseLeave={e => (e.currentTarget.style.color = L.textMuted)}
            >
              {l}
            </a>
          ))}
        </div>

        <div style={{ fontSize: '12px', color: L.textFaint }}>© 2026 Tapwire</div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div style={{ background: L.bg, color: L.text, overflowX: 'hidden' }}>
      <Nav />
      <Hero />
      <UseCases />
      <HowItWorks />
      <CliSection />
      <Pricing />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  )
}
