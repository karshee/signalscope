import {
  CalendarClock,
  Filter,
  Forward,
  Hourglass,
  Image,
  MessageSquare,
  Scale,
  Send,
  Target,
  TextSearch,
  Webhook,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NodeKind = 'trigger' | 'condition' | 'action'

/** id → display name maps used to render human-readable config summaries */
export interface Lookups {
  channels: Record<string, string>
  templates: Record<string, string>
  media: Record<string, string>
  webhooks: Record<string, string>
}

export const EMPTY_LOOKUPS: Lookups = { channels: {}, templates: {}, media: {}, webhooks: {} }

export interface NodeMeta {
  type: string
  kind: NodeKind
  label: string
  icon: LucideIcon
  /** Helper text shown in the config drawer */
  help: string
  defaultConfig: Record<string, unknown>
  /** One-line config summary shown inside the canvas node */
  summary: (config: Record<string, unknown>, lookups: Lookups) => string
}

export const KIND_COLORS: Record<NodeKind, { main: string; dim: string; glow: string }> = {
  trigger: { main: 'var(--node-trigger)', dim: 'var(--accent-dim)', glow: 'rgba(0, 229, 179, 0.30)' },
  condition: { main: 'var(--node-condition)', dim: 'var(--active-dim)', glow: 'rgba(255, 178, 36, 0.30)' },
  action: { main: 'var(--node-action)', dim: 'var(--pending-dim)', glow: 'rgba(129, 140, 248, 0.30)' },
}

export const KIND_LABELS: Record<NodeKind, string> = {
  trigger: 'Trigger',
  condition: 'Condition',
  action: 'Action',
}

export const TEMPLATE_VARIABLES = [
  'pair', 'direction', 'tp_level', 'pips', 'rr', 'outcome',
  'text', 'channel_title', 'date', 'time', 'webhook.field',
]

export const CRON_PRESETS = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at 9am', value: '0 9 * * *' },
  { label: 'Weekdays at 8am', value: '0 8 * * 1-5' },
]

/** 0 = Monday … 6 = Sunday (backend convention) */
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const FIELD_HINTS = ['pair', 'tp_level', 'pips', 'outcome', 'webhook.*']

const truncate = (s: string, n = 36) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

function channelNames(ids: unknown, lookups: Lookups): string {
  if (!Array.isArray(ids) || ids.length === 0) return ''
  return ids.map((id) => lookups.channels[String(id)] ?? String(id)).join(', ')
}

function channelName(id: unknown, lookups: Lookups): string {
  if (!id) return ''
  return lookups.channels[String(id)] ?? String(id)
}

