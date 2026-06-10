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
    <div className="flex items-center justify-center my-2.5">
      <span
        className="glass px-3 py-1 rounded-full text-[var(--text-muted)] font-medium tracking-wide"
        style={{ fontSize: 'var(--text-xs)' }}
      >
        {label}
      </span>
    </div>
  )
}

export function MessageThread({ messages, loading }: MessageThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Track which message ids existed at initial load so only newly appended
  // messages get the .msg-enter animation (visual only).
  const knownIds = useRef<Set<string>>(new Set())
  const hydrated = useRef(false)

  useEffect(() => {
    if (loading) {
      hydrated.current = false
      knownIds.current = new Set()
      return
    }
    for (const m of messages) knownIds.current.add(m.id)
    hydrated.current = true
  }, [loading, messages])

  // Auto-scroll to bottom on load and when new messages arrive
  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  if (loading) {
    return (
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3"
        style={{ background: 'var(--bg-raised)' }}
      >
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
      <div
        className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 px-8 text-center"
        style={{ background: 'var(--bg-raised)' }}
      >
        <div
          className="w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center text-[var(--accent)] border border-[var(--border)] float-y"
          style={{ background: 'var(--accent-gradient-soft)' }}
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
    items.push(
      <MessageBubble
        key={msg.id}
        msg={msg}
        animate={hydrated.current && !knownIds.current.has(msg.id)}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-2"
      style={{ background: 'var(--bg-raised)' }}
    >
      {items}
    </div>
  )
}
