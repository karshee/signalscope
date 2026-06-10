import { Plus, Radio } from 'lucide-react'
import { clsx } from 'clsx'
import { EmptyState } from '../ui/EmptyState'
import { SkeletonBlock, SkeletonLine } from '../ui/Skeleton'
import type { Channel } from '../../lib/api'

export interface ChannelSnippet {
  text: string
  posted_at: number
}

interface ChannelListProps {
  channels: Channel[]
  activeId: string | null
  snippets: Record<string, ChannelSnippet>
  loading: boolean
  onSelect: (id: string) => void
  onAdd: () => void
}

function relativeTime(epoch: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - epoch)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d`
  return new Date(epoch * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function ChannelList({ channels, activeId, snippets, loading, onSelect, onAdd }: ChannelListProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
        <h2 className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
          Channels
        </h2>
        <button
          onClick={onAdd}
          className="p-1.5 rounded-[var(--radius-md)] text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-colors"
          title="Add channel"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBlock height={36} width={36} className="rounded-full flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <SkeletonLine className="w-3/4" />
                  <SkeletonLine className="w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : channels.length === 0 ? (
          <EmptyState
            icon={<Radio className="w-7 h-7" />}
            title="No channels yet"
            description="Add a Telegram channel to start chatting and automating."
            action={{ label: 'Add Channel', onClick: onAdd }}
          />
        ) : (
          channels.map((ch) => {
            const snippet = snippets[ch.id]
            const active = ch.id === activeId
            return (
              <button
                key={ch.id}
                onClick={() => onSelect(ch.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  active ? 'bg-[var(--accent-dim)]' : 'hover:bg-[var(--surface-hover)]'
                )}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[var(--text-inverse)] flex-shrink-0"
                  style={{ background: 'var(--accent)', fontSize: '13px' }}
                >
                  {ch.title?.[0]?.toUpperCase() || '#'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={clsx('font-medium truncate', active ? 'text-[var(--accent)]' : 'text-[var(--text)]')}
                      style={{ fontSize: 'var(--text-sm)' }}
                    >
                      {ch.title}
                    </div>
                    {snippet && (
                      <span className="flex-shrink-0 text-[var(--text-faint)]" style={{ fontSize: 'var(--text-xs)' }}>
                        {relativeTime(snippet.posted_at)}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
                    {snippet?.text || (ch.username ? `@${ch.username}` : 'No messages yet')}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
