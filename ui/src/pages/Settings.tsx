import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { AppShell } from '../components/layout/AppShell'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../lib/auth'
import { api } from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

type Tab = 'account' | 'telegram' | 'mt5' | 'notifications' | 'billing'

const tabs: { key: Tab; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'mt5', label: 'MT5' },
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

function TelegramTab() {
  const { toast } = useToast()
  const [apiId, setApiId] = useState('')
  const [apiHash, setApiHash] = useState('')
  const [phone, setPhone] = useState('')
  const [showHash, setShowHash] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null)
  const [saving, setSaving] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await api.settings.testTelegram()
      setTestResult('ok')
      toast('Telegram connection OK', 'success')
    } catch {
      setTestResult('fail')
      toast('Telegram connection failed', 'error')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.settings.update({ telegram: { api_id: apiId, api_hash: apiHash, phone } })
      toast('Telegram credentials saved', 'success')
    } catch {
      toast('Failed to save credentials', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <Section title="Telegram Connection">
        <div className="flex items-center gap-2 mb-5 p-3 rounded-[var(--radius-md)]"
          style={{ background: 'var(--surface-2)' }}>
          <span className={clsx('w-2 h-2 rounded-full', testResult === 'ok' ? 'bg-[var(--win)]' : testResult === 'fail' ? 'bg-[var(--loss)]' : 'bg-[var(--expired)]')} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            {testResult === 'ok' ? 'Connected' : testResult === 'fail' ? 'Connection failed' : 'Not configured'}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <Input label="API ID" value={apiId} onChange={(e) => setApiId(e.target.value)} placeholder="12345678" />

          <div className="flex flex-col gap-1.5">
            <label className="text-[var(--text-muted)] font-medium" style={{ fontSize: 'var(--text-sm)' }}>
              API Hash
            </label>
            <div className="relative">
              <input
                type={showHash ? 'text' : 'password'}
                value={apiHash}
                onChange={(e) => setApiHash(e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full px-3 py-2.5 pr-10 rounded-[var(--radius-md)] border text-[var(--text)] placeholder-[var(--text-faint)] outline-none transition-all bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-dim)]"
                style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-mono)' }}
              />
              <button type="button" onClick={() => setShowHash((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                {showHash ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+447700900123" />

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} loading={saving}>Save</Button>
            <Button variant="ghost" onClick={handleTest} loading={testing}>
              {testResult === 'ok' && <CheckCircle className="w-4 h-4 text-[var(--win)]" />}
              {testResult === 'fail' && <AlertCircle className="w-4 h-4 text-[var(--loss)]" />}
              Test Connection
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )
}

// ── MT5 Tab ───────────────────────────────────────────────────────────────────

function Mt5Tab() {
  const { toast } = useToast()
  const [enabled, setEnabled] = useState(false)
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [server, setServer] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null)
  const [riskPct, setRiskPct] = useState('1')
  const [copyMode, setCopyMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await api.settings.testMt5()
      setTestResult('ok')
      toast('MT5 connection OK', 'success')
    } catch {
      setTestResult('fail')
      toast('MT5 connection failed', 'error')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.settings.update({ mt5: { enabled, login, password, server, risk_pct: riskPct, copy_mode: copyMode } })
      toast('MT5 settings saved', 'success')
    } catch {
      toast('Failed to save MT5 settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <Section title="MT5 Integration">
        {/* Enable toggle */}
        <div className="flex items-center justify-between mb-5 p-3 rounded-[var(--radius-md)]"
          style={{ background: 'var(--surface-2)' }}>
          <div>
            <div className="font-medium text-[var(--text)]" style={{ fontSize: 'var(--text-sm)' }}>
              Enable MT5
            </div>
            <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
              Connect to your MT5 account for live price tracking
            </div>
          </div>
          <button
            onClick={() => setEnabled((e) => !e)}
            className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
            style={{ background: enabled ? 'var(--accent)' : 'var(--surface-3)' }}
          >
            <div
              className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
              style={{ left: enabled ? '24px' : '4px' }}
            />
          </button>
        </div>

        <div className={clsx('flex flex-col gap-4', !enabled && 'opacity-50 pointer-events-none')}>
          <Input label="MT5 Login" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="12345678" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <Input label="Server" value={server} onChange={(e) => setServer(e.target.value)} placeholder="ICMarkets-Demo" />
        </div>
      </Section>

      <Section title="Risk Settings">
        <div className={clsx('flex flex-col gap-4', !enabled && 'opacity-50 pointer-events-none')}>
          <div>
            <label className="text-[var(--text-muted)] font-medium block mb-1.5" style={{ fontSize: 'var(--text-sm)' }}>
              Risk per trade (%)
            </label>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
              className="w-32 px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
              style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[var(--text)]" style={{ fontSize: 'var(--text-sm)' }}>
                Copy mode
              </div>
              <div className="text-[var(--text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
                Auto-execute signals on your MT5 account
              </div>
            </div>
            <button
              onClick={() => setCopyMode((c) => !c)}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ background: copyMode ? 'var(--accent)' : 'var(--surface-3)' }}
            >
              <div
                className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                style={{ left: copyMode ? '24px' : '4px' }}
              />
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} loading={saving} disabled={!enabled}>Save</Button>
            <Button variant="ghost" onClick={handleTest} loading={testing} disabled={!enabled}>
              {testResult === 'ok' && <CheckCircle className="w-4 h-4 text-[var(--win)]" />}
              {testResult === 'fail' && <AlertCircle className="w-4 h-4 text-[var(--loss)]" />}
              Test Connection
            </Button>
          </div>
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
        {tab === 'mt5' && <Mt5Tab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'billing' && <BillingTab />}
      </div>
    </AppShell>
  )
}
