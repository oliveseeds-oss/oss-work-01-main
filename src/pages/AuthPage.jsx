import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthPage() {
  const { login, register }             = useAuth()
  const [isLogin, setIsLogin]           = useState(true)
  const [form, setForm]                 = useState({ name: '', email: '', password: '' })
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    if (!form.email || !form.password) return setError('Please fill all fields.')
    if (!isLogin && !form.name)        return setError('Please enter your name.')
    setLoading(true)
    try {
      if (isLogin) await login(form.email, form.password)
      else         await register(form.email, form.password, form.name)
    } catch (e) {
      setError(e.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={S.olive}>🫒</div>
        <div style={S.appName}>OLIVESEEDS OS</div>
        <div style={S.tagline}>Productivity &amp; Marketing System</div>

        {error && <div style={S.error}>{error}</div>}

        {!isLogin && (
          <>
            <label style={S.label}>Your Name</label>
            <input style={S.input} placeholder="e.g. Olive Seeds"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </>
        )}

        <label style={S.label}>Email</label>
        <input style={S.input} type="email" placeholder="you@email.com"
          value={form.email} onChange={e => set('email', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

        <label style={S.label}>Password</label>
        <input style={S.input} type="password" placeholder="••••••••"
          value={form.password} onChange={e => set('password', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

        <button style={S.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : isLogin ? '→  Login' : '→  Create Account'}
        </button>

        <div style={S.toggle}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span style={S.link} onClick={() => { setIsLogin(!isLogin); setError('') }}>
            {isLogin ? 'Register here' : 'Login here'}
          </span>
        </div>
      </div>
    </div>
  )
}

const S = {
  page:    { minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono','Courier New',monospace", padding: 24 },
  box:     { background: '#161b22', border: '1px solid #21262d', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 400 },
  olive:   { textAlign: 'center', fontSize: 40, marginBottom: 8 },
  appName: { textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#58a6ff', letterSpacing: '0.12em', marginBottom: 4 },
  tagline: { textAlign: 'center', fontSize: 12, color: '#8b949e', marginBottom: 32 },
  label:   { fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:   { width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '11px 14px', color: '#e8e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 14, boxSizing: 'border-box' },
  btn:     { width: '100%', background: '#238636', border: 'none', borderRadius: 8, padding: 13, color: '#fff', fontSize: 14, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', marginBottom: 16, letterSpacing: '0.04em' },
  error:   { background: '#da363320', border: '1px solid #da363344', borderRadius: 8, padding: '10px 14px', color: '#f85149', fontSize: 13, marginBottom: 14 },
  toggle:  { textAlign: 'center', fontSize: 13, color: '#8b949e' },
  link:    { color: '#58a6ff', cursor: 'pointer' },
}
