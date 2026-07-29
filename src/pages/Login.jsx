import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { errorMessage } from '../api/client'
import './Login.css'

const DEMO = [
  { label: 'Admin', email: 'admin1@fundmatrix.test' },
  { label: 'Investor', email: 'ravi@example.com' },
  { label: 'Distributor', email: 'arnold@wealthbridge.io' },
  { label: 'Fund Ops', email: 'ops@fundmatrix.io' },
  { label: 'Accountant', email: 'accountant@fundmatrix.io' },
  { label: 'Compliance', email: 'compliance@fundmatrix.io' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
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
          <h1>Mutual Fund &amp; Asset Management Operations</h1>
          <p>
            One platform for fund scheme administration, investor onboarding, transaction
            processing, NAV &amp; fund accounting, dividend distribution and distributor
            commissions — across six operational roles.
          </p>
          <div className="features">
            <div className="feature"><span className="dot" /> Subscriptions, redemptions, switches &amp; SIPs with cut-off enforcement</div>
            <div className="feature"><span className="dot" /> NAV-driven unit allotment and AUM tracking</div>
            <div className="feature"><span className="dot" /> Dividend entitlements, trail commission &amp; compliance oversight</div>
          </div>
        </div>
        <div style={{ color: '#9fabd6', fontSize: 13 }}>© 2026 FundMatrix · Banking &amp; Financial Services</div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <div className="sub">Sign in to your FundMatrix workspace</div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="demo-accounts">
            Demo accounts — password <b>Password@123</b>
            <div className="chips">
              {DEMO.map((d) => (
                <span key={d.email} className="demo-chip"
                  onClick={() => { setEmail(d.email); setPassword('Password@123') }}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18, fontSize: 13.5 }}>
            New investor? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
