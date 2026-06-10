import { useState, type ReactNode } from 'react'
import { Trash2, X } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Channel, MediaAsset, Template, WebhookToken } from '../../lib/api'
import type { AutomationFlowNode } from './nodes'
import {
  CRON_PRESETS,
  DAY_LABELS,
  FIELD_HINTS,
  KIND_COLORS,
  KIND_LABELS,
  NODE_REGISTRY,
  TEMPLATE_VARIABLES,
} from './registry'

type Config = Record<string, unknown>

interface ConfigDrawerProps {
  node: AutomationFlowNode
  channels: Channel[]
  templates: Template[]
  media: MediaAsset[]
  webhooks: WebhookToken[]
  onConfigChange: (nodeId: string, config: Config) => void
  onDelete: (nodeId: string) => void
  onClose: () => void
}

// ── small form primitives ─────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[var(--text-muted)] font-medium" style={{ fontSize: 'var(--text-xs)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-2.5 py-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder-[var(--text-faint)]'
const inputStyle = { fontSize: 'var(--text-sm)' } as const

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} style={inputStyle} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputCls} style={inputStyle} />
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[var(--accent)]"
      />
      <span className="text-[var(--text)]" style={{ fontSize: 'var(--text-sm)' }}>
        {label}
      </span>
    </label>
  )
}

function ChannelMultiSelect({
  channels,
  selected,
  onChange,
  emptyHint,
}: {
  channels: Channel[]
  selected: string[]
  onChange: (ids: string[]) => void
  emptyHint?: string
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  return (
    <div
      className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--border)] p-2 max-h-44 overflow-y-auto"
      style={{ background: 'var(--bg)' }}
    >
      {channels.length === 0 && (
        <span className="text-[var(--text-faint)] px-1 py-0.5" style={{ fontSize: 'var(--text-xs)' }}>
          No channels connected yet
        </span>
      )}
      {channels.map((ch) => (
        <Checkbox
          key={ch.id}
          label={ch.title || ch.username}
          checked={selected.includes(ch.id)}
          onChange={() => toggle(ch.id)}
        />
      ))}
      {emptyHint && selected.length === 0 && channels.length > 0 && (
        <span className="text-[var(--text-faint)] px-1 pt-1" style={{ fontSize: 'var(--text-xs)' }}>
          {emptyHint}
        </span>
      )}
    </div>
  )
}

const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : [])
const asString = (v: unknown): string => (typeof v === 'string' ? v : '')

// ── per-type forms ────────────────────────────────────────────────────────────

function MessageReceivedForm({ config, set, channels }: FormProps) {
  return (
    <>
      <Field label="Listen in channels">
        <ChannelMultiSelect
          channels={channels}
          selected={asStringArray(config.channel_ids)}
          onChange={(ids) => set({ channel_ids: ids.length ? ids : undefined })}
          emptyHint="None selected — fires for every channel"
        />
      </Field>
      <Checkbox
        label="Include messages sent by the bot itself"
        checked={Boolean(config.include_self_sent)}
        onChange={(v) => set({ include_self_sent: v || undefined })}
      />
    </>
  )
}

function OutcomeEventForm({ config, set, channels }: FormProps) {
  const events = asStringArray(config.events)
  const toggleEvent = (ev: string) =>
    set({
      events: events.includes(ev)
        ? events.filter((e) => e !== ev).length
          ? events.filter((e) => e !== ev)
          : undefined
        : [...events, ev],
    })
  return (
    <>
      <Field label="Events">
        <div className="flex flex-col gap-1.5">
          <Checkbox label="Take-profit hit (tp_hit)" checked={events.includes('tp_hit')} onChange={() => toggleEvent('tp_hit')} />
          <Checkbox label="Stop-loss hit (sl_hit)" checked={events.includes('sl_hit')} onChange={() => toggleEvent('sl_hit')} />
        </div>
      </Field>
      <Field label="Minimum TP level (optional)">
        <TextInput
          type="number"
          min={1}
          placeholder="e.g. 2 = only TP2 and above"
          value={typeof config.min_tp_level === 'number' ? config.min_tp_level : ''}
          onChange={(e) =>
            set({ min_tp_level: e.target.value === '' ? undefined : Number(e.target.value) })}
        />
      </Field>
      <Field label="Only signals from channels">
        <ChannelMultiSelect
          channels={channels}
          selected={asStringArray(config.channel_ids)}
          onChange={(ids) => set({ channel_ids: ids.length ? ids : undefined })}
          emptyHint="None selected — any channel"
        />
      </Field>
    </>
  )
}

