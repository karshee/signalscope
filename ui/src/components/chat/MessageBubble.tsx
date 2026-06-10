import { Film } from 'lucide-react'
import { clsx } from 'clsx'
import type { ChannelMessage } from '../../lib/api'

function timeLabel(epoch: number): string {
  return new Date(epoch * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function MessageBubble({ msg }: { msg: ChannelMessage }) {
  const self = Boolean(msg.is_self_sent)
  return (
    <div className={clsx('flex', self ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[80%] lg:max-w-[65%] rounded-[var(--radius-lg)] px-3.5 py-2 border border-[var(--border)]'
        )}
        style={{ background: self ? 'var(--accent-dim)' : 'var(--surface)' }}
      >
        {!self && msg.sender_name && (
          <div className="font-medium text-[var(--accent)] mb-0.5" style={{ fontSize: 'var(--text-xs)' }}>
            {msg.sender_name}
          </div>
        )}
        {msg.text && (
          <div
            className="whitespace-pre-wrap break-words text-[var(--text)]"
            style={{ fontSize: 'var(--text-sm)' }}
          >
            {msg.text}
          </div>
        )}
        {Boolean(msg.has_media) && (
          <div
            className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]"
            style={{ fontSize: 'var(--text-xs)', background: 'var(--surface-2)' }}
          >
            <Film className="w-3 h-3" />
            {msg.media_type || 'media'}
          </div>
        )}
        <div
          className="flex items-center justify-end gap-1.5 mt-1 text-[var(--text-faint)]"
          style={{ fontSize: 'var(--text-xs)' }}
        >
          {self && <span className="text-[var(--accent)]">via Tapwire</span>}
          <span>{timeLabel(msg.posted_at)}</span>
        </div>
      </div>
    </div>
  )
}
