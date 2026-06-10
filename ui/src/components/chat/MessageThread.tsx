import { useEffect, useRef, type ReactNode } from 'react'
import { MessageSquare } from 'lucide-react'
import { SkeletonBlock } from '../ui/Skeleton'
import { MessageBubble } from './MessageBubble'
import type { ChannelMessage } from '../../lib/api'

interface MessageThreadProps {
  messages: ChannelMessage[]
  loading: boolean
}

function dayLabel(epoch: number): string {
  const d = new Date(epoch * 1000)
  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}),
  })
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
      <span
        className="px-2.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]"
        style={{ fontSize: 'var(--text-xs)', background: 'var(--surface)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
    </div>
  )
}

export function MessageThread({ messages, loading }: MessageThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on load and when new messages arrive
  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  if (loading) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={i % 2 ? 'flex justify-end' : 'flex justify-start'}>
            <SkeletonBlock height={52} width={i % 2 ? '45%' : '60%'} className="rounded-[var(--radius-lg)]" />
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <div
          className="w-12 h-12 rounded-[var(--radius-xl)] flex items-center justify-center text-[var(--text-muted)]"
          style={{ background: 'var(--surface-2)' }}
        >
          <MessageSquare className="w-6 h-6" />
        </div>
        <p className="text-[var(--text-muted)] max-w-xs" style={{ fontSize: 'var(--text-sm)' }}>
          No messages yet — they'll appear as your watcher picks them up.
        </p>
      </div>
    )
  }

  const items: ReactNode[] = []
  let lastDay = ''
  for (const msg of messages) {
    const label = dayLabel(msg.posted_at)
    if (label !== lastDay) {
      items.push(<DaySeparator key={`sep-${msg.id}`} label={label} />)
      lastDay = label
    }
    items.push(<MessageBubble key={msg.id} msg={msg} />)
  }

  return (
    <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-2">
      {items}
    </div>
  )
}
