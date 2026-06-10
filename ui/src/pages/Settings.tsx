import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { AppShell } from '../components/layout/AppShell'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../lib/auth'
import { api, type WebhookToken } from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { CheckCircle, AlertCircle } from 'lucide-react'

type Tab = 'account' | 'telegram' | 'webhooks' | 'notifications' | 'billing'

const tabs: { key: Tab; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'webhooks', label: 'Webhooks' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'billing', label: 'Billing' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden"
      style={{ background: 'var(--surface)' }}
    >
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text)]" style={{ fontSize: 'var(--text-md)' }}>
          {title}
        </h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Account Tab ───────────────────────────────────────────────────────────────

function AccountTab() {
  const { user, setAuth, clearAuth } = useAuthStore()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.auth.updateProfile({ name, email })
      setAuth(res.data, localStorage.getItem('token') || '')
      toast('Profile updated', 'success')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to update profile'
      toast(typeof msg === 'string' ? msg : 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPw.length < 8) { toast('New password must be at least 8 characters', 'error'); return }
    if (newPw !== confirmPw) { toast('Passwords do not match', 'error'); return }
    setChangingPw(true)
    try {
      await api.auth.changePassword(currentPw, newPw)
      toast('Password updated', 'success')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to change password'
      toast(typeof msg === 'string' ? msg : 'Failed to change password', 'error')
    } finally {
      setChangingPw(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.auth.deleteAccount()
      clearAuth()
    } catch {
      toast('Failed to delete account. Try again.', 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <Section title="Profile">
        <div className="flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={handleSave} loading={saving} className="self-start">
            Save Changes
          </Button>
        </div>
      </Section>

      <Section title="Change Password">
        <div className="flex flex-col gap-4">
          <Input label="Current password" type="password" placeholder="••••••••" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          <Input label="New password" type="password" placeholder="Min. 8 characters" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          <Input label="Confirm new password" type="password" placeholder="Repeat new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          <Button onClick={handleChangePassword} loading={changingPw} className="self-start">
            Update Password
          </Button>
        </div>
      </Section>

      <Section title="Danger Zone">
        <div
          className="rounded-[var(--radius-md)] border border-[var(--loss)] p-4"
          style={{ background: 'var(--loss-dim)' }}
        >
          <p className="text-[var(--text)] mb-3" style={{ fontSize: 'var(--text-sm)' }}>
            Permanently delete your account and all data. This cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              Delete Account
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[var(--loss)]" style={{ fontSize: 'var(--text-sm)' }}>
                Type <strong>DELETE</strong> to confirm:
              </p>
              <Input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
              />
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  disabled={deleteInput !== 'DELETE'}
                  loading={deleting}
                  onClick={handleDelete}
                >
                  Confirm Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

// ── Telegram Tab ──────────────────────────────────────────────────────────────

type WatcherStatus = 'running' | 'unconfigured' | 'starting' | 'error' | 'stopped' | null

function TelegramTab() {
  const { toast } = useToast()
  const [watcherStatus, setWatcherStatus] = useState<WatcherStatus>(null)
  const [watcherError, setWatcherError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(true)

  useEffect(() => {
    api.admin.status()
      .then((res) => {
        setWatcherStatus(res.data.watcher_status as WatcherStatus)
        setWatcherError(res.data.watcher_error || null)
      })
      .catch(() => setWatcherStatus('stopped'))
      .finally(() => setLoadingStatus(false))
  }, [])

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await api.settings.testTelegram()
      if (res.data.connected) {
        setWatcherStatus('running')
        toast(res.data.message || 'Telegram connection OK', 'success')
      } else {
        toast(res.data.message || 'Connection failed', 'error')
      }
    } catch {
      toast('Test request failed', 'error')
    } finally {
      setTesting(false)
    }
  }

  const dotClass = watcherStatus === 'running'
    ? 'bg-[var(--win)]'
    : watcherStatus === 'error'
      ? 'bg-[var(--loss)]'
      : watcherStatus === 'starting'
        ? 'bg-yellow-400'
        : 'bg-[var(--expired)]'

  const statusLabel = watcherStatus === 'running'
    ? 'Watcher running — signals are being collected'
    : watcherStatus === 'starting'
      ? 'Watcher starting…'
      : watcherStatus === 'error'
        ? `Error: ${watcherError || 'unknown'}`
        : watcherStatus === 'unconfigured'
          ? 'Not configured — set TELEGRAM_* env vars on the server'
          : loadingStatus
            ? 'Checking…'
            : 'Stopped'

  // ── Posting bot (write credential) ──────────────────────────────────────────
  const [botToken, setBotToken] = useState('')
  const [botMasked, setBotMasked] = useState<string | null>(null)
  const [botSaving, setBotSaving] = useState(false)
  const [botTesting, setBotTesting] = useState(false)
  const [botStatus, setBotStatus] = useState<string | null>(null)

  useEffect(() => {
    api.settings.get().then((res) => {
      setBotMasked(res.data?.telegram?.bot_token_masked ?? null)
    }).catch(() => {})
  }, [])

  const saveBotToken = async () => {
    if (!botToken.trim()) return
    setBotSaving(true)
    try {
      await api.settings.update({ telegram: { bot_token: botToken.trim() } })
      const res = await api.settings.get()
      setBotMasked(res.data?.telegram?.bot_token_masked ?? null)
      setBotToken('')
      toast('Bot token saved', 'success')
    } catch {
      toast('Failed to save bot token', 'error')
    } finally {
      setBotSaving(false)
    }
  }

  const testBot = async () => {
    setBotTesting(true)
    setBotStatus(null)
    try {
      const res = await api.settings.testBot()
      setBotStatus(res.data.message)
      toast(res.data.message, res.data.connected ? 'success' : 'error')
    } catch {
      toast('Bot test failed', 'error')
    } finally {
      setBotTesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <Section title="Posting Bot (sends your messages)">
        <p className="text-[var(--text-muted)] mb-4" style={{ fontSize: 'var(--text-sm)' }}>
          Tapwire posts to your channels through your own Telegram bot. Two-minute setup:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 mb-5"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          <li>Open <a href="https://t.me/BotFather" target="_blank" rel="noreferrer"
            className="text-[var(--accent)] hover:underline">@BotFather</a> and send <code className="font-mono">/newbot</code></li>
          <li>Copy the token it gives you and paste it below</li>
          <li>Add your bot as an <strong>admin</strong> in every channel it should post to</li>
        </ol>
        {botMasked && (
          <div className="flex items-center gap-2 mb-3 p-3 rounded-[var(--radius-md)]"
            style={{ background: 'var(--surface-2)' }}>
            <CheckCircle className="w-4 h-4 text-[var(--win)] flex-shrink-0" />
            <span className="font-mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              Token saved: {botMasked}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <Input
            label={botMasked ? 'Replace bot token' : 'Bot token'}
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="123456789:AAH-your-bot-token"
          />
          <div className="flex gap-2">
            <Button onClick={saveBotToken} loading={botSaving} disabled={!botToken.trim()}>
              Save Token
            </Button>
            <Button variant="ghost" onClick={testBot} loading={botTesting} disabled={!botMasked && !botToken}>
              Verify Bot
            </Button>
          </div>
          {botStatus && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{botStatus}</p>
          )}
        </div>
      </Section>

      <Section title="Reading (watches your channels)">
        <div className="flex items-center gap-2 mb-5 p-3 rounded-[var(--radius-md)]"
          style={{ background: 'var(--surface-2)' }}>
          <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', dotClass)} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            {statusLabel}
          </span>
        </div>

        <Button variant="ghost" onClick={handleTest} loading={testing} className="mb-5">
          {watcherStatus === 'running'
            ? <><CheckCircle className="w-4 h-4 text-[var(--win)]" />&nbsp;Re-test Connection</>
            : <><AlertCircle className="w-4 h-4" />&nbsp;Test Connection</>
          }
        </Button>

        <div
          className="rounded-[var(--radius-md)] border border-[var(--border)] p-4"
          style={{ background: 'var(--surface-2)' }}
        >
          <p className="font-medium text-[var(--text)] mb-2" style={{ fontSize: 'var(--text-sm)' }}>
            Server configuration
          </p>
          <p className="mb-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Telegram credentials are loaded from server environment variables.
            Set these in your <code className="font-mono">.env</code> file or deployment config:
          </p>
          <ul className="list-disc list-inside space-y-1 font-mono mb-2"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            <li>TELEGRAM_API_ID</li>
            <li>TELEGRAM_API_HASH</li>
            <li>TELEGRAM_SESSION</li>
          </ul>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            See <code className="font-mono">.env.example</code> for how to generate a session string.
          </p>
        </div>
      </Section>
    </div>
  )
}

// ── Webhooks Tab ──────────────────────────────────────────────────────────────

function WebhooksTab() {
  const { toast } = useToast()
  const [tokens, setTokens] = useState<WebhookToken[]>([])
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => api.webhooks.list().then((res) => setTokens(res.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      await api.webhooks.create(name.trim())
      setName('')
      await load()
      toast('Webhook created', 'success')
    } catch {
      toast('Failed to create webhook', 'error')
    } finally {
      setCreating(false)
    }
  }

  const rotate = async (id: string) => {
    await api.webhooks.rotate(id)
    await load()
    toast('Token rotated — update your integrations', 'success')
  }

  const remove = async (id: string) => {
    await api.webhooks.delete(id)
    await load()
  }

  const curlFor = (token: string) =>
    `curl -X POST ${window.location.origin}/api/webhooks/ingest/${token} \\
  -H 'Content-Type: application/json' \\
  -d '{"event": "tp_hit", "pair": "XAUUSD", "tp_level": 2, "pips": 150}'`

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title="Inbound Webhooks">
        <p className="text-[var(--text-muted)] mb-4" style={{ fontSize: 'var(--text-sm)' }}>
          Let external systems (trade watchers, CRMs, scripts) trigger your automations.
          Each POST becomes a <code className="font-mono">Webhook</code> event; body fields are
          available in templates as <code className="font-mono">{'{webhook.field}'}</code>.
        </p>
        <div className="flex gap-2 mb-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. signal-watcher)"
            className="flex-1 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
            style={{ fontSize: 'var(--text-sm)' }}
          />
          <Button onClick={create} loading={creating} disabled={!name.trim()}>Create</Button>
        </div>

        <div className="flex flex-col gap-4">
          {tokens.map((t) => (
            <div key={t.id} className="rounded-[var(--radius-md)] border border-[var(--border)] p-4"
              style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[var(--text)]" style={{ fontSize: 'var(--text-sm)' }}>
                  {t.name}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    navigator.clipboard.writeText(curlFor(t.token))
                    toast('curl example copied', 'success')
                  }}>Copy curl</Button>
                  <Button variant="ghost" size="sm" onClick={() => rotate(t.id)}>Rotate</Button>
                  <Button variant="danger" size="sm" onClick={() => remove(t.id)}>Delete</Button>
                </div>
              </div>
              <pre className="overflow-x-auto p-3 rounded-[var(--radius-sm)] font-mono"
                style={{ background: 'var(--bg)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {curlFor(t.token)}
              </pre>
              {t.last_used_at && (
                <div className="mt-2 text-[var(--text-faint)]" style={{ fontSize: 'var(--text-xs)' }}>
                  Last used {new Date(t.last_used_at * 1000).toLocaleString()}
                </div>
              )}
            </div>
          ))}
          {tokens.length === 0 && (
            <p className="text-[var(--text-faint)]" style={{ fontSize: 'var(--text-sm)' }}>
              No webhooks yet.
            </p>
          )}
        </div>
      </Section>
    </div>
  )
}

// ── Notifications Tab ─────────────────────────────────────────────────────────

const NOTIF_EVENTS = ['New signal', 'Outcome resolved', 'Score changed', 'Weekly digest']
const NOTIF_CHANNELS = ['Telegram', 'Email', 'Browser']

function NotificationsTab() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>(() => {
    const m: Record<string, Record<string, boolean>> = {}
    for (const ev of NOTIF_EVENTS) {
      m[ev] = {}
      for (const ch of NOTIF_CHANNELS) {
        m[ev][ch] = ev === 'New signal' && ch === 'Telegram'
      }
    }
    return m
  })

  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const toggle = (ev: string, ch: string) => {
    setMatrix((prev) => ({
      ...prev,
      [ev]: { ...prev[ev], [ch]: !prev[ev][ch] },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.settings.update({ notifications: matrix })
      toast('Notification preferences saved', 'success')
    } catch {
      toast('Failed to save preferences', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title="Notification Preferences">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-3 pr-4 font-medium" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  Event
                </th>
                {NOTIF_CHANNELS.map((ch) => (
                  <th key={ch} className="text-center px-4 py-3 font-medium" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                    {ch}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NOTIF_EVENTS.map((ev) => (
                <tr key={ev} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-3 pr-4 text-[var(--text)]" style={{ fontSize: 'var(--text-sm)' }}>
                    {ev}
                  </td>
                  {NOTIF_CHANNELS.map((ch) => (
                    <td key={ch} className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(ev, ch)}
                        className={clsx(
                          'w-5 h-5 rounded flex items-center justify-center border transition-colors mx-auto',
                          matrix[ev]?.[ch]
                            ? 'bg-[var(--accent)] border-[var(--accent)]'
                            : 'bg-transparent border-[var(--border)] hover:border-[var(--accent)]'
                        )}
                      >
                        {matrix[ev]?.[ch] && (
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#0a0a0b" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button onClick={handleSave} loading={saving} className="mt-5">
          Save Preferences
        </Button>
      </Section>
    </div>
  )
}

// ── Billing Tab ───────────────────────────────────────────────────────────────

function BillingTab() {
  const { user } = useAuthStore()

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <Section title="Current Plan">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-[var(--text)] capitalize" style={{ fontSize: 'var(--text-xl)' }}>
              {user?.plan || 'Free'} Plan
            </div>
            <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
              {user?.plan === 'free' ? 'Up to 3 channels, 30-day history' : 'Full access'}
            </div>
          </div>
          <span
            className="px-3 py-1.5 rounded-[var(--radius-md)] font-medium capitalize"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {user?.plan || 'free'}
          </span>
        </div>
        {user?.plan === 'free' && (
          <div
            className="rounded-[var(--radius-md)] border border-[var(--accent)] p-4 mb-4"
            style={{ background: 'var(--accent-dim)' }}
          >
            <div className="font-semibold text-[var(--text)] mb-1" style={{ fontSize: 'var(--text-sm)' }}>
              Upgrade to Pro — £19/mo
            </div>
            <p className="text-[var(--text-muted)] mb-3" style={{ fontSize: 'var(--text-sm)' }}>
              25 channels, unlimited history, MT5 integration, CSV export.
            </p>
            <Button size="sm">Upgrade Now</Button>
          </div>
        )}
      </Section>

      {user?.plan !== 'free' && (
        <Section title="Billing">
          <p className="text-[var(--text-muted)] mb-4" style={{ fontSize: 'var(--text-sm)' }}>
            Manage your subscription, download invoices, or cancel your plan.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost">Manage Subscription</Button>
            <Button variant="ghost">Download Invoices</Button>
          </div>
        </Section>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  const [tab, setTab] = useState<Tab>('account')

  return (
    <AppShell>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Tab nav */}
        <div className="flex gap-1 mb-8 border-b border-[var(--border)]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                'px-4 py-2.5 font-medium transition-colors relative',
                tab === t.key
                  ? 'text-[var(--accent)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
              style={{ fontSize: 'var(--text-sm)' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'account' && <AccountTab />}
        {tab === 'telegram' && <TelegramTab />}
        {tab === 'webhooks' && <WebhooksTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'billing' && <BillingTab />}
      </div>
    </AppShell>
  )
}
