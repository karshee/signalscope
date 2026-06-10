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
    <div className="flex-shrink-0 border-t border-[var(--border)] px-3 py-2.5" style={{ background: 'var(--surface)' }}>
      {/* Template quick-send chips */}
      {templates.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1">
          {templates.map((t) => {
            const busy = sendingTemplateId === t.id
            return (
              <button
                key={t.id}
                onClick={() => sendTemplate(t)}
                disabled={sendingTemplateId !== null}
                title={t.body}
                className={clsx(
                  'flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors',
                  'border-[var(--border)] text-[var(--accent)] hover:bg-[var(--accent-dim)]',
                  sendingTemplateId !== null && 'opacity-50 cursor-not-allowed'
                )}
                style={{ fontSize: 'var(--text-xs)', background: 'var(--surface-2)' }}
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
            'p-2 rounded-[var(--radius-md)] border border-[var(--border)] transition-colors flex-shrink-0',
            gifOpen ? 'text-[var(--accent)] bg-[var(--accent-dim)]' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
            media.length === 0 && 'opacity-40 cursor-not-allowed'
          )}
        >
          <Film className="w-4 h-4" />
        </button>

        {gifOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setGifOpen(false)} />
            <div
              className="absolute bottom-full left-0 mb-2 z-40 w-72 max-h-64 overflow-y-auto p-2 rounded-[var(--radius-lg)] border border-[var(--border-strong)] shadow-[var(--shadow-lg)]"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="grid grid-cols-3 gap-2">
                {media.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => sendMedia(m)}
                    className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-colors aspect-square"
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
          className="flex-1 min-w-0 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
          style={{ fontSize: 'var(--text-sm)' }}
        />

        <button
          onClick={sendText}
          disabled={sending || !text.trim()}
          title="Send"
          className={clsx(
            'p-2 rounded-[var(--radius-md)] transition-colors flex-shrink-0',
            text.trim() && !sending
              ? 'text-[var(--text-inverse)] bg-[var(--accent)] hover:bg-[var(--accent-hover)]'
              : 'text-[var(--text-faint)] bg-[var(--surface-2)] cursor-not-allowed'
          )}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
