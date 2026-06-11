import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Check, Zap, ArrowRight,
  MessageSquare, Workflow, TrendingUp, Clapperboard, Webhook, ShieldCheck,
  Link2, Play,
} from 'lucide-react'

// ── Electric-ink design tokens (mirrors ui/src/styles/globals.css) ───────────

const T = {
  bg:           'var(--bg)',
  raised:       'var(--bg-raised)',
  surface:      'var(--surface)',
  surface2:     'var(--surface-2)',
  surface3:     'var(--surface-3)',
  glass:        'var(--glass)',
  border:       'var(--border)',
  borderStrong: 'var(--border-strong)',
  text:         'var(--text)',
  muted:        'var(--text-muted)',
  faint:        'var(--text-faint)',
  inverse:      'var(--text-inverse)',
  accent:       'var(--accent)',
  accent2:      'var(--accent-2)',
  accentDim:    'var(--accent-dim)',
  gradient:     'var(--accent-gradient)',
  gradientSoft: 'var(--accent-gradient-soft)',
  win:          'var(--win)',
  trigger:      'var(--node-trigger)',
  condition:    'var(--node-condition)',
  action:       'var(--node-action)',
  mono:         'var(--font-mono)',
  ease:         'var(--ease)',
}

const glass: React.CSSProperties = {
  background: 'var(--glass)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid var(--border)',
}

// ── Keyframes + responsive rules injected once ────────────────────────────────

const GLOBAL_STYLES = `
  @keyframes twSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes twTermLine {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes twFlowDash {
    to { stroke-dashoffset: -16; }
  }
  .tw-hero-grid {
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: 64px;
    align-items: center;
  }
  .tw-nav-links { display: flex; }
  @media (max-width: 920px) {
    .tw-hero-grid { grid-template-columns: 1fr; gap: 48px; }
    .tw-nav-links { display: none !important; }
  }
  .tw-hiw-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
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
      padding: 14px 0;
    }
  }
`

// ── Shared bits ───────────────────────────────────────────────────────────────

function Wordmark({ size = 16 }: { size?: number }) {
  const s = Math.round(size * 1.55)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="twMarkGrad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#00e5b3" />
            <stop offset="100%" stopColor="#00b3ff" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="13" stroke="url(#twMarkGrad)" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="7" stroke="url(#twMarkGrad)" strokeWidth="1" opacity="0.5" />
        <line x1="2" y1="16" x2="8" y2="16" stroke="url(#twMarkGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="24" y1="16" x2="30" y2="16" stroke="url(#twMarkGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1="2" x2="16" y2="8" stroke="url(#twMarkGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1="24" x2="16" y2="30" stroke="url(#twMarkGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.5" fill="url(#twMarkGrad)" />
      </svg>
      <span className="gradient-text" style={{ fontWeight: 800, fontSize: size, letterSpacing: '-0.02em' }}>
        Tapwire
      </span>
    </span>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.14em',
        marginBottom: 12,
        fontFamily: T.mono,
      }}
      className="gradient-text"
    >
      {children}
    </p>
  )
}

