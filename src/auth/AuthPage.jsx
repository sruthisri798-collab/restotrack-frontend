import { useState } from 'react'
import { useAuth } from './AuthContext'

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters',        met: password.length >= 8 },
    { label: 'Uppercase letter',      met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter',      met: /[a-z]/.test(password) },
    { label: 'Number',                met: /[0-9]/.test(password) },
    { label: 'Special character',     met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ]

  const metCount = checks.filter(c => c.met).length
  const strength = metCount <= 1 ? 'Weak' : metCount <= 3 ? 'Fair' : metCount === 4 ? 'Good' : 'Strong'
  const strengthColor = metCount <= 1 ? '#dc2626' : metCount <= 3 ? '#f59e0b' : metCount === 4 ? '#3b82f6' : '#059669'

  if (!password) return null

  return (
    <div style={{ marginTop: 8 }}>
      {/* Strength bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: i <= metCount ? strengthColor : '#e5e7eb',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: strengthColor, fontWeight: 500, marginBottom: 6 }}>
        {strength}
      </div>
      {/* Requirements checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: c.met ? '#059669' : '#9ca3af' }}>
              {c.met ? '✓' : '○'}
            </span>
            <span style={{ fontSize: 11, color: c.met ? '#059669' : '#9ca3af' }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode,     setMode]     = useState('login')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(null)

  function validatePassword(pwd) {
    if (pwd.length < 8)
      return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(pwd))
      return 'Password must contain at least one uppercase letter'
    if (!/[a-z]/.test(pwd))
      return 'Password must contain at least one lowercase letter'
    if (!/[0-9]/.test(pwd))
      return 'Password must contain at least one number'
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd))
      return 'Password must contain at least one special character (!@#$...)'
    return null
  }

  async function handleSubmit() {
    setError(null)
    setSuccess(null)

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name')
        return
      }
      const pwdError = validatePassword(password)
      if (pwdError) {
        setError(pwdError)
        return
      }
    }

    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email before logging in. Check your inbox.')
        } else if (error.message.includes('Invalid login')) {
          setError('Incorrect email or password. Please try again.')
        } else {
          setError(error.message)
        }
      }
    } else {
      const { error } = await signUp(email, password, name)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created! We sent a confirmation email. Please check your inbox and click the link before logging in.')
        setName('')
        setPassword('')
        setTimeout(() => {
          setSuccess(null)
          setMode('login')
        }, 5000)
      }
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, background: '#e24b4a', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 18 }}>🧾</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>RestoTrack</span>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '0.5px solid #e8e6e1' }}>

          {error && (
            <div style={{ background: '#fee2e2', border: '0.5px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#991b1b', marginBottom: 16, lineHeight: 1.5 }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#d1fae5', border: '0.5px solid #bbf7d0', borderRadius: 8, padding: '12px', fontSize: 13, color: '#065f46', marginBottom: 16, lineHeight: 1.5 }}>
              ✅ {success}
            </div>
          )}

          {/* Name field — signup only */}
          {mode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Full name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                style={{ width: '100%', border: '1px solid #e8e6e1', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', border: '1px solid #e8e6e1', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: mode === 'signup' ? 8 : 20 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min 8 chars, upper, lower, number, special' : 'Enter your password'}
                style={{ width: '100%', border: '1px solid #e8e6e1', borderRadius: 8, padding: '10px 40px 10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9ca3af' }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Password strength — signup only */}
            {mode === 'signup' && <PasswordStrength password={password} />}
          </div>

          {mode === 'signup' && <div style={{ marginBottom: 12 }} />}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#6b7280' : '#111827',
              color: 'white', border: 'none', borderRadius: 8,
              padding: '12px', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <span onClick={() => { setMode('signup'); setError(null); setSuccess(null) }} style={{ color: '#e24b4a', cursor: 'pointer', fontWeight: 500 }}>
                  Sign up
                </span>
              </>
            ) : (
              <>Already have an account?{' '}
                <span onClick={() => { setMode('login'); setError(null); setSuccess(null) }} style={{ color: '#e24b4a', cursor: 'pointer', fontWeight: 500 }}>
                  Sign in
                </span>
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#9ca3af' }}>
          Restaurant financial reconciliation · Powered by AI
        </div>
      </div>
    </div>
  )
}
