import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { errorMessage } from '../api/client'
import './Register.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="brand"><span className="mark">FM</span><span>FundMatrix</span></div>
        <div>
          <h1>Start investing with FundMatrix</h1>
          <p>
            Open an investor account to manage folios, place subscriptions and redemptions,
            set up SIPs and track your portfolio valuation in real time.
          </p>
        </div>
        <div style={{ color: '#9fabd6', fontSize: 13 }}>© 2026 FundMatrix · Banking &amp; Financial Services</div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <h2>Create your account</h2>
          <div className="sub">Investor self-registration</div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Full name</label>
              <input className="form-control" value={form.name} onChange={set('name')} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" value={form.password} onChange={set('password')}
                minLength={6} required />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: 18, fontSize: 13.5 }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
