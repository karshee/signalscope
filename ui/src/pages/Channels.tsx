import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { clsx } from 'clsx'
import { AppShell } from '../components/layout/AppShell'
import { AddChannelModal } from '../components/channels/AddChannelModal'
import { ChannelList, type ChannelSnippet } from '../components/chat/ChannelList'
import { MessageThread } from '../components/chat/MessageThread'
import { Composer } from '../components/chat/Composer'
import { useSignalFeed } from '../lib/websocket'
import {
  api,
  type Channel,
  type ChannelMessage,
  type MediaAsset,
  type Template,
} from '../lib/api'

function snippetOf(m: ChannelMessage): ChannelSnippet {
  return {
    text: m.text?.trim() || (m.has_media ? `🎬 ${m.media_type || 'media'}` : ''),
    posted_at: m.posted_at,
  }
}

export default function Channels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelsLoading, setChannelsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChannelMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [snippets, setSnippets] = useState<Record<string, ChannelSnippet>>({})
  const [addOpen, setAddOpen] = useState(false)

  // Keep the selected channel id available to the (stable) WS callback
  const selectedRef = useRef<string | null>(null)
  selectedRef.current = selectedId

  const loadChannels = useCallback(async () => {
    try {
      const res = await api.channels.list()
      setChannels(res.data)
    } finally {
      setChannelsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadChannels()
    api.templates.list().then((r) => setTemplates(r.data)).catch(() => {})
    api.media.list().then((r) => setMedia(r.data)).catch(() => {})
  }, [loadChannels])

  const updateSnippet = useCallback((channelId: string, snippet: ChannelSnippet) => {
    setSnippets((prev) => {
      const existing = prev[channelId]
      if (existing && existing.posted_at > snippet.posted_at) return prev
      return { ...prev, [channelId]: snippet }
    })
  }, [])

  const appendMessage = useCallback((msg: ChannelMessage) => {
    setMessages((prev) => {
      if (
        prev.some(
          (m) => m.id === msg.id || (Boolean(msg.message_id) && m.message_id === msg.message_id)
        )
      ) {
        return prev
      }
      return [...prev, msg]
    })
  }, [])

  // Load thread when channel selection changes
  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }
    let cancelled = false
    setMessagesLoading(true)
    setMessages([])
    api.messages
      .list(selectedId, { limit: 50 })
      .then((res) => {
        if (cancelled) return
        setMessages(res.data)
        const last = res.data[res.data.length - 1]
        if (last) updateSnippet(selectedId, snippetOf(last))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setMessagesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId, updateSnippet])

  // Live updates over WS
  const handleFeed = useCallback(
    (raw: unknown) => {
      const msg = raw as { type?: string; data?: ChannelMessage }
      if (msg?.type !== 'channel_message' || !msg.data) return
      const data = msg.data
      updateSnippet(data.channel_id, snippetOf(data))
      if (data.channel_id === selectedRef.current) {
        appendMessage(data)
      }
    },
    [updateSnippet, appendMessage]
  )
  const connected = useSignalFeed(handleFeed)

  // Optimistic append after a successful send from the composer
  const handleSent = useCallback(
    (msg: ChannelMessage) => {
      appendMessage(msg)
      updateSnippet(msg.channel_id, snippetOf(msg))
    },
    [appendMessage, updateSnippet]
  )

  const selected = channels.find((c) => c.id === selectedId) ?? null

  return (
    <AppShell connected={connected}>
      <div className="flex h-full min-h-0">
        {/* Left pane — channel list (full-width on mobile until a channel is picked) */}
        <div
          className={clsx(
            'flex-col flex-shrink-0 w-full lg:w-72 border-r border-[var(--border)] min-h-0',
            selectedId ? 'hidden lg:flex' : 'flex'
          )}
          style={{ background: 'var(--surface)' }}
        >
          <ChannelList
            channels={channels}
            activeId={selectedId}
            snippets={snippets}
            loading={channelsLoading}
            onSelect={setSelectedId}
            onAdd={() => setAddOpen(true)}
          />
        </div>

        {/* Center pane — thread + composer */}
        <div
          className={clsx(
            'flex-1 flex-col min-w-0 min-h-0',
            selectedId ? 'flex' : 'hidden lg:flex'
          )}
        >
          {selected ? (
            <>
              {/* Thread header */}
              <div
                className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] flex-shrink-0"
                style={{ background: 'var(--surface)' }}
              >
                <button
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                  title="Back to channels"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[var(--text-inverse)] flex-shrink-0"
                  style={{ background: 'var(--accent)', fontSize: '12px' }}
                >
                  {selected.title?.[0]?.toUpperCase() || '#'}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-[var(--text)] truncate" style={{ fontSize: 'var(--text-sm)' }}>
                    {selected.title}
                  </div>
                  <div className="text-[var(--text-faint)] truncate" style={{ fontSize: 'var(--text-xs)' }}>
                    @{selected.username}
                  </div>
                </div>
              </div>

              <MessageThread messages={messages} loading={messagesLoading} />

              <Composer
                key={selected.id}
                channelId={selected.id}
                templates={templates}
                media={media}
                onSent={handleSent}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <div
                className="w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center text-[var(--text-muted)]"
                style={{ background: 'var(--surface-2)' }}
              >
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-lg)' }}>
                Select a channel
              </h3>
              <p className="text-[var(--text-muted)] max-w-sm" style={{ fontSize: 'var(--text-sm)' }}>
                Pick a channel from the list to view its messages and send replies, templates or GIFs.
              </p>
            </div>
          )}
        </div>
      </div>

      <AddChannelModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdded={loadChannels} />
    </AppShell>
  )
}
