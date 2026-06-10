import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, Check, Zap, ArrowRight, ChevronDown,
  MessageSquare, Workflow, TrendingUp, Clapperboard, Webhook, ShieldCheck,
  Link2, Play,
} from 'lucide-react'

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
  @keyframes flowDash {
    to { stroke-dashoffset: -16; }
  }
  .tw-hiw-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    position: relative;
  }
  .tw-hiw-hline { display: block; }
  .tw-hiw-vconnector { display: none; }
  @media (max-width: 760px) {
    .tw-hiw-grid { grid-template-columns: 1fr; gap: 0; }
    .tw-hiw-hline { display: none; }
    .tw-hiw-vconnector {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 0;
      margin-left: 20px;
    }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          {[
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Features',     href: '#features' },
            { label: 'Use cases',    href: '#use-cases' },
            { label: 'Pricing',      href: '#pricing' },
            { label: 'FAQ',          href: '#faq' },
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
          Get started <ChevronRight style={{ width: 15, height: 15 }} />
        </button>
      </nav>
    </>
  )
}

// ── Rule canvas mock (hero visual) ────────────────────────────────────────────

function NodeCard({
  symbol, symbolBg, symbolColor, kind, title, children, delay,
}: {
  symbol: string
  symbolBg: string
  symbolColor: string
  kind: string
  title: string
  children?: React.ReactNode
  delay: number
}) {
  return (
    <div
      style={{
        background: L.bg,
        border: `1px solid ${L.border}`,
        borderRadius: '10px',
        padding: '12px 14px',
        boxShadow: '0 4px 16px rgba(15,23,42,0.07)',
        width: '100%',
        animation: 'slideUp 400ms ease both',
        animationDelay: `${delay}ms`,
        position: 'relative',
      }}
    >
      {/* connection ports */}
      <div style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: L.bg, border: `2px solid ${L.accent}` }} />
      <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: L.bg, border: `2px solid ${L.accent}` }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: children ? '8px' : 0 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: '7px', flexShrink: 0,
            background: symbolBg, color: symbolColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px',
          }}
        >
          {symbol}
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: L.textFaint }}>{kind}</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: L.text }}>{title}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function NodeConnector({ delay }: { delay: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', animation: 'slideUp 400ms ease both', animationDelay: `${delay}ms` }}>
      <svg width="12" height="26" viewBox="0 0 12 26" fill="none">
        <line
          x1="6" y1="0" x2="6" y2="18"
          stroke={L.accent} strokeWidth="2"
          strokeDasharray="4 4"
          style={{ animation: 'flowDash 1.2s linear infinite' }}
        />
        <path d="M1.5 18.5 L6 24 L10.5 18.5" stroke={L.accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function RuleCanvas() {
  return (
    <div
      style={{
        background: L.bg,
        borderRadius: '14px',
        border: `1px solid ${L.border}`,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(15,23,42,0.16)',
      }}
    >
      {/* Window title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: L.surface,
          borderBottom: `1px solid ${L.border}`,
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <span style={{ fontSize: '11px', color: L.textMuted, fontFamily: L.mono }}>tapwire — rule builder</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: L.accent,
              animation: 'pulseDot 1.5s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: '10px', color: L.accent, fontWeight: 700 }}>ACTIVE</span>
        </div>
      </div>

      {/* Canvas with dot grid */}
      <div
        style={{
          padding: '24px 28px',
          background: L.surface,
          backgroundImage: 'radial-gradient(rgba(15,23,42,0.08) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <NodeCard
          symbol="⚡"
          symbolBg={L.accentDim}
          symbolColor={L.accent}
          kind="TRIGGER"
          title="TP hit on XAUUSD"
          delay={200}
        >
          <div style={{ fontSize: '11px', color: L.textMuted, fontFamily: L.mono }}>
            watching <span style={{ color: L.accent }}>@GoldSignalsVIP</span> · live prices
          </div>
        </NodeCard>

        <NodeConnector delay={350} />

        <NodeCard
          symbol="◆"
          symbolBg="rgba(245,158,11,0.12)"
          symbolColor="#d97706"
          kind="CONDITION"
          title="tp_level ≥ 2"
          delay={450}
        >
          <div style={{ fontSize: '11px', color: L.textMuted, fontFamily: L.mono }}>
            only announce the big targets
          </div>
        </NodeCard>

        <NodeConnector delay={600} />

        <NodeCard
          symbol="▶"
          symbolBg="rgba(59,130,246,0.12)"
          symbolColor="#2563eb"
          kind="ACTION"
          title="Post to @VIPSignals"
          delay={700}
        >
          <div
            style={{
              background: L.surface2,
              border: `1px solid ${L.border}`,
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '12px',
              color: L.text,
              marginBottom: '8px',
            }}
          >
            🎯 XAUUSD TP2 HIT! +150 pips 🚀
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: L.accentDim,
              border: `1px solid ${L.accentBorder}`,
              fontSize: '11px',
              color: L.accent,
              fontWeight: 600,
              fontFamily: L.mono,
            }}
          >
            🎬 celebration.gif
          </div>
        </NodeCard>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
            Telegram Channel Automation
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
            Put your Telegram channels{' '}
            <span style={{ color: L.accent }}>on autopilot.</span>
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
            One workspace for all your channels, plus a visual if-this-then-that builder.
            Traders, marketers, and community managers use Tapwire to post the right
            message — text or GIFs — at exactly the right moment. No code.
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
              Get started free <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
            <a
              href="#how-it-works"
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
              See how it works
            </a>
          </div>

          <p style={{ fontSize: '12px', color: L.textFaint, marginBottom: '24px', fontFamily: L.mono }}>
            Free plan · No credit card · First rule live in minutes
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
              { icon: '🤖', text: 'Your own bot, your control' },
              { icon: '🧩', text: 'Visual rule builder' },
              { icon: '📈', text: 'TP/SL detection' },
              { icon: '🔗', text: 'Webhook triggers' },
            ].map((t) => (
              <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>{t.icon}</span>
                <span style={{ fontSize: '12px', color: L.textFaint }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — rule canvas mock */}
        <div style={{ animation: 'slideUp 500ms ease 150ms both' }}>
          <RuleCanvas />
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
      icon: <Link2 style={{ width: 18, height: 18 }} />,
      title: 'Connect your channels',
      desc: 'Add the channels you manage and paste a bot token from BotFather. That’s the whole setup.',
      detail: 'About 2 minutes',
    },
    {
      n: '02',
      icon: <Workflow style={{ width: 18, height: 18 }} />,
      title: 'Build rules visually',
      desc: 'Drag trigger, condition, and action blocks onto a canvas. “If this happens, post that.” No code.',
      detail: 'First rule in minutes',
    },
    {
      n: '03',
      icon: <Zap style={{ width: 18, height: 18 }} />,
      title: 'Tapwire runs 24/7',
      desc: 'Messages, GIFs, and announcements post themselves — while you trade, sleep, or do anything else.',
      detail: 'Always on',
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
            From sign-up to your first automation in minutes.
          </h2>
        </div>

        {/* Steps */}
        <div className="tw-hiw-grid">
          {/* Connector line (desktop) */}
          <div
            className="tw-hiw-hline"
            style={{
              position: 'absolute',
              top: '20px',
              left: '60px',
              right: '60px',
              height: '2px',
              background: `linear-gradient(to right, transparent, ${L.accentBorder} 10%, ${L.accentBorder} 90%, transparent)`,
            }}
          />

          {steps.map((step, i) => (
            <div key={i}>
              <div style={{ position: 'relative' }}>
                {/* Number badge */}
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

                <div
                  style={{
                    width: 36, height: 36,
                    borderRadius: '9px',
                    background: L.accentDim,
                    border: `1px solid ${L.accentBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: L.accent,
                    marginBottom: '14px',
                  }}
                >
                  {step.icon}
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 700, color: L.text, marginBottom: '8px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '14px', color: L.textMuted, lineHeight: 1.65, marginBottom: '10px', maxWidth: '280px' }}>
                  {step.desc}
                </p>
                <span style={{ fontSize: '11px', color: L.accent, fontFamily: L.mono, fontWeight: 600 }}>
                  → {step.detail}
                </span>
              </div>

              {/* Vertical connector (mobile only) */}
              {i < steps.length - 1 && (
                <div className="tw-hiw-vconnector">
                  <svg width="12" height="34" viewBox="0 0 12 34" fill="none">
                    <line x1="6" y1="0" x2="6" y2="26" stroke={L.accentBorder} strokeWidth="2" strokeDasharray="4 4" />
                    <path d="M1.5 26.5 L6 32 L10.5 26.5" stroke={L.accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'Chat workspace',
    desc: 'All your channels in one clean inbox. Click a saved template to post text or GIFs — instantly, without switching apps.',
    lucide: <MessageSquare style={{ width: 18, height: 18 }} />,
  },
  {
    title: 'Visual rule builder',
    desc: 'Drag Trigger → Condition → Action blocks onto a canvas. If this happens, post that. No code, no YAML, no scripts.',
    lucide: <Workflow style={{ width: 18, height: 18 }} />,
  },
  {
    title: 'Trading triggers',
    desc: 'Tapwire parses signals in your channels and tracks TP/SL against live prices. The moment a target hits, your rule fires.',
    lucide: <TrendingUp style={{ width: 18, height: 18 }} />,
  },
  {
    title: 'Saved templates & GIFs',
    desc: 'Reusable templates with variables like {pair}, {tp_level}, and {pips}. Attach media once, post it everywhere.',
    lucide: <Clapperboard style={{ width: 18, height: 18 }} />,
  },
  {
    title: 'Webhooks & integrations',
    desc: 'Any external system can fire your automations with one HTTP call. Trading bots, CRMs, cron jobs — if it can curl, it can post.',
    lucide: <Webhook style={{ width: 18, height: 18 }} />,
  },
  {
    title: 'Loop-safe engine',
    desc: 'Rate limits, self-send protection, and a full execution log. Your rules can’t spam your channels or trigger each other forever.',
    lucide: <ShieldCheck style={{ width: 18, height: 18 }} />,
  },
]

function Features() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <section
      id="features"
      style={{ background: L.surface, padding: '96px 0' }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: L.accent, letterSpacing: '0.08em', marginBottom: '10px' }}>
            FEATURES
          </p>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 800,
              color: L.text,
              letterSpacing: '-0.025em',
              marginBottom: '12px',
            }}
          >
            Everything channel work needs. Nothing it doesn&apos;t.
          </h2>
          <p style={{ fontSize: '16px', color: L.textMuted }}>Post by hand from one inbox, or let rules do it for you.</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {FEATURES.map((f, i) => (
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
                {f.lucide}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: L.text, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: L.textMuted, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Live example strip (dark panel) ───────────────────────────────────────────

function LiveExample() {
  const lines = [
    { delay: 0,    content: <><span style={{ color: '#8b949e' }}>[09:30:14] </span><span style={{ color: '#79c0ff' }}>@GoldSignalsVIP</span><span style={{ color: '#8b949e' }}> → incoming message</span></> },
    { delay: 150,  content: <><span style={{ color: '#8b949e' }}>  &quot;</span><span style={{ color: '#e6edf3' }}>XAUUSD BUY 2341.50 | TP1 2348.00 TP2 2355.00 | SL 2330.00</span><span style={{ color: '#8b949e' }}>&quot;</span></> },
    { delay: 350,  content: <><span style={{ color: '#8b949e' }}>[09:30:14] </span><span style={{ color: '#f0883e' }}>[PARSE]</span><span style={{ color: '#3fb950' }}> signal detected</span><span style={{ color: '#8b949e' }}> — pair: </span><span style={{ color: '#79c0ff' }}>XAUUSD</span><span style={{ color: '#8b949e' }}>, tracking TP/SL vs live price</span></> },
    { delay: 550,  content: <span style={{ color: '#8b949e' }}>&nbsp;</span> },
    { delay: 750,  content: <><span style={{ color: '#8b949e' }}>[11:02:41] </span><span style={{ color: '#f0883e' }}>[PRICE]</span><span style={{ color: '#e6edf3' }}> XAUUSD 2355.10 ≥ TP2 2355.00</span></> },
    { delay: 950,  content: <><span style={{ color: '#8b949e' }}>[11:02:41] </span><span style={{ color: '#f0883e' }}>[TRIGGER]</span><span style={{ color: '#3fb950' }}> tp_hit</span><span style={{ color: '#8b949e' }}> — tp_level: </span><span style={{ color: '#79c0ff' }}>2</span><span style={{ color: '#8b949e' }}>, pips: </span><span style={{ color: '#3fb950' }}>+150</span></> },
    { delay: 1150, content: <><span style={{ color: '#8b949e' }}>[11:02:41] </span><span style={{ color: '#f0883e' }}>[CONDITION]</span><span style={{ color: '#e6edf3' }}> tp_level ≥ 2 </span><span style={{ color: '#3fb950' }}>✓ pass</span></> },
    { delay: 1350, content: <span style={{ color: '#8b949e' }}>&nbsp;</span> },
    { delay: 1550, content: <><span style={{ color: '#8b949e' }}>[11:02:42] </span><span style={{ color: '#f0883e' }}>[ACTION]</span><span style={{ color: '#3fb950' }}> posted</span><span style={{ color: '#8b949e' }}> → </span><span style={{ color: '#79c0ff' }}>@VIPSignals</span></> },
    { delay: 1700, content: <><span style={{ color: '#8b949e' }}>  &quot;</span><span style={{ color: '#e6edf3' }}>🎯 XAUUSD TP2 HIT! +150 pips 🚀</span><span style={{ color: '#8b949e' }}>&quot; + </span><span style={{ color: L.accent }}>[celebration.gif]</span></> },
  ]

  return (
    <section style={{ background: L.term, padding: '96px 0' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: L.accent, letterSpacing: '0.08em', marginBottom: '12px' }}>
            LIVE EXAMPLE
          </p>
          <h2
            style={{
              fontSize: 'clamp(26px, 3vw, 36px)',
              fontWeight: 800,
              color: '#e6edf3',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          >
            A signal comes in. Tapwire takes it from there.
          </h2>
        </div>

        <div
          style={{
            background: L.term,
            borderRadius: '12px',
            border: `1px solid ${L.termBorder}`,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
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
            <span style={{ fontSize: '11px', color: '#8b949e' }}>tapwire — execution log</span>
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

          {/* Log lines */}
          <div style={{ padding: '16px 18px', overflowX: 'auto' }}>
            {lines.map((line, i) => (
              <div
                key={i}
                style={{
                  animation: `termLine 300ms ease both`,
                  animationDelay: `${line.delay}ms`,
                  whiteSpace: 'nowrap',
                }}
              >
                {line.content}
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#8b949e', marginTop: '24px' }}>
          Set it up once. Tapwire announces every win, instantly.
        </p>
      </div>
    </section>
  )
}

// ── Use Cases ─────────────────────────────────────────────────────────────────

const USE_CASES = [
  {
    icon: <TrendingUp style={{ width: 18, height: 18 }} />,
    title: 'Signal providers & traders',
    points: [
      'Auto-announce TP hits with celebration GIFs',
      'Relay signals between free and VIP channels',
      'Scheduled market-open and recap posts',
    ],
  },
  {
    icon: <Play style={{ width: 18, height: 18 }} />,
    title: 'Marketers',
    points: [
      'Scheduled campaigns across every channel at once',
      'Keyword-triggered replies in your groups',
      'Consistent templates — same voice, every post',
    ],
  },
  {
    icon: <MessageSquare style={{ width: 18, height: 18 }} />,
    title: 'Community managers',
    points: [
      'Welcome and info posts on a schedule',
      'FAQ auto-answers for repeat questions',
      'Cross-post announcements to every community',
    ],
  },
]

function UseCases() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <section id="use-cases" style={{ background: L.bg, padding: '96px 0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: L.accent, letterSpacing: '0.08em', marginBottom: '10px' }}>
            USE CASES
          </p>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 800,
              color: L.text,
              letterSpacing: '-0.025em',
              marginBottom: '12px',
            }}
          >
            Built for the people who run channels
          </h2>
          <p style={{ fontSize: '16px', color: L.textMuted }}>Same builder. Three very different jobs done.</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {USE_CASES.map((uc, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                background: L.surface,
                border: `1px solid ${hoveredIdx === i ? L.accentBorder : L.border}`,
                borderRadius: '12px',
                padding: '28px',
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
                {uc.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: L.text, marginBottom: '14px' }}>{uc.title}</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {uc.points.map((p) => (
                  <li key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <Check style={{ width: 14, height: 14, flexShrink: 0, marginTop: '3px', color: L.accent }} />
                    <span style={{ fontSize: '13px', color: L.textMuted, lineHeight: 1.6 }}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function Pricing() {
  const navigate = useNavigate()

  const tiers = [
    {
      name: 'Free',
      price: 'Free',
      badge: null as string | null,
      desc: 'Run your first automations today',
      features: [
        '3 channels',
        '5 automations',
        'Chat workspace & templates',
        'Trading triggers (TP/SL)',
        'Community support',
      ],
      cta: 'Get started',
      action: () => navigate('/register'),
      disabled: false,
      featured: false,
    },
    {
      name: 'Pro',
      price: '£19',
      badge: 'Early access — coming soon',
      desc: 'For channels that run a business',
      features: [
        'Unlimited channels',
        'Unlimited automations',
        'Priority polling',
        'Webhooks',
        'API access',
      ],
      cta: 'Coming soon',
      action: () => {},
      disabled: true,
      featured: true,
    },
  ]

  return (
    <section id="pricing" style={{ background: L.surface, padding: '96px 0' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
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
          <p style={{ fontSize: '16px', color: L.textMuted }}>
            Start free. Upgrade when your channels outgrow it.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
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
              {tier.badge && (
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
                  {tier.badge}
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
                    {tier.price}
                  </span>
                  {tier.price !== 'Free' && (
                    <span style={{ fontSize: '14px', color: L.textMuted, paddingBottom: '4px' }}>/mo</span>
                  )}
                </div>
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
              </ul>

              <button
                onClick={tier.action}
                disabled={tier.disabled}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: tier.disabled ? 'default' : 'pointer',
                  border: tier.featured ? 'none' : `1px solid ${L.border}`,
                  background: tier.disabled ? L.surface2 : tier.featured ? L.accent : L.accent,
                  color: tier.disabled ? L.textFaint : '#ffffff',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { if (!tier.disabled) e.currentTarget.style.opacity = '0.85' }}
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

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Do I need to code?',
    a: 'No. Rules are built on a visual canvas — drag a trigger, add a condition, pick an action. If you can describe what you want ("when a TP hits, post this GIF"), you can build it.',
  },
  {
    q: 'How does posting work?',
    a: 'Through your own bot. Create one with BotFather in Telegram, paste the token into Tapwire, and add the bot to your channels. Posts come from your bot, under your name — you stay in control and can revoke access any time.',
  },
  {
    q: 'Can Tapwire read my channels?',
    a: 'The watcher reads the channels you add — that’s what powers triggers like keyword matches and TP/SL detection. If you prefer not to connect a watcher, you can drive everything by webhooks instead.',
  },
  {
    q: 'What about GIFs and media?',
    a: 'Upload a file or paste a URL when you save a template. Tapwire sends GIFs, images, and videos natively, so they play inline in Telegram like any normal post.',
  },
  {
    q: 'Can my trading system trigger posts?',
    a: 'Yes. Every automation can expose a webhook URL. One curl from your EA, bot, or script — with the pair, TP level, and pips in the payload — and the post goes out.',
  },
  {
    q: 'Is there an API?',
    a: 'Webhook ingest is available now: fire any automation from any system over HTTP. A full read/write API is on the roadmap and ships with the Pro plan.',
  },
]

function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id="faq" style={{ background: L.bg, padding: '96px 0' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: L.accent, letterSpacing: '0.08em', marginBottom: '10px' }}>
            FAQ
          </p>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 800,
              color: L.text,
              letterSpacing: '-0.025em',
            }}
          >
            Questions, answered
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FAQ_ITEMS.map((item, i) => {
            const open = openIdx === i
            return (
              <div
                key={i}
                style={{
                  background: L.surface,
                  border: `1px solid ${open ? L.accentBorder : L.border}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '18px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 600, color: L.text }}>{item.q}</span>
                  <ChevronDown
                    style={{
                      width: 16, height: 16, flexShrink: 0,
                      color: open ? L.accent : L.textFaint,
                      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
                {open && (
                  <div style={{ padding: '0 20px 18px' }}>
                    <p style={{ fontSize: '14px', color: L.textMuted, lineHeight: 1.7, margin: 0 }}>{item.a}</p>
                  </div>
                )}
              </div>
            )
          })}
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
        Your channels, on autopilot
      </h2>
      <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginBottom: '36px' }}>
        Connect your channels, build a rule, and let Tapwire do the posting. Free plan, no card.
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
        Get started free <ArrowRight style={{ width: 16, height: 16 }} />
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
            <div style={{ fontSize: '11px', color: L.textFaint }}>Telegram channel automation</div>
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
      <HowItWorks />
      <Features />
      <LiveExample />
      <UseCases />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  )
}
