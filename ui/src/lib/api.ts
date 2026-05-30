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
    testTelegram: () => client.post('/api/settings/telegram/test'),
    testMt5: () => client.post('/api/settings/mt5/test'),
  },
}