function ScheduleTickForm({ config, set }: FormProps) {
  const cron = asString(config.cron)
  const matched = CRON_PRESETS.find((p) => p.value === cron)
  const [custom, setCustom] = useState(() => Boolean(cron) && !matched)
  const isCustom = custom || (Boolean(cron) && !matched)
  return (
    <>
      <Field label="Schedule">
        <Select
          value={isCustom ? '__custom' : cron || CRON_PRESETS[0].value}
          onChange={(e) => {
            if (e.target.value === '__custom') {
              setCustom(true)
            } else {
              setCustom(false)
              set({ cron: e.target.value })
            }
          }}
        >
          {CRON_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} ({p.value})
            </option>
          ))}
          <option value="__custom">Custom cron…</option>
        </Select>
      </Field>
      {isCustom && (
        <Field label="Cron expression (min hour day month weekday)">
          <TextInput
            value={cron}
            placeholder="*/30 9-17 * * 1-5"
            onChange={(e) => set({ cron: e.target.value })}
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
          />
        </Field>
      )}
    </>
  )
}

function WebhookReceivedForm({ config, set, webhooks }: FormProps) {
  return (
    <Field label="Webhook token">
      <Select
        value={asString(config.token_id)}
        onChange={(e) => set({ token_id: e.target.value || undefined })}
      >
        <option value="">Any token</option>
        {webhooks.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </Select>
    </Field>
  )
}

function TextMatchForm({ config, set }: FormProps) {
  return (
    <>
      <Field label="Field">
        <TextInput
          value={asString(config.field)}
          placeholder="text (default)"
          onChange={(e) => set({ field: e.target.value || undefined })}
        />
      </Field>
      <Field label="Mode">
        <Select value={asString(config.mode) || 'contains'} onChange={(e) => set({ mode: e.target.value })}>
          <option value="contains">contains</option>
          <option value="exact">exact</option>
          <option value="regex">regex</option>
        </Select>
      </Field>
      <Field label="Value">
        <TextInput
          value={asString(config.value)}
          placeholder={config.mode === 'regex' ? 'TP\\s*[12]\\s*hit' : 'TP'}
          onChange={(e) => set({ value: e.target.value })}
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
        />
      </Field>
      <Checkbox
        label="Case sensitive"
        checked={Boolean(config.case_sensitive)}
        onChange={(v) => set({ case_sensitive: v || undefined })}
      />
    </>
  )
}

function ChannelFilterForm({ config, set, channels }: FormProps) {
  return (
    <Field label="Allowed channels">
      <ChannelMultiSelect
        channels={channels}
        selected={asStringArray(config.channel_ids)}
        onChange={(ids) => set({ channel_ids: ids })}
      />
    </Field>
  )
}

const COMPARE_OPS = ['==', '!=', '>', '>=', '<', '<=', 'in', 'contains']

function coerceCompareValue(raw: string, op: string): unknown {
  if (op === 'in') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s !== '' && !Number.isNaN(Number(s)) ? Number(s) : s))
  }
  if (raw !== '' && !Number.isNaN(Number(raw))) return Number(raw)
  return raw
}

function displayCompareValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ')
  return v === undefined || v === null ? '' : String(v)
}

