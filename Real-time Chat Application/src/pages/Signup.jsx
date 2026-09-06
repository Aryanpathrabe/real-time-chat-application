import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Signup({ onSwitchToLogin }) {
  const { signUp } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!username || !email || !password) {
      setError('Please fill in all fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, username)
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.06L2 22l5.18-1.35A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"
                fill="currentColor"
              />
            </svg>
          </div>

          <span className="auth-logo-text">
            Nexus
          </span>
        </div>

        <h1 className="auth-title">
          Create an account
        </h1>

        <p className="auth-subtitle">
          Sign up to start chatting
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Username
            </label>

            <input
              type="text"
              className="form-input"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Email
            </label>

            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
            </label>

            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              'Create account'
            )}
          </button>

        </form>

        <p className="auth-switch">
          Already have an account?{' '}

          <button
            onClick={onSwitchToLogin}
            className="auth-link"
          >
            Sign in
          </button>
        </p>

      </div>
    </div>
  )
}
