import axios from 'axios'

const client = axios.create({
  baseURL: '/',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface User {
  id: string
  email: string
  name: string
  plan: string
}

export interface Channel {
  id: string
  title: string
  username: string
  telegram_id?: number
  is_active: boolean
  avatar_url?: string
  subscriber_count?: number
  quality_score?: number
  quality_tier?: string
  win_rate?: number
  avg_rr?: number
  signal_count?: number
}

export interface Signal {
  id: string
  channel_id: string
  channel_name?: string
  pair: string
  direction: string
  entry_price?: number
  stop_loss?: number
  tp1?: number
  tp2?: number
  tp3?: number
  posted_at: number
  status?: string
  pips_result?: number
  confidence?: number
  raw_text?: string
}

export interface ChannelScore {
  channel_id: string
  window: string
  win_rate?: number
  avg_rr?: number
  entry_accuracy?: number
  quality_score: number
  quality_tier: string
  signal_count: number
}

export interface LeaderboardEntry extends ChannelScore {
  title: string
  username: string
}

export interface Template {
  id: string
  name: string
  body: string
  parse_mode: string
  media_id?: string | null
  media_url?: string | null
  created_at: number
  updated_at: number
}

export interface RuleNode {
  id: string
  type: 'trigger' | 'condition' | 'action'
  position: { x: number; y: number }
  data: { nodeType: string; config: Record<string, unknown> }
}

export interface RuleEdge {
  id: string
  source: string
  target: string
}

export interface RuleGraph {
  nodes: RuleNode[]
  edges: RuleEdge[]
}

export interface Rule {
  id: string
  name: string
  description?: string | null
  is_enabled: boolean
  graph: RuleGraph
  trigger_type: string
  rate_limit_per_min: number
  last_fired_at?: number | null
  executions_24h?: number
  created_at: number
  updated_at: number
}

export interface CompileNodeError {
  node_id: string | null
  message: string
}

export interface ExecutionStep {
  node_id?: string
  kind: 'condition' | 'action'
  type: string
  passed?: boolean
  detail?: Record<string, unknown>
}

export interface Execution {
  id: string
  rule_id: string
  rule_name?: string
  event_type: string
  status: string
  detail?: { steps?: ExecutionStep[]; actions_run?: number; error?: string } | null
  duration_ms?: number
  created_at: number
}

export interface WebhookToken {
  id: string
  name: string
  token: string
  is_active: boolean
  last_used_at?: number | null
  created_at: number
}

export interface MediaAsset {
  id: string
  kind: string
  filename?: string
  mime?: string
  size_bytes?: number
  telegram_file_id?: string | null
  created_at: number
}

export interface ChannelMessage {
  id: string
  channel_id: string
  message_id: number
  sender_name?: string
  text?: string
  has_media: boolean | number
  media_type?: string | null
  posted_at: number
  is_self_sent: boolean | number
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      client.post<{ access_token: string }>('/api/auth/login', { email, password }),
    register: (name: string, email: string, password: string) =>
      client.post<{ access_token: string }>('/api/auth/register', { name, email, password }),
    logout: () => client.post('/api/auth/logout'),
    me: () => client.get<User>('/api/auth/me'),
    updateProfile: (data: { name?: string; email?: string }) =>
      client.put<User>('/api/auth/me', data),
    changePassword: (current_password: string, new_password: string) =>
      client.post('/api/auth/change-password', { current_password, new_password }),
    deleteAccount: () => client.delete('/api/auth/me'),
  },
  channels: {
    list: () => client.get<Channel[]>('/api/channels'),
    get: (id: string) => client.get<Channel>(`/api/channels/${id}`),
    create: (data: { username: string; title: string; telegram_id?: number }) =>
      client.post<Channel>('/api/channels', data),
    update: (id: string, data: Partial<Channel>) =>
      client.put<Channel>(`/api/channels/${id}`, data),
    delete: (id: string) => client.delete(`/api/channels/${id}`),
  },
  signals: {
    list: (params?: { channel_id?: string; limit?: number; offset?: number }) =>
      client.get<Signal[]>('/api/signals', { params }),
    get: (id: string) => client.get<Signal>(`/api/signals/${id}`),
    statsToday: () =>
      client.get<{ total_today: number; active: number }>('/api/signals/stats/today'),
  },
  scores: {
    list: () => client.get<ChannelScore[]>('/api/scores'),
    leaderboard: (params?: { window?: string; min_signals?: number }) =>
      client.get<LeaderboardEntry[]>('/api/scores/leaderboard', { params }),
    channel: (id: string) => client.get<ChannelScore>(`/api/scores/channel/${id}`),
  },
  settings: {
    get: () => client.get('/api/settings'),
    update: (data: Record<string, unknown>) => client.put('/api/settings', data),
    testTelegram: () =>
      client.post<{ connected: boolean; message: string }>('/api/settings/telegram/test'),
    testBot: () =>
      client.post<{ connected: boolean; message: string; bot_username?: string }>(
        '/api/settings/telegram/bot/test'
      ),
    testMt5: () =>
      client.post<{ connected: boolean; message: string }>('/api/settings/mt5/test'),
  },
  templates: {
    list: () => client.get<Template[]>('/api/templates'),
    get: (id: string) => client.get<Template>(`/api/templates/${id}`),
    create: (data: Partial<Template>) => client.post<Template>('/api/templates', data),
    update: (id: string, data: Partial<Template>) =>
      client.put(`/api/templates/${id}`, data),
    delete: (id: string) => client.delete(`/api/templates/${id}`),
    preview: (id: string, context?: Record<string, unknown>) =>
      client.post<{ rendered: string; warnings: string[] }>(
        `/api/templates/${id}/preview`, context ?? {}
      ),
  },
  rules: {
    list: () => client.get<Rule[]>('/api/rules'),
    get: (id: string) => client.get<Rule>(`/api/rules/${id}`),
    create: (data: { name: string; description?: string; graph: RuleGraph; is_enabled?: boolean; rate_limit_per_min?: number }) =>
      client.post<{ id: string; trigger_type: string }>('/api/rules', data),
    update: (id: string, data: { name: string; description?: string; graph: RuleGraph; is_enabled?: boolean; rate_limit_per_min?: number }) =>
      client.put(`/api/rules/${id}`, data),
    delete: (id: string) => client.delete(`/api/rules/${id}`),
    enable: (id: string) => client.post(`/api/rules/${id}/enable`),
    disable: (id: string) => client.post(`/api/rules/${id}/disable`),
    test: (id: string, fire?: { event_type?: string; data?: Record<string, unknown>; channel_id?: string }) =>
      client.post<{ status: string; reason?: string; trace?: { steps: ExecutionStep[]; actions_run: number; error?: string } }>(
        `/api/rules/${id}/test`, fire ?? {}
      ),
  },
  executions: {
    list: (params?: { rule_id?: string; status?: string; limit?: number; offset?: number }) =>
      client.get<Execution[]>('/api/executions', { params }),
    stats: () =>
      client.get<{
        total_24h: number; success_24h: number; errors_24h: number
        active_rules: number; sent_7d: number
      }>('/api/executions/stats'),
  },
  webhooks: {
    list: () => client.get<WebhookToken[]>('/api/webhooks'),
    create: (name: string) => client.post<WebhookToken>('/api/webhooks', { name }),
    rotate: (id: string) => client.post<{ id: string; token: string }>(`/api/webhooks/${id}/rotate`),
    delete: (id: string) => client.delete(`/api/webhooks/${id}`),
  },
  media: {
    list: () => client.get<MediaAsset[]>('/api/media'),
    upload: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return client.post<MediaAsset>('/api/media', form)
    },
    fileUrl: (id: string) =>
      `/api/media/${id}/file?token=${localStorage.getItem('token') ?? ''}`,
    delete: (id: string) => client.delete(`/api/media/${id}`),
  },
  messages: {
    list: (channelId: string, params?: { limit?: number; before?: number }) =>
      client.get<ChannelMessage[]>(`/api/channels/${channelId}/messages`, { params }),
    send: (channelId: string, data: { template_id?: string; text?: string; media_id?: string }) =>
      client.post<{ sent: boolean; message_id?: number }>(`/api/channels/${channelId}/send`, data),
  },
  admin: {
    status: () =>
      client.get<{
        watcher_running: boolean
        watcher_status: string
        watcher_error: string | null
        signal_count: number
        channel_count: number
      }>('/api/admin/status'),
  },
}