export const NODE_REGISTRY: Record<string, NodeMeta> = {
  // ── Triggers ──────────────────────────────────────────────────────────────
  'message.received': {
    type: 'message.received',
    kind: 'trigger',
    label: 'New message',
    icon: MessageSquare,
    help: 'Fires every time a new message arrives in your monitored channels. Leave channels empty to listen everywhere.',
    defaultConfig: {},
    summary: (c, l) => {
      const ch = channelNames(c.channel_ids, l)
      return truncate(ch ? `in ${ch}` : 'any channel')
    },
  },
  'outcome.event': {
    type: 'outcome.event',
    kind: 'trigger',
    label: 'TP / SL hit',
    icon: Target,
    help: 'Fires when a tracked signal hits a take-profit or stop-loss level.',
    defaultConfig: {},
    summary: (c, l) => {
      const events = Array.isArray(c.events) ? (c.events as string[]) : []
      const parts: string[] = []
      const labels = events.map((e) => (e === 'tp_hit' ? 'TP hit' : e === 'sl_hit' ? 'SL hit' : e))
      parts.push(labels.length ? labels.join(' / ') : 'TP or SL')
      if (typeof c.min_tp_level === 'number') parts.push(`TP≥${c.min_tp_level}`)
      const ch = channelNames(c.channel_ids, l)
      if (ch) parts.push(`in ${ch}`)
      return truncate(parts.join(' · '))
    },
  },
  'schedule.tick': {
    type: 'schedule.tick',
    kind: 'trigger',
    label: 'Schedule',
    icon: CalendarClock,
    help: 'Fires on a fixed schedule (5-field cron, server timezone). Pick a preset or write your own.',
    defaultConfig: { cron: '0 * * * *' },
    summary: (c) => {
      const cron = typeof c.cron === 'string' ? c.cron : ''
      const preset = CRON_PRESETS.find((p) => p.value === cron)
      return preset ? preset.label.toLowerCase() : cron || 'no schedule set'
    },
  },
  'webhook.received': {
    type: 'webhook.received',
    kind: 'trigger',
    label: 'Webhook',
    icon: Webhook,
    help: 'Fires when an HTTP request hits one of your webhook URLs. Payload fields are available as {webhook.field}.',
    defaultConfig: {},
    summary: (c, l) => {
      const id = c.token_id ? String(c.token_id) : ''
      return truncate(id ? (l.webhooks[id] ?? id) : 'any token')
    },
  },

  // ── Conditions ────────────────────────────────────────────────────────────
  text_match: {
    type: 'text_match',
    kind: 'condition',
    label: 'Text match',
    icon: TextSearch,
    help: 'Only continue if the message text matches. Use regex mode for advanced patterns.',
    defaultConfig: { mode: 'contains', value: '' },
    summary: (c) => {
      const mode = typeof c.mode === 'string' ? c.mode : 'contains'
      const value = typeof c.value === 'string' ? c.value : ''
      return truncate(value ? `${mode} "${value}"` : `${mode} …`)
    },
  },
  channel_filter: {
    type: 'channel_filter',
    kind: 'condition',
    label: 'Channel filter',
    icon: Filter,
    help: 'Only continue if the event came from one of the selected channels.',
    defaultConfig: { channel_ids: [] },
    summary: (c, l) => {
      const ch = channelNames(c.channel_ids, l)
      return truncate(ch || 'no channels selected')
    },
  },
  field_compare: {
    type: 'field_compare',
    kind: 'condition',
    label: 'Field compare',
    icon: Scale,
    help: `Compare an event field against a value. Common fields: ${FIELD_HINTS.join(', ')}.`,
    defaultConfig: { field: '', op: '==', value: '' },
    summary: (c) => {
      const field = typeof c.field === 'string' ? c.field : ''
      const op = typeof c.op === 'string' ? c.op : '=='
      const value = Array.isArray(c.value) ? c.value.join(', ') : String(c.value ?? '')
      return truncate(field ? `${field} ${op} ${value}` : 'not configured')
    },
  },
  time_window: {
    type: 'time_window',
    kind: 'condition',
    label: 'Time window',
    icon: Hourglass,
    help: 'Only continue inside the chosen days and hours. Leave fields empty for "any".',
    defaultConfig: {},
    summary: (c) => {
      const parts: string[] = []
      if (Array.isArray(c.days) && c.days.length > 0 && c.days.length < 7) {
        parts.push((c.days as number[]).map((d) => DAY_LABELS[d] ?? String(d)).join(' '))
      }
      if (c.start || c.end) parts.push(`${c.start ?? '00:00'}–${c.end ?? '23:59'}`)
      return truncate(parts.join(' · ') || 'always')
    },
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  send_message: {
    type: 'send_message',
    kind: 'action',
    label: 'Post message',
    icon: Send,
    help: 'Post to a target channel using a saved template, or write the text inline with {variables}.',
    defaultConfig: { channel_id: '' },
    summary: (c, l) => {
      const ch = channelName(c.channel_id, l)
      const tpl = c.template_id ? (l.templates[String(c.template_id)] ?? 'template') : ''
      const text = typeof c.text === 'string' ? c.text : ''
      const what = tpl || (text ? `"${text}"` : '')
      if (!ch) return 'pick a channel'
      return truncate(what ? `→ ${ch} · ${what}` : `→ ${ch}`)
    },
  },
  send_media: {
    type: 'send_media',
    kind: 'action',
    label: 'Post GIF / media',
    icon: Image,
    help: 'Post a GIF, image, or video to a target channel, with an optional caption.',
    defaultConfig: { channel_id: '' },
    summary: (c, l) => {
      const ch = channelName(c.channel_id, l)
      const media = c.media_id
        ? (l.media[String(c.media_id)] ?? 'media')
        : typeof c.media_url === 'string' && c.media_url
          ? 'URL'
          : ''
      if (!ch) return 'pick a channel'
      return truncate(media ? `→ ${ch} · ${media}` : `→ ${ch}`)
    },
  },
  forward_message: {
    type: 'forward_message',
    kind: 'action',
    label: 'Forward message',
    icon: Forward,
    help: 'Copy the triggering message to a target channel. The bot must be admin in BOTH channels — and this only works with message triggers.',
    defaultConfig: { channel_id: '' },
    summary: (c, l) => {
      const ch = channelName(c.channel_id, l)
      return truncate(ch ? `→ ${ch}` : 'pick a channel')
    },
  },
}

export interface PaletteGroup {
  kind: NodeKind
  title: string
  symbol: string
  types: string[]
}

export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    kind: 'trigger',
    title: 'Triggers',
    symbol: '⚡',
    types: ['message.received', 'outcome.event', 'schedule.tick', 'webhook.received'],
  },
  {
    kind: 'condition',
    title: 'Conditions',
    symbol: '◆',
    types: ['text_match', 'channel_filter', 'field_compare', 'time_window'],
  },
  {
    kind: 'action',
    title: 'Actions',
    symbol: '▶',
    types: ['send_message', 'send_media', 'forward_message'],
  },
]