function SectionGlow({ color, x, y }: { color: string; x: string; y: string }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(640px 420px at ${x} ${y}, ${color}, transparent 65%)`,
      }}
    />
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false)

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
          height: 64,
          background: scrolled ? 'rgba(7,9,15,0.72)' : 'transparent',
          borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          transition: 'all 0.25s ease',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Wordmark size={16} />
        </Link>

        <div className="tw-nav-links" style={{ alignItems: 'center', gap: 28 }}>
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
              style={{ fontSize: 14, color: T.muted, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text)}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Link
            to="/login"
            style={{ fontSize: 14, color: T.muted, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = T.text)}
            onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
          >
            Login
          </Link>
          <Link
            to="/register"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 20px',
              borderRadius: 999,
              background: T.gradient,
              color: T.inverse,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              boxShadow: 'var(--shadow-accent)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 36px rgba(0,229,179,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-accent)' }}
          >
            Get started <ChevronRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>
      </nav>
    </>
  )
}

// ── Rule canvas mock (hero visual) ────────────────────────────────────────────

function NodeCard({
  icon, color, kind, title, children, delay,
}: {
  icon: React.ReactNode
  color: string
  kind: string
  title: string
  children?: React.ReactNode
  delay: number
}) {
  return (
    <div
      style={{
        background: T.surface2,
        border: '1px solid var(--border-strong)',
        borderRadius: 12,
        padding: '12px 14px',
        width: '100%',
        animation: 'twSlideUp 450ms var(--ease) both',
        animationDelay: `${delay}ms`,
        position: 'relative',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      }}
    >
      {/* connection ports */}
      <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: T.surface2, border: `2px solid ${color}` }} />
      <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: T.surface2, border: `2px solid ${color}` }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: children ? 8 : 0 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: `color-mix(in srgb, ${color} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
            color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color, fontFamily: T.mono }}>{kind}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{title}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function NodeConnector({ delay }: { delay: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', animation: 'twSlideUp 450ms var(--ease) both', animationDelay: `${delay}ms` }}>
      <svg width="12" height="26" viewBox="0 0 12 26" fill="none">
        <defs>
          <linearGradient id="twConnGrad" x1="6" y1="0" x2="6" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00e5b3" />
            <stop offset="100%" stopColor="#00b3ff" />
          </linearGradient>
        </defs>
        <line
          x1="6" y1="0" x2="6" y2="18"
          stroke="url(#twConnGrad)" strokeWidth="2"
          strokeDasharray="4 4"
          style={{ animation: 'twFlowDash 1.2s linear infinite' }}
        />
        <path d="M1.5 18.5 L6 24 L10.5 18.5" stroke="#00b3ff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function RuleCanvas() {
  return (
    <div style={{ position: 'relative' }}>
      {/* glow behind the window */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-12% -8%',
          background: 'radial-gradient(60% 60% at 50% 45%, rgba(0,229,179,0.16), transparent 70%), radial-gradient(50% 50% at 70% 60%, rgba(0,179,255,0.12), transparent 70%)',
          filter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="float-y"
        style={{
          ...glass,
          position: 'relative',
          background: 'rgba(13,16,25,0.78)',
          borderRadius: 16,
          border: '1px solid var(--border-strong)',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 48px rgba(0,229,179,0.10)',
        }}
      >
        {/* Window title bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'rgba(18,22,36,0.85)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: T.trigger, opacity: 0.85 }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: T.accent2, opacity: 0.85 }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: T.action, opacity: 0.85 }} />
          </div>
          <span style={{ fontSize: 11, color: T.muted, fontFamily: T.mono }}>tapwire — rule builder</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent }} />
            <span style={{ fontSize: 10, color: T.accent, fontWeight: 700, fontFamily: T.mono }}>ACTIVE</span>
          </div>
        </div>

        {/* Canvas with dot grid */}
        <div
          style={{
            padding: '24px 28px',
            backgroundImage: 'radial-gradient(rgba(148,163,217,0.12) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          <NodeCard
            icon={<Zap style={{ width: 14, height: 14 }} />}
            color="var(--node-trigger)"
            kind="TRIGGER"
            title="TP hit on XAUUSD"
            delay={200}
          >
            <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono }}>
              watching <span style={{ color: T.accent }}>@GoldSignalsVIP</span> · live prices
            </div>
          </NodeCard>

          <NodeConnector delay={350} />

          <NodeCard
            icon={<Workflow style={{ width: 14, height: 14 }} />}
            color="var(--node-condition)"
            kind="CONDITION"
            title="tp_level ≥ 2"
            delay={450}
          >
            <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono }}>
              only announce the big targets
            </div>
          </NodeCard>

          <NodeConnector delay={600} />

          <NodeCard
            icon={<Play style={{ width: 14, height: 14 }} />}
            color="var(--node-action)"
            kind="ACTION"
            title="Post to @VIPSignals"
            delay={700}
          >
            <div
              style={{
                background: T.surface3,
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                color: T.text,
                marginBottom: 8,
              }}
            >
              🎯 XAUUSD TP2 HIT! +150 pips 🚀
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 999,
                background: T.accentDim,
                border: '1px solid rgba(0,229,179,0.35)',
                fontSize: 11,
                color: T.accent,
                fontWeight: 600,
                fontFamily: T.mono,
              }}
            >
              🎬 celebration.gif
            </div>
          </NodeCard>
        </div>
      </div>
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        paddingTop: 140,
        paddingBottom: 72,
        overflow: 'hidden',
      }}
    >
      {/* big soft gradient glow behind the hero */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(900px 520px at 24% -10%, rgba(0,229,179,0.13), transparent 60%), ' +
            'radial-gradient(800px 480px at 88% 8%, rgba(0,179,255,0.11), transparent 60%), ' +
            'radial-gradient(700px 500px at 55% 115%, rgba(129,140,248,0.08), transparent 60%)',
        }}
      />

      <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div className="tw-hero-grid">
          {/* Left */}
          <div style={{ animation: 'twSlideUp 550ms var(--ease) both' }}>
            {/* Eyebrow pill */}
            <div
              style={{
                ...glass,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: T.accent,
                marginBottom: 28,
                letterSpacing: '0.04em',
              }}
            >
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
              Telegram Channel Automation
            </div>

            <h1
              style={{
                fontSize: 'clamp(40px, 5.4vw, 72px)',
                fontWeight: 800,
                color: T.text,
                lineHeight: 1.04,
                letterSpacing: '-0.035em',
                marginBottom: 22,
              }}
            >
              Put your Telegram channels{' '}
              <span className="gradient-text">on autopilot.</span>
            </h1>

            <p
              style={{
                fontSize: 18,
                fontWeight: 300,
                color: T.muted,
                lineHeight: 1.65,
                maxWidth: 480,
                marginBottom: 32,
              }}
            >
              One workspace for all your channels, plus a visual if-this-then-that builder.
              Traders, marketers, and community managers use Tapwire to post the right
              message — text or GIFs — at exactly the right moment. No code.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <Link
                to="/register"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '13px 26px',
                  borderRadius: 10,
                  background: T.gradient,
                  color: T.inverse,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-accent)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,229,179,0.42)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-accent)' }}
              >
                Get started free <ChevronRight style={{ width: 16, height: 16 }} />
              </Link>
              <a
                href="#how-it-works"
                style={{
                  ...glass,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '13px 26px',
                  borderRadius: 10,
                  color: T.muted,
                  fontWeight: 500,
                  fontSize: 15,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = T.text }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = T.muted }}
              >
                See how it works
              </a>
            </div>

            <p style={{ fontSize: 12, color: T.faint, marginBottom: 28, fontFamily: T.mono }}>
              Free plan · No credit card · First rule live in minutes
            </p>

            {/* Trust marks */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
                paddingTop: 20,
                borderTop: '1px solid var(--divider)',
              }}
            >
              {[
                { icon: '🤖', text: 'Your own bot, your control' },
                { icon: '🧩', text: 'Visual rule builder' },
                { icon: '📈', text: 'TP/SL detection' },
                { icon: '🔗', text: 'Webhook triggers' },
              ].map((t) => (
                <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{t.icon}</span>
                  <span style={{ fontSize: 12, color: T.faint }}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — rule canvas mock */}
          <div style={{ animation: 'twSlideUp 550ms var(--ease) 150ms both' }}>
            <RuleCanvas />
          </div>
        </div>

        {/* Audience strip */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: T.faint,
            letterSpacing: '0.06em',
            marginTop: 72,
            fontFamily: T.mono,
          }}
        >
          Built for traders, marketers &amp; community managers
        </p>
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
    <section id="how-it-works" style={{ position: 'relative', padding: '104px 0' }}>
      <SectionGlow color="rgba(0,229,179,0.07)" x="12%" y="0%" />
      <div style={{ position: 'relative', maxWidth: 1040, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 56 }}>
          <Eyebrow>HOW IT WORKS</Eyebrow>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.6vw, 44px)',
              fontWeight: 800,
              color: T.text,
              letterSpacing: '-0.03em',
              lineHeight: 1.12,
            }}
          >
            From sign-up to your first automation in minutes.
          </h2>
        </div>

        <div className="tw-hiw-grid">
          {/* Gradient connector line (desktop) */}
          <div
            className="tw-hiw-hline"
            style={{
              position: 'absolute',
              top: 44,
              left: 80,
              right: 80,
              height: 2,
              background: 'linear-gradient(to right, transparent, rgba(0,229,179,0.5) 12%, rgba(0,179,255,0.5) 88%, transparent)',
            }}
          />

          {steps.map((step, i) => (
            <div key={i}>
              <div
                className="card-lift"
                style={{
                  ...glass,
                  position: 'relative',
                  borderRadius: 16,
                  padding: '28px 24px',
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <span
                    className="gradient-text"
                    style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: T.mono }}
                  >
                    {step.n}
                  </span>
                  <div
                    style={{
                      width: 38, height: 38,
                      borderRadius: 10,
                      background: T.accentDim,
                      border: '1px solid rgba(0,229,179,0.30)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: T.accent,
                    }}
                  >
                    {step.icon}
                  </div>
                </div>

                <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, fontWeight: 300, color: T.muted, lineHeight: 1.65, marginBottom: 12 }}>
                  {step.desc}
                </p>
                <span style={{ fontSize: 11, color: T.accent, fontFamily: T.mono, fontWeight: 600 }}>
                  → {step.detail}
                </span>
              </div>

              {/* Vertical connector (mobile only) */}
              {i < steps.length - 1 && (
                <div className="tw-hiw-vconnector">
                  <svg width="12" height="34" viewBox="0 0 12 34" fill="none">
                    <line x1="6" y1="0" x2="6" y2="26" stroke="rgba(0,229,179,0.4)" strokeWidth="2" strokeDasharray="4 4" />
                    <path d="M1.5 26.5 L6 32 L10.5 26.5" stroke={'#00b3ff'} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
    tint: 'var(--accent)',
  },
  {
    title: 'Visual rule builder',
    desc: 'Drag Trigger → Condition → Action blocks onto a canvas. If this happens, post that. No code, no YAML, no scripts.',
    lucide: <Workflow style={{ width: 18, height: 18 }} />,
    tint: 'var(--accent-2)',
  },
  {
    title: 'Trading triggers',
    desc: 'Tapwire parses signals in your channels and tracks TP/SL against live prices. The moment a target hits, your rule fires.',
    lucide: <TrendingUp style={{ width: 18, height: 18 }} />,
    tint: 'var(--win)',
  },
  {
    title: 'Saved templates & GIFs',
    desc: 'Reusable templates with variables like {pair}, {tp_level}, and {pips}. Attach media once, post it everywhere.',
    lucide: <Clapperboard style={{ width: 18, height: 18 }} />,
    tint: 'var(--node-condition)',
  },
  {
    title: 'Webhooks & integrations',
    desc: 'Any external system can fire your automations with one HTTP call. Trading bots, CRMs, cron jobs — if it can curl, it can post.',
    lucide: <Webhook style={{ width: 18, height: 18 }} />,
    tint: 'var(--node-action)',
  },
  {
    title: 'Loop-safe engine',
    desc: 'Rate limits, self-send protection, and a full execution log. Your rules can’t spam your channels or trigger each other forever.',
    lucide: <ShieldCheck style={{ width: 18, height: 18 }} />,
    tint: 'var(--accent)',
  },
]

function Features() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <section id="features" style={{ position: 'relative', padding: '104px 0' }}>
      <SectionGlow color="rgba(0,179,255,0.07)" x="85%" y="10%" />
      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>FEATURES</Eyebrow>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.6vw, 44px)',
              fontWeight: 800,
              color: T.text,
              letterSpacing: '-0.03em',
              marginBottom: 12,
            }}
          >
            Everything channel work needs. Nothing it doesn&apos;t.
          </h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: T.muted }}>Post by hand from one inbox, or let rules do it for you.</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                ...glass,
                borderColor: hoveredIdx === i ? `color-mix(in srgb, ${f.tint} 40%, transparent)` : 'var(--border)',
                borderRadius: 16,
                padding: 26,
                cursor: 'default',
                transition: 'all 0.25s var(--ease)',
                boxShadow: hoveredIdx === i ? `0 12px 40px rgba(0,0,0,0.5), 0 0 28px color-mix(in srgb, ${f.tint} 14%, transparent)` : 'none',
                transform: hoveredIdx === i ? 'translateY(-3px)' : 'translateY(0)',
              }}
            >
              <div
                style={{
                  width: 40, height: 40,
                  borderRadius: 10,
                  background: `color-mix(in srgb, ${f.tint} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${f.tint} 30%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: f.tint,
                  marginBottom: 16,
                }}
              >
                {f.lucide}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, fontWeight: 300, color: T.muted, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Live example strip (terminal panel) ───────────────────────────────────────

function LiveExample() {
  const lines = [
    { delay: 0,    content: <><span style={{ color: T.faint }}>[09:30:14] </span><span style={{ color: T.accent2 }}>@GoldSignalsVIP</span><span style={{ color: T.faint }}> → incoming message</span></> },
    { delay: 150,  content: <><span style={{ color: T.faint }}>  &quot;</span><span style={{ color: T.text }}>XAUUSD BUY 2341.50 | TP1 2348.00 TP2 2355.00 | SL 2330.00</span><span style={{ color: T.faint }}>&quot;</span></> },
    { delay: 350,  content: <><span style={{ color: T.faint }}>[09:30:14] </span><span style={{ color: T.condition }}>[PARSE]</span><span style={{ color: T.win }}> signal detected</span><span style={{ color: T.faint }}> — pair: </span><span style={{ color: T.accent2 }}>XAUUSD</span><span style={{ color: T.faint }}>, tracking TP/SL vs live price</span></> },
    { delay: 550,  content: <span style={{ color: T.faint }}>&nbsp;</span> },
    { delay: 750,  content: <><span style={{ color: T.faint }}>[11:02:41] </span><span style={{ color: T.condition }}>[PRICE]</span><span style={{ color: T.text }}> XAUUSD 2355.10 ≥ TP2 2355.00</span></> },
    { delay: 950,  content: <><span style={{ color: T.faint }}>[11:02:41] </span><span style={{ color: T.condition }}>[TRIGGER]</span><span style={{ color: T.win }}> tp_hit</span><span style={{ color: T.faint }}> — tp_level: </span><span style={{ color: T.accent2 }}>2</span><span style={{ color: T.faint }}>, pips: </span><span style={{ color: T.win }}>+150</span></> },
    { delay: 1150, content: <><span style={{ color: T.faint }}>[11:02:41] </span><span style={{ color: T.condition }}>[CONDITION]</span><span style={{ color: T.text }}> tp_level ≥ 2 </span><span style={{ color: T.win }}>✓ pass</span></> },
    { delay: 1350, content: <span style={{ color: T.faint }}>&nbsp;</span> },
    { delay: 1550, content: <><span style={{ color: T.faint }}>[11:02:42] </span><span style={{ color: T.condition }}>[ACTION]</span><span style={{ color: T.win }}> posted</span><span style={{ color: T.faint }}> → </span><span style={{ color: T.accent2 }}>@VIPSignals</span></> },
  ]

  return (
    <section style={{ position: 'relative', padding: '104px 0' }}>
      <SectionGlow color="rgba(129,140,248,0.08)" x="50%" y="100%" />
      <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Eyebrow>LIVE EXAMPLE</Eyebrow>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.2vw, 40px)',
              fontWeight: 800,
              color: T.text,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
            }}
          >
            A signal comes in. Tapwire takes it from there.
          </h2>
        </div>

        <div
          style={{
            ...glass,
            background: 'rgba(10,13,21,0.82)',
            borderRadius: 16,
            border: '1px solid var(--border-strong)',
            overflow: 'hidden',
            boxShadow: '0 24px 72px rgba(0,0,0,0.55), 0 0 40px rgba(0,179,255,0.07)',
            fontFamily: T.mono,
            fontSize: 13,
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
              background: 'rgba(18,22,36,0.85)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: T.trigger, opacity: 0.85 }} />
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: T.accent2, opacity: 0.85 }} />
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: T.action, opacity: 0.85 }} />
            </div>
            <span style={{ fontSize: 11, color: T.muted }}>tapwire — execution log</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: T.win }} />
              <span style={{ fontSize: 10, color: T.win, fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          {/* Log lines */}
          <div style={{ padding: '16px 18px 8px', overflowX: 'auto' }}>
            {lines.map((line, i) => (
              <div
                key={i}
                style={{
                  animation: 'twTermLine 300ms ease both',
                  animationDelay: `${line.delay}ms`,
                  whiteSpace: 'nowrap',
                }}
              >
                {line.content}
              </div>
            ))}
          </div>

          {/* Posted message — chat bubble */}
          <div
            style={{
              padding: '8px 18px 18px',
              animation: 'twTermLine 300ms ease both',
              animationDelay: '1700ms',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                gap: 8,
                maxWidth: 420,
                padding: '12px 14px',
                borderRadius: '14px 14px 14px 4px',
                background: T.surface3,
                border: '1px solid var(--border-strong)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: T.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: T.inverse,
                  }}
                >
                  V
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.accent2 }}>@VIPSignals</span>
                <span style={{ fontSize: 10, color: T.faint, fontFamily: T.mono }}>11:02</span>
              </div>
              <div style={{ fontSize: 14, color: T.text }}>🎯 XAUUSD TP2 HIT! +150 pips 🚀</div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: 'flex-start',
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: T.accentDim,
                  border: '1px solid rgba(0,229,179,0.35)',
                  fontSize: 11,
                  color: T.accent,
                  fontWeight: 600,
                  fontFamily: T.mono,
                }}
              >
                🎬 celebration.gif
              </div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 300, color: T.muted, marginTop: 24 }}>
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
    tint: 'var(--accent)',
    points: [
      'Auto-announce TP hits with celebration GIFs',
      'Relay signals between free and VIP channels',
      'Scheduled market-open and recap posts',
    ],
  },
  {
    icon: <Play style={{ width: 18, height: 18 }} />,
    title: 'Marketers',
    tint: 'var(--accent-2)',
    points: [
      'Scheduled campaigns across every channel at once',
      'Keyword-triggered replies in your groups',
      'Consistent templates — same voice, every post',
    ],
  },
  {
    icon: <MessageSquare style={{ width: 18, height: 18 }} />,
    title: 'Community managers',
    tint: 'var(--node-action)',
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
    <section id="use-cases" style={{ position: 'relative', padding: '104px 0' }}>
      <SectionGlow color="rgba(0,229,179,0.06)" x="15%" y="90%" />
      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>USE CASES</Eyebrow>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.6vw, 44px)',
              fontWeight: 800,
              color: T.text,
              letterSpacing: '-0.03em',
              marginBottom: 12,
            }}
          >
            Built for the people who run channels
          </h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: T.muted }}>Same builder. Three very different jobs done.</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {USE_CASES.map((uc, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                ...glass,
                borderColor: hoveredIdx === i ? `color-mix(in srgb, ${uc.tint} 40%, transparent)` : 'var(--border)',
                borderRadius: 16,
                padding: 0,
                overflow: 'hidden',
                cursor: 'default',
                transition: 'all 0.25s var(--ease)',
                boxShadow: hoveredIdx === i ? `0 12px 40px rgba(0,0,0,0.5), 0 0 28px color-mix(in srgb, ${uc.tint} 14%, transparent)` : 'none',
                transform: hoveredIdx === i ? 'translateY(-3px)' : 'translateY(0)',
              }}
            >
              {/* Colored top accent strip */}
              <div
                style={{
                  height: 3,
                  background: `linear-gradient(to right, ${uc.tint}, color-mix(in srgb, ${uc.tint} 30%, transparent))`,
                }}
              />
              <div style={{ padding: 28 }}>
                <div
                  style={{
                    width: 40, height: 40,
                    borderRadius: 10,
                    background: `color-mix(in srgb, ${uc.tint} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${uc.tint} 30%, transparent)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: uc.tint,
                    marginBottom: 16,
                  }}
                >
                  {uc.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>{uc.title}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {uc.points.map((p) => (
                    <li key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Check style={{ width: 14, height: 14, flexShrink: 0, marginTop: 3, color: uc.tint }} />
                      <span style={{ fontSize: 13, fontWeight: 300, color: T.muted, lineHeight: 1.6 }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function Pricing() {
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
      disabled: true,
      featured: true,
    },
  ]

  return (
    <section id="pricing" style={{ position: 'relative', padding: '104px 0' }}>
      <SectionGlow color="rgba(0,179,255,0.07)" x="80%" y="20%" />
      <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Eyebrow>PRICING</Eyebrow>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 46px)',
              fontWeight: 800,
              color: T.text,
              letterSpacing: '-0.03em',
              marginBottom: 12,
            }}
          >
            Simple pricing
          </h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: T.muted }}>
            Start free. Upgrade when your channels outgrow it.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, alignItems: 'stretch' }}>
          {tiers.map((tier) => {
            const card = (
              <div
                key={`${tier.name}-card`}
                style={{
                  ...glass,
                  background: tier.featured ? 'rgba(13,16,25,0.92)' : 'var(--glass)',
                  border: tier.featured ? 'none' : '1px solid var(--border)',
                  borderRadius: tier.featured ? 15 : 16,
                  padding: 28,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {tier.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -13,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '4px 14px',
                      borderRadius: 999,
                      background: T.gradient,
                      color: T.inverse,
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      boxShadow: 'var(--shadow-accent)',
                    }}
                  >
                    {tier.badge}
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 4 }}>{tier.name}</h3>
                  <p style={{ fontSize: 13, color: T.faint, marginBottom: 14 }}>{tier.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                    <span
                      className={tier.featured ? 'gradient-text' : undefined}
                      style={{
                        fontSize: 38,
                        fontWeight: 800,
                        color: tier.featured ? undefined : T.text,
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                      }}
                    >
                      {tier.price}
                    </span>
                    {tier.price !== 'Free' && (
                      <span style={{ fontSize: 14, color: T.muted, paddingBottom: 4 }}>/mo</span>
                    )}
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Check style={{ width: 14, height: 14, flexShrink: 0, marginTop: 2, color: tier.featured ? T.accent : T.win }} />
                      <span style={{ fontSize: 14, color: T.text }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {tier.disabled ? (
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'default',
                      border: '1px solid var(--border)',
                      background: T.surface2,
                      color: T.faint,
                    }}
                  >
                    {tier.cta}
                  </button>
                ) : (
                  <Link
                    to="/register"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 12,
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 14,
                      textAlign: 'center',
                      textDecoration: 'none',
                      border: 'none',
                      background: T.gradient,
                      color: T.inverse,
                      boxShadow: 'var(--shadow-accent)',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {tier.cta}
                  </Link>
                )}
              </div>
            )

            // Pro gets a gradient border wrapper + soft glow
            return tier.featured ? (
              <div
                key={tier.name}
                style={{
                  padding: 1,
                  borderRadius: 16,
                  background: T.gradient,
                  boxShadow: '0 0 48px rgba(0,229,179,0.14)',
                }}
              >
                {card}
              </div>
            ) : (
              <div key={tier.name}>{card}</div>
            )
          })}
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

function GradientChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{
        flexShrink: 0,
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.25s var(--ease)',
      }}
    >
      <defs>
        <linearGradient id="twChevGrad" x1="0" y1="0" x2="16" y2="16">
          <stop offset="0%" stopColor="#00e5b3" />
          <stop offset="100%" stopColor="#00b3ff" />
        </linearGradient>
      </defs>
      <path
        d="M3 6 L8 11 L13 6"
        stroke={open ? 'url(#twChevGrad)' : 'var(--text-faint)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id="faq" style={{ position: 'relative', padding: '104px 0' }}>
      <SectionGlow color="rgba(129,140,248,0.06)" x="50%" y="0%" />
      <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Eyebrow>FAQ</Eyebrow>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.6vw, 44px)',
              fontWeight: 800,
              color: T.text,
              letterSpacing: '-0.03em',
            }}
          >
            Questions, answered
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ_ITEMS.map((item, i) => {
            const open = openIdx === i
            return (
              <div
                key={i}
                style={{
                  ...glass,
                  borderColor: open ? 'rgba(0,229,179,0.30)' : 'var(--border)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: open ? '0 0 28px rgba(0,229,179,0.07)' : 'none',
                }}
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '18px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{item.q}</span>
                  <GradientChevron open={open} />
                </button>
                {open && (
                  <div style={{ padding: '0 20px 18px' }}>
                    <p style={{ fontSize: 14, fontWeight: 300, color: T.muted, lineHeight: 1.7, margin: 0 }}>{item.a}</p>
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
  return (
    <section style={{ padding: '24px 24px 104px' }}>
      <div
        className="gradient-drift"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          borderRadius: 24,
          padding: '88px 32px',
          textAlign: 'center',
          background: 'linear-gradient(120deg, #00e5b3 0%, #00b3ff 45%, #818cf8 80%, #00e5b3 100%)',
          boxShadow: '0 24px 80px rgba(0,179,255,0.22)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(30px, 4.4vw, 52px)',
            fontWeight: 800,
            color: T.inverse,
            letterSpacing: '-0.03em',
            marginBottom: 14,
          }}
        >
          Your channels, on autopilot
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(5,6,8,0.72)', marginBottom: 36, fontWeight: 500 }}>
          Connect your channels, build a rule, and let Tapwire do the posting. Free plan, no card.
        </p>
        <Link
          to="/register"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '15px 34px',
            borderRadius: 12,
            background: T.bg,
            color: T.text,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(0,0,0,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
        >
          Get started free <ArrowRight style={{ width: 16, height: 16 }} />
        </Link>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--divider)' }}>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '40px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
        }}
      >
        {/* Wordmark + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Wordmark size={14} />
          <span style={{ fontSize: 11, color: T.faint }}>Telegram channel automation</span>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact', 'Docs'].map((l) => (
            <a
              key={l}
              href="#"
              style={{ fontSize: 13, color: T.muted, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text)}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
            >
              {l}
            </a>
          ))}
        </div>

        <div style={{ fontSize: 12, color: T.faint }}>© 2026 Tapwire</div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div style={{ background: T.bg, color: T.text, overflowX: 'hidden', fontFamily: 'var(--font-ui)' }}>
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
