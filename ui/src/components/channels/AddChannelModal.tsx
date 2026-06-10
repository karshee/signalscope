import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { api } from '../../lib/api'
import { useToast } from '../ui/Toast'
import { CheckCircle, Radio } from 'lucide-react'
import { channelGradient } from '../chat/ChannelList'

interface AddChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded?: () => void
}

export function AddChannelModal({ isOpen, onClose, onAdded }: AddChannelModalProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [preview, setPreview] = useState<{ title: string; username: string } | null>(null)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const handleFetch = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setPreview(null)
    // Simulate fetch — in production would call an API
    await new Promise((r) => setTimeout(r, 800))
    const username = input.replace(/^@/, '').replace(/.*\//, '')
    setPreview({ title: username, username })
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!preview) return
    setAdding(true)
    try {
      await api.channels.create({ username: preview.username, title: preview.title })
      toast('Channel added successfully', 'success')
      onAdded?.()
      onClose()
      setInput('')
      setPreview(null)
    } catch {
      setError('Failed to add channel. Check the username and try again.')
      toast('Failed to add channel', 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleClose = () => {
    onClose()
    setInput('')
    setPreview(null)
    setError('')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Channel">
      <div className="flex flex-col gap-5">
        <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
          Enter a Telegram channel username or invite link — for example{' '}
          <span className="font-mono text-[var(--accent)]" style={{ fontSize: 'var(--text-xs)' }}>
            @channelname
          </span>{' '}
          or{' '}
          <span className="font-mono text-[var(--accent)]" style={{ fontSize: 'var(--text-xs)' }}>
            t.me/channelname
          </span>
          . We'll fetch a preview before anything is added.
        </p>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="@channelname or t.me/channelname"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              error={error}
            />
          </div>
          <Button
            variant="ghost"
            onClick={handleFetch}
            loading={loading}
            disabled={!input.trim()}
          >
            Fetch
          </Button>
        </div>

        {preview && (
          <div
            className="rounded-[var(--radius-lg)] border border-[rgba(0,229,179,0.35)] p-4 flex items-center gap-3 msg-enter"
            style={{ background: 'var(--accent-gradient-soft)', boxShadow: '0 2px 16px rgba(0, 229, 179, 0.1)' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-[var(--text-inverse)] flex-shrink-0"
              style={{
                background: channelGradient(preview.title),
                fontSize: '15px',
                boxShadow: 'var(--accent-glow)',
              }}
            >
              {preview.title[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-sm)' }}>
                {preview.title}
              </div>
              <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
                @{preview.username}
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-[var(--accent)]" />
          </div>
        )}

        {!preview && !loading && (
          <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0 text-[var(--accent)] border border-[var(--border)]"
              style={{ background: 'var(--accent-gradient-soft)' }}
            >
              <Radio className="w-4 h-4" />
            </div>
            <span className="text-[var(--text-faint)]" style={{ fontSize: 'var(--text-sm)' }}>
              Channel preview will appear here after fetching
            </span>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            loading={adding}
            disabled={!preview}
          >
            Add Channel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
