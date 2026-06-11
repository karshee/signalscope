import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { FileText, Plus, Trash2, Pencil, Film, Upload } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { api, type Template, type MediaAsset } from '../lib/api'

const VARIABLES = [
  'pair', 'direction', 'tp_level', 'pips', 'rr', 'outcome',
  'text', 'channel_title', 'date', 'time', 'webhook.field',
]

const SAMPLE: Record<string, string | number> = {
  pair: 'XAUUSD', direction: 'BUY', tp_level: 2, pips: 150, rr: 2.5,
  outcome: 'tp_hit', text: 'BUY XAUUSD @ 2410', channel_title: 'VIP Signals',
  date: '2026-06-10', time: '14:30',
}

function renderPreview(body: string): string {
  return body.replace(/\{([a-zA-Z_][a-zA-Z0-9_.]*)\}/g, (m, key) =>
    key in SAMPLE ? String(SAMPLE[key]) : m
  )
}

interface EditorState {
  id?: string
  name: string
  body: string
  media_id?: string | null
  media_url?: string | null
}

const EMPTY: EditorState = { name: '', body: '', media_id: null, media_url: null }

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditorState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const [t, m] = await Promise.all([api.templates.list(), api.media.list()])
      setTemplates(t.data)
      setMedia(m.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const insertVar = (v: string) => {
    if (!editing) return
    const el = bodyRef.current
    const token = `{${v}}`
    if (el) {
      const start = el.selectionStart ?? editing.body.length
      const body = editing.body.slice(0, start) + token + editing.body.slice(el.selectionEnd ?? start)
      setEditing({ ...editing, body })
      requestAnimationFrame(() => {
        el.focus()
        el.selectionStart = el.selectionEnd = start + token.length
      })
    } else {
      setEditing({ ...editing, body: editing.body + token })
    }
  }

  const handleUpload = async (file: File) => {
    setError('')
    try {
      const res = await api.media.upload(file)
      await load()
      setEditing((e) => (e ? { ...e, media_id: res.data.id, media_url: null } : e))
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Upload failed')
    }
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: editing.name,
        body: editing.body,
        media_id: editing.media_id || null,
        media_url: editing.media_url || null,
      }
      if (editing.id) await api.templates.update(editing.id, payload)
      else await api.templates.create(payload)
      setEditing(null)
      await load()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Could not save template')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    await api.templates.delete(id)
    await load()
  }

  return (
    <AppShell>
      <div className="p-4 lg:p-6 max-w-7xl mx-auto page-enter">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
            Saved messages you can send with one click or attach to automations
          </p>
          <Button onClick={() => setEditing({ ...EMPTY })}>
            <Plus className="w-4 h-4" /> New template
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-7 h-7" />}
            title="No templates yet"
            description='Create reusable messages like "🎯 {pair} TP{tp_level} HIT! +{pips} pips" — with GIFs.'
            action={{ label: 'New template', onClick: () => setEditing({ ...EMPTY }) }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <div
                key={t.id}
                className="glass card-lift rounded-[var(--radius-lg)] p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-[var(--text)] truncate">{t.name}</div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() =>
                        setEditing({ id: t.id, name: t.name, body: t.body, media_id: t.media_id, media_url: t.media_url })}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(t.id)}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--loss)] hover:bg-[var(--loss-dim)]"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div
                  className="px-4 py-3 whitespace-pre-wrap break-words flex-1"
                  style={{
                    background: 'var(--surface-2)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text)',
                    borderLeft: '2px solid var(--accent)',
                    borderRadius: '4px var(--radius-lg) var(--radius-lg) var(--radius-lg)',
                  }}
                >
                  {t.body || <span style={{ color: 'var(--text-faint)' }}>(media only)</span>}
                </div>
                {(t.media_id || t.media_url) && (
                  <div className="flex items-center gap-2 text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
                    <Film className="w-3.5 h-3.5" />
                    {t.media_id ? 'Attached media' : t.media_url}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit template' : 'New template'}
        className="max-w-2xl"
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Template name (e.g. TP celebration)"
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
              style={{ fontSize: 'var(--text-sm)' }}
            />

            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    onClick={() => insertVar(v)}
                    className="px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--accent)] hover:border-[var(--border-strong)] transition-colors"
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--accent-gradient-soft)',
                    }}
                  >
                    {`{${v}}`}
                  </button>
                ))}
              </div>
              <textarea
                ref={bodyRef}
                value={editing.body}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                placeholder={'🎯 {pair} TP{tp_level} HIT! +{pips} pips'}
                rows={5}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)] resize-y"
                style={{ fontSize: 'var(--text-sm)' }}
              />
            </div>

            {/* Media */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/gif,video/mp4,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
                <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5" /> Upload GIF / image
                </Button>
                <input
                  value={editing.media_url ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, media_url: e.target.value || null, media_id: e.target.value ? null : editing.media_id })}
                  placeholder="…or paste a GIF URL"
                  className="flex-1 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  style={{ fontSize: 'var(--text-xs)' }}
                />
              </div>
              {media.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-1">
                  {media.map((m) => (
                    <button
                      key={m.id}
                      onClick={() =>
                        setEditing({ ...editing, media_id: editing.media_id === m.id ? null : m.id, media_url: null })}
                      className={clsx(
                        'flex-shrink-0 rounded-[var(--radius-md)] overflow-hidden border transition-all duration-200',
                        editing.media_id === m.id && 'glow-ring'
                      )}
                      style={{
                        borderColor: editing.media_id === m.id ? 'var(--accent)' : 'var(--border)',
                        width: 72, height: 72,
                      }}
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
              )}
            </div>

            {/* Live preview */}
            {editing.body && (
              <div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span
                    className="uppercase tracking-widest font-semibold text-[var(--accent)]"
                    style={{ fontSize: '10px' }}
                  >
                    Preview
                  </span>
                  <span className="text-[var(--text-faint)]" style={{ fontSize: 'var(--text-xs)' }}>
                    with sample values
                  </span>
                </div>
                <div
                  className="px-4 py-3 whitespace-pre-wrap border border-[var(--border)]"
                  style={{
                    background: 'var(--surface-2)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text)',
                    borderLeft: '2px solid var(--accent)',
                    borderRadius: '4px var(--radius-lg) var(--radius-lg) var(--radius-lg)',
                  }}
                >
                  {renderPreview(editing.body)}
                </div>
              </div>
            )}

            {error && (
              <div className="text-[var(--loss)]" style={{ fontSize: 'var(--text-sm)' }}>{error}</div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} loading={saving} disabled={!editing.name.trim()}>
                {editing.id ? 'Save changes' : 'Create template'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
