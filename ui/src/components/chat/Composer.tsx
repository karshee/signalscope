import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Film, Loader2, Send, Zap } from 'lucide-react'
import { clsx } from 'clsx'
import { useToast } from '../ui/Toast'
import { api, type ChannelMessage, type MediaAsset, type Template } from '../../lib/api'

interface ComposerProps {
  channelId: string
  templates: Template[]
  media: MediaAsset[]
  onSent: (msg: ChannelMessage) => void
}

interface OptimisticFields {
  text?: string
  has_media?: boolean
  media_type?: string | null
}

let localSeq = 0

export function Composer({ channelId, templates, media, onSent }: ComposerProps) {
  const { toast } = useToast()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendingTemplateId, setSendingTemplateId] = useState<string | null>(null)
  const [gifOpen, setGifOpen] = useState(false)
  const [botHint, setBotHint] = useState(false)

  const doSend = async (
    payload: { template_id?: string; text?: string; media_id?: string },
    optimistic: OptimisticFields
  ): Promise<boolean> => {
    try {
      const res = await api.messages.send(channelId, payload)
      onSent({
        id: `local-${Date.now()}-${localSeq++}`,
        channel_id: channelId,
        message_id: res.data.message_id ?? 0,
        sender_name: 'You',
        text: optimistic.text,
        has_media: optimistic.has_media ?? false,
        media_type: optimistic.media_type ?? null,
        posted_at: Math.floor(Date.now() / 1000),
        is_self_sent: true,
      })
      setBotHint(false)
      return true
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: unknown } } }
      const detail = typeof e.response?.data?.detail === 'string' ? e.response.data.detail : ''
      if (e.response?.status === 400 && /bot.?token|bot/i.test(detail)) {
        setBotHint(true)
      } else {
        toast(detail || 'Failed to send message', 'error')
      }
      return false
    }
  }

  const sendText = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    const ok = await doSend({ text: body }, { text: body })
    if (ok) setText('')
    setSending(false)
  }

  const sendTemplate = async (t: Template) => {
    if (sendingTemplateId) return
    setSendingTemplateId(t.id)
    await doSend(
      { template_id: t.id },
      { text: t.body, has_media: Boolean(t.media_id || t.media_url), media_type: t.media_id || t.media_url ? 'media' : null }
    )
    setSendingTemplateId(null)
  }

  const sendMedia = async (m: MediaAsset) => {
    setGifOpen(false)
    setSending(true)
    await doSend(
      { media_id: m.id },
      { has_media: true, media_type: m.mime?.startsWith('video') ? 'video' : m.kind || 'image' }
    )
    setSending(false)
  }

  return (
    <div className="glass flex-shrink-0 border-t border-[var(--border)] px-3 py-2.5">
      {/* Template quick-send chips */}
      {templates.length > 0 && (
        <div
          className="flex gap-1.5 overflow-x-auto pb-2 mb-1"
          style={{
            // Subtle fade masks at the scroll edges
            WebkitMaskImage:
              'linear-gradient(90deg, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)',
            maskImage:
              'linear-gradient(90deg, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)',
          }}
        >
          {templates.map((t) => {
            const busy = sendingTemplateId === t.id
            return (
              <button
                key={t.id}
                onClick={() => sendTemplate(t)}
                disabled={sendingTemplateId !== null}
                title={t.body}
                className={clsx(
                  'flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--accent)] font-medium',
                  'transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[0_4px_14px_rgba(0,229,179,0.18)]',
                  sendingTemplateId !== null && 'opacity-50 cursor-not-allowed hover:translate-y-0'
                )}
                style={{ fontSize: 'var(--text-xs)', background: 'var(--accent-gradient-soft)' }}
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {t.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Bot-token hint */}
      {botHint && (
        <div
          className="flex items-center gap-2 mb-2 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--loss)] text-[var(--loss)]"
          style={{ fontSize: 'var(--text-xs)', background: 'var(--loss-dim)' }}
        >
          Sending failed — no posting bot configured.
          <Link to="/app/settings" className="underline text-[var(--text)] hover:text-[var(--accent)]">
            Add your posting bot in Settings →
          </Link>
        </div>
      )}

      {/* Input row */}
      <div className="relative flex items-center gap-2">
        {/* GIF picker */}
        <button
          onClick={() => setGifOpen((o) => !o)}
          disabled={media.length === 0}
          title={media.length === 0 ? 'No media in library' : 'Send a GIF'}
          className={clsx(
            'p-2 rounded-full border transition-colors flex-shrink-0',
            gifOpen
              ? 'glow-ring text-[var(--accent)] border-[var(--border-strong)]'
              : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
            media.length === 0 && 'opacity-40 cursor-not-allowed'
          )}
          style={{ background: gifOpen ? 'var(--accent-gradient-soft)' : 'var(--surface-2)' }}
        >
          <Film className="w-4 h-4" />
        </button>

        {gifOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setGifOpen(false)} />
            <div className="glass absolute bottom-full left-0 mb-2 z-40 w-72 max-h-64 overflow-y-auto p-2 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] msg-enter">
              <div className="grid grid-cols-3 gap-2">
                {media.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => sendMedia(m)}
                    className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-[0_0_0_1px_rgba(0,229,179,0.35),0_0_24px_rgba(0,229,179,0.22)] transition-all duration-150 aspect-square"
                    title={m.filename}
                  >
                    {m.mime?.startsWith('video') ? (
                      <video src={api.media.fileUrl(m.id)} className="w-full h-full object-cover" muted loop autoPlay />
                    ) : (
                      <img src={api.media.fileUrl(m.id)} className="w-full h-full object-cover" alt={m.filename} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendText()}
          placeholder="Write a message…"
          disabled={sending}
          className={clsx(
            'flex-1 min-w-0 px-4 py-2 rounded-[var(--radius-full)] border border-[var(--border)] text-[var(--text)] outline-none',
            'transition-all duration-150 placeholder:text-[var(--text-faint)]',
            'focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_rgba(0,229,179,0.25),0_0_20px_rgba(0,229,179,0.12)]'
          )}
          style={{ fontSize: 'var(--text-sm)', background: 'var(--surface-2)' }}
        />

        <button
          onClick={sendText}
          disabled={sending || !text.trim()}
          title="Send"
          className={clsx(
            'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 flex-shrink-0',
            text.trim() && !sending
              ? 'text-[var(--text-inverse)] hover:scale-105'
              : 'text-[var(--text-faint)] cursor-not-allowed'
          )}
          style={
            text.trim() && !sending
              ? { background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-accent)' }
              : { background: 'var(--surface-2)', border: '1px solid var(--border)' }
          }
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
