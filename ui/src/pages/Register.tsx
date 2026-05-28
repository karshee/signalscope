import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { api } from '../lib/api'
import { useAuthStore } from '../lib/auth'

function getStrength(pw: string): { label: string; score: number; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return { label: 'Weak', score: 1, color: 'var(--loss)' }
  if (score === 2) return { label: 'Fair', score: 2, color: 'var(--active)' }
  if (score === 3) return { label: 'Good', score: 3, color: '#818cf8' }
  if (score === 4) return { label: 'Strong', score: 4, color: 'var(--win)' }
  return { label: 'Very Strong', score: 5, color: 'var(--accent)' }
}

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = password ? getStrength(password) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !confirm) {
      setError('Please fill in all fields.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.register(name, email, password)
      const token = res.data.access_token
      localStorage.setItem('token', token)
      const meRes = await api.auth.me()
      setAuth(meRes.data, token)
      navigate('/app/dashboard')
    } catch {
      setError('Registration failed. This email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2
        className="font-bold text-[var(--text)] mb-1"
        style={{ fontSize: 'var(--text-xl)' }}
      >
        Create account
      </h2>
      <p className="text-[var(--text-muted)] mb-8" style={{ fontSize: 'var(--text-sm)' }}>
        Start tracking your channels free — no credit card needed.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full name"
          type="text"
          placeholder="James Kelvin"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        {/* Password with strength bar */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[var(--text-muted)] font-medium"
            style={{ fontSize: 'var(--text-sm)' }}
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2.5 pr-10 rounded-[var(--radius-md)] border text-[var(--text)] placeholder-[var(--text-faint)] outline-none transition-all bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-dim)]"
              style={{ fontSize: 'var(--text-base)' }}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength indicator */}
          {strength && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4, 5].map((seg) => (
                  <div
                    key={seg}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: seg <= strength.score ? strength.color : 'var(--surface-3)',
                    }}
                  />
                ))}
              </div>
              <span
                className="flex-shrink-0"
                style={{ fontSize: 'var(--text-xs)', color: strength.color }}
              >
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <Input
          label="Confirm password"
          type="password"
          placeholder="Repeat password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          error={confirm && confirm !== password ? 'Passwords do not match' : undefined}
        />

        {error && (
          <div
            className="rounded-[var(--radius-md)] px-3 py-2.5"
            style={{
              background: 'var(--loss-dim)',
              border: '1px solid var(--loss)',
              fontSize: 'var(--text-sm)',
              color: 'var(--loss)',
            }}
          >
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
          Create Account
        </Button>
      </form>

      <p
        className="text-center mt-6 text-[var(--text-muted)]"
        style={{ fontSize: 'var(--text-sm)' }}
      >
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
