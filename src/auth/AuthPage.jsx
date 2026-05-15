import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode,     setMode]     = useState('login') // 'login' | 'signup'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(null)

  async function handleSubmit() {
    setError(null)
    setSuccess(null)

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      if (!name.trim()) {
        setError('Please enter your name')
        setLoading(false)
        return
      }
      const { error } = await signUp(email, password, name)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created! You can now log in.')
        setMode('login')
        setName('')
        setPassword('')
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
            <div style={{ background: '#fee2e2', border: '0.5px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#991b1b', marginBottom: 16 }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#d1fae5', border: '0.5px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#065f46', marginBottom: 16 }}>
              ✅ {success}
            </div>
          )}

          {mode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Full name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Pradeep Chinthapandu"
                style={{ width: '100%', border: '1px solid #e8e6e1', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

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

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={{ width: '100%', border: '1px solid #e8e6e1', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

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
              <>Don't have an account? <span onClick={() => { setMode('signup'); setError(null) }} style={{ color: '#e24b4a', cursor: 'pointer', fontWeight: 500 }}>Sign up</span></>
            ) : (
              <>Already have an account? <span onClick={() => { setMode('login'); setError(null) }} style={{ color: '#e24b4a', cursor: 'pointer', fontWeight: 500 }}>Sign in</span></>
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