function FieldCompareForm({ config, set }: FormProps) {
  const op = asString(config.op) || '=='
  return (
    <>
      <Field label="Field">
        <TextInput
          value={asString(config.field)}
          placeholder="pair"
          list="field-compare-hints"
          onChange={(e) => set({ field: e.target.value })}
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
        />
        <datalist id="field-compare-hints">
          {FIELD_HINTS.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </Field>
      <Field label="Operator">
        <Select
          value={op}
          onChange={(e) =>
            set({ op: e.target.value, value: coerceCompareValue(displayCompareValue(config.value), e.target.value) })}
        >
          {COMPARE_OPS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={op === 'in' ? 'Values (comma-separated)' : 'Value'}>
        <TextInput
          value={displayCompareValue(config.value)}
          placeholder={op === 'in' ? 'XAUUSD, EURUSD' : 'XAUUSD'}
          onChange={(e) => set({ value: coerceCompareValue(e.target.value, op) })}
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
        />
      </Field>
    </>
  )
}

function TimeWindowForm({ config, set }: FormProps) {
  const days = Array.isArray(config.days) ? (config.days as number[]) : []
  const toggleDay = (d: number) => {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort((a, b) => a - b)
    set({ days: next.length ? next : undefined })
  }
  return (
    <>
      <Field label="Days (none = every day)">
        <div className="flex flex-wrap gap-1">
          {DAY_LABELS.map((label, d) => {
            const on = days.includes(d)
            return (
              <button
                key={label}
                onClick={() => toggleDay(d)}
                className="px-2 py-1 rounded-[var(--radius-sm)] border transition-colors"
                style={{
                  fontSize: 'var(--text-xs)',
                  background: on ? 'var(--accent-dim)' : 'var(--bg)',
                  color: on ? 'var(--accent)' : 'var(--text-muted)',
                  borderColor: on ? 'var(--accent)' : 'var(--border-strong)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="From">
          <TextInput
            type="time"
            value={asString(config.start)}
            onChange={(e) => set({ start: e.target.value || undefined })}
          />
        </Field>
        <Field label="Until">
          <TextInput
            type="time"
            value={asString(config.end)}
            onChange={(e) => set({ end: e.target.value || undefined })}
          />
        </Field>
      </div>
      <Field label="Timezone (optional)">
        <TextInput
          value={asString(config.timezone)}
          placeholder="Europe/London"
          onChange={(e) => set({ timezone: e.target.value || undefined })}
        />
      </Field>
    </>
  )
}

function VariableChips({ onInsert }: { onInsert: (token: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {TEMPLATE_VARIABLES.map((v) => (
        <button
          key={v}
          onClick={() => onInsert(`{${v}}`)}
          className="px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-colors"
          style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
        >
          {`{${v}}`}
        </button>
      ))}
    </div>
  )
}

function ChannelSelect({
  channels,
  value,
  onChange,
}: {
  channels: Channel[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select a channel…</option>
      {channels.map((ch) => (
        <option key={ch.id} value={ch.id}>
          {ch.title || ch.username}
        </option>
      ))}
    </Select>
  )
}

function SendMessageForm({ config, set, channels, templates }: FormProps) {
  const useTemplate = Boolean(config.template_id) || (config.template_id === undefined && !config.text && templates.length > 0)
  const [mode, setMode] = useState<'template' | 'text'>(useTemplate ? 'template' : 'text')
  const text = asString(config.text)
  return (
    <>
      <Field label="Post to channel (required)">
        <ChannelSelect
          channels={channels}
          value={asString(config.channel_id)}
          onChange={(id) => set({ channel_id: id })}
        />
      </Field>
      <Field label="Content">
        <div className="flex rounded-[var(--radius-md)] border border-[var(--border-strong)] overflow-hidden">
          {(['template', 'text'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-1.5 transition-colors"
              style={{
                fontSize: 'var(--text-xs)',
                background: mode === m ? 'var(--accent-dim)' : 'var(--bg)',
                color: mode === m ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {m === 'template' ? 'Saved template' : 'Custom text'}
            </button>
          ))}
        </div>
      </Field>
      {mode === 'template' ? (
        <Select
          value={asString(config.template_id)}
          onChange={(e) => set({ template_id: e.target.value || undefined, text: undefined })}
        >
          <option value="">Select a template…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      ) : (
        <div className="flex flex-col gap-2">
          <VariableChips onInsert={(tok) => set({ text: text + tok, template_id: undefined })} />
          <textarea
            value={text}
            rows={4}
            placeholder={'🎯 {pair} TP{tp_level} HIT! +{pips} pips'}
            onChange={(e) => set({ text: e.target.value, template_id: undefined })}
            className={`${inputCls} resize-y`}
            style={inputStyle}
          />
        </div>
      )}
    </>
  )
}

function SendMediaForm({ config, set, channels, media }: FormProps) {
  return (
    <>
      <Field label="Post to channel (required)">
        <ChannelSelect
          channels={channels}
          value={asString(config.channel_id)}
          onChange={(id) => set({ channel_id: id })}
        />
      </Field>
      <Field label="Media from library">
        <Select
          value={asString(config.media_id)}
          onChange={(e) => set({ media_id: e.target.value || undefined, media_url: e.target.value ? undefined : config.media_url })}
        >
          <option value="">None — use URL below</option>
          {media.map((m) => (
            <option key={m.id} value={m.id}>
              {m.filename || m.id}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="…or media URL">
        <TextInput
          value={asString(config.media_url)}
          placeholder="https://media.giphy.com/…/giphy.gif"
          onChange={(e) => set({ media_url: e.target.value || undefined, media_id: e.target.value ? undefined : config.media_id })}
        />
      </Field>
      <Field label="Caption (optional, supports {variables})">
        <TextInput
          value={asString(config.caption)}
          placeholder="{pair} TP{tp_level} smashed 🚀"
          onChange={(e) => set({ caption: e.target.value || undefined })}
        />
      </Field>
    </>
  )
}

function ForwardMessageForm({ config, set, channels }: FormProps) {
  return (
    <Field label="Forward to channel (required)">
      <ChannelSelect
        channels={channels}
        value={asString(config.channel_id)}
        onChange={(id) => set({ channel_id: id })}
      />
    </Field>
  )
}

interface FormProps {
  config: Config
  set: (patch: Config) => void
  channels: Channel[]
  templates: Template[]
  media: MediaAsset[]
  webhooks: WebhookToken[]
}

const FORMS: Record<string, (p: FormProps) => ReactNode> = {
  'message.received': MessageReceivedForm,
  'outcome.event': OutcomeEventForm,
  'schedule.tick': ScheduleTickForm,
  'webhook.received': WebhookReceivedForm,
  text_match: TextMatchForm,
  channel_filter: ChannelFilterForm,
  field_compare: FieldCompareForm,
  time_window: TimeWindowForm,
  send_message: SendMessageForm,
  send_media: SendMediaForm,
  forward_message: ForwardMessageForm,
}

// ── drawer ────────────────────────────────────────────────────────────────────

export function ConfigDrawer({
  node,
  channels,
  templates,
  media,
  webhooks,
  onConfigChange,
  onDelete,
  onClose,
}: ConfigDrawerProps) {
  const meta = NODE_REGISTRY[node.data.nodeType]
  if (!meta) return null
  const colors = KIND_COLORS[meta.kind]
  const Icon = meta.icon
  const config = node.data.config ?? {}

  const set = (patch: Config) => {
    const next: Config = { ...config, ...patch }
    // strip undefined keys so the saved graph stays clean
    for (const key of Object.keys(next)) {
      if (next[key] === undefined) delete next[key]
    }
    onConfigChange(node.id, next)
  }

  const Form = FORMS[node.data.nodeType]

  return (
    <div
      className="w-80 flex-shrink-0 border-l border-[var(--border)] flex flex-col overflow-hidden"
      style={{ background: 'var(--surface)' }}
    >
      {/* header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border)]">
        <span
          className="flex items-center justify-center rounded-[var(--radius-md)] flex-shrink-0"
          style={{ width: 30, height: 30, background: colors.dim, color: colors.main }}
        >
          <Icon style={{ width: 15, height: 15 }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[var(--text)] truncate" style={{ fontSize: 'var(--text-sm)' }}>
            {meta.label}
          </div>
          <div className="uppercase tracking-wider" style={{ fontSize: 9, color: colors.main }}>
            {KIND_LABELS[meta.kind]}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <p className="text-[var(--text-muted)] leading-relaxed" style={{ fontSize: 'var(--text-xs)' }}>
          {meta.help}
        </p>

        {node.data.error && (
          <div
            className="rounded-[var(--radius-md)] border border-[var(--loss)] px-3 py-2 text-[var(--loss)]"
            style={{ background: 'var(--loss-dim)', fontSize: 'var(--text-xs)' }}
          >
            {node.data.error}
          </div>
        )}

        {Form && (
          <Form
            key={node.id}
            config={config}
            set={set}
            channels={channels}
            templates={templates}
            media={media}
            webhooks={webhooks}
          />
        )}
      </div>

      {/* footer */}
      <div className="px-4 py-3 border-t border-[var(--border)]">
        <Button variant="danger" size="sm" className="w-full" onClick={() => onDelete(node.id)}>
          <Trash2 className="w-3.5 h-3.5" /> Delete node
        </Button>
      </div>
    </div>
  )
}
