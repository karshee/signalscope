import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { api } from '../lib/api'
import { useAuthStore } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.login(email, password)
      const token = res.data.access_token
      // Fetch user info
      const tmpToken = token
      localStorage.setItem('token', tmpToken)
      const meRes = await api.auth.me()
      setAuth(meRes.data, token)
      navigate('/app/dashboard')
    } catch {
      setError('Invalid email or password.')
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
        Sign in
      </h2>
      <p className="text-[var(--text-muted)] mb-8" style={{ fontSize: 'var(--text-sm)' }}>
        Welcome back. Enter your credentials to continue.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-3 py-2.5 pr-10 rounded-[var(--radius-md)] border text-[var(--text)] placeholder-[var(--text-faint)] outline-none transition-all bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-dim)]"
              style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-ui)' }}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

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
          Sign In
        </Button>
      </form>

      <p
        className="text-center mt-6 text-[var(--text-muted)]"
        style={{ fontSize: 'var(--text-sm)' }}
      >
        Don't have an account?{' '}
        <Link
          to="/register"
          className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
        >
          Create one free
        </Link>
      </p>
    </AuthLayout>
  )
}
