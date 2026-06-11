import { Film } from 'lucide-react'
import { clsx } from 'clsx'
import { channelGradient } from './ChannelList'
import type { ChannelMessage } from '../../lib/api'

function timeLabel(epoch: number): string {
  return new Date(epoch * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function MessageBubble({ msg, animate = false }: { msg: ChannelMessage; animate?: boolean }) {
  const self = Boolean(msg.is_self_sent)
  return (
    <div className={clsx('flex', self ? 'justify-end' : 'justify-start', animate && 'msg-enter')}>
      <div
        className={clsx(
          'max-w-[80%] lg:max-w-[65%] px-3.5 py-2',
          self ? 'border border-[rgba(0,229,179,0.35)]' : 'border border-[var(--border)]'
        )}
        style={{
          background: self ? 'var(--accent-gradient-soft)' : 'var(--surface-2)',
          // 16px bubble with a 4px "tail" corner on the sender side
          borderRadius: self ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          lineHeight: 1.55,
          boxShadow: self ? '0 2px 12px rgba(0, 229, 179, 0.08)' : 'var(--shadow-sm)',
        }}
      >
        {!self && msg.sender_name && (
          <div
            className="font-semibold mb-0.5"
            style={{
              fontSize: 'var(--text-xs)',
              background: channelGradient(msg.sender_name),
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
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
            className="glass inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-[var(--text-muted)]"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            <Film className="w-3 h-3 text-[var(--accent)]" />
            {msg.media_type || 'media'}
          </div>
        )}
        <div
          className="flex items-center justify-end gap-1.5 mt-1 text-[var(--text-faint)] font-mono"
          style={{ fontSize: 'var(--text-xs)' }}
        >
          {self && <span className="gradient-text font-semibold">via Tapwire ⚡</span>}
          <span>{timeLabel(msg.posted_at)}</span>
        </div>
      </div>
    </div>
  )
}
