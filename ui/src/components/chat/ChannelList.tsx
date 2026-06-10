import { Plus, Radio } from 'lucide-react'
import { clsx } from 'clsx'
import { EmptyState } from '../ui/EmptyState'
import { SkeletonBlock, SkeletonLine } from '../ui/Skeleton'
import type { Channel } from '../../lib/api'

export interface ChannelSnippet {
  text: string
  posted_at: number
}

/* ── Deterministic per-channel gradient identity ─────────────────────────
   Hash a channel title → one of 6 curated gradient pairs that sit well on
   the "electric ink" palette. Shared by avatars + sender-name tints. */
const AVATAR_GRADIENTS: ReadonlyArray<readonly [string, string]> = [
  ['#00e5b3', '#00b3ff'], // teal → cyan (brand)
  ['#818cf8', '#00b3ff'], // indigo → cyan
  ['#f472b6', '#818cf8'], // pink → indigo
  ['#ffb224', '#ff5d6c'], // amber → coral
  ['#34d97b', '#00e5b3'], // mint → teal
  ['#00b3ff', '#9f7aff'], // cyan → violet
]

export function channelGradientPair(name?: string | null): readonly [string, string] {
  const s = name || '#'
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

export function channelGradient(name?: string | null): string {
  const [a, b] = channelGradientPair(name)
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`
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
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-[var(--text)] tracking-tight" style={{ fontSize: 'var(--text-md)' }}>
            Channels
          </h2>
          {!loading && channels.length > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] font-mono leading-none"
              style={{ fontSize: 'var(--text-xs)', background: 'var(--surface-2)' }}
            >
              {channels.length}
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-inverse)] transition-transform duration-150 hover:scale-110 flex-shrink-0"
          style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-glow)' }}
          title="Add channel"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
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
                  'relative w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  !active && 'hover:bg-[var(--surface-hover)]'
                )}
                style={
                  active
                    ? {
                        background: 'var(--accent-gradient-soft)',
                        boxShadow: 'inset 0 0 24px rgba(0, 229, 179, 0.06)',
                      }
                    : undefined
                }
              >
                {/* Accent bar for the active channel */}
                {active && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                    style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-glow)' }}
                  />
                )}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[var(--text-inverse)] flex-shrink-0"
                  style={{
                    background: channelGradient(ch.title),
                    fontSize: '13px',
                    boxShadow: active ? 'var(--accent-glow)' : '0 1px 3px rgba(0,0,0,0.4)',
                  }}
                >
                  {ch.title?.[0]?.toUpperCase() || '#'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={clsx('font-semibold truncate', active ? 'text-[var(--accent)]' : 'text-[var(--text)]')}
                      style={{ fontSize: 'var(--text-sm)' }}
                    >
                      {ch.title}
                    </div>
                    {snippet && (
                      <span
                        className="flex-shrink-0 text-[var(--text-faint)] font-mono"
                        style={{ fontSize: 'var(--text-xs)' }}
                      >
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
