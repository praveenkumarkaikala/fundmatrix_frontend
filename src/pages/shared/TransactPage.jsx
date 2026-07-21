
import { useMemo, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch, useOptionNavMap } from '../../lib/useFetch'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/Toast'
import { Card, PageLoader } from '../../components/ui'
import { humanize, num } from '../../lib/format'

export default function TransactPage() {
  const toast = useToast()
  const { user } = useAuth()
  const folios = useFetch('/folios')
  const schemes = useFetch('/schemes')
  const kyc = useFetch(user?.role === 'INVESTOR' ? '/kyc/mine' : null)
  const [tab, setTab] = useState('SUBSCRIBE')

  const navByOption = useOptionNavMap(schemes.data)

  const options = useMemo(() => {
    const out = []
    schemes.data?.forEach((s) =>
      s.options.filter((o) => o.status === 'ACTIVE').forEach((o) =>
        out.push({ optionId: o.id, label: `${s.schemeName} · ${humanize(o.optionType)}`, nav: navByOption[o.id] }),
      ),
    )
    return out
  }, [schemes.data, navByOption])

  if (folios.loading || schemes.loading || kyc.loading) return <PageLoader />

  const kycVerified =( user?.role == 'INVESTOR' && kyc?.data?.kycStatus !== 'COMPLIANT') || false
  if (kycVerified) {
    return (
      <>
        <div className="page-head">
          <h1>Place a Transaction</h1>
          <p>Subscriptions, redemptions and switches require a verified KYC</p>
        </div>
        <Card title="KYC verification required">
          <div className="alert alert-warn">
            Your KYC is not yet verified. You can place subscriptions, redemptions and switches only
            after your KYC has been verified (COMPLIANT) by the fund operator.
          </div>
          <Link className="btn btn-primary" to="/kyc">Go to KYC Verification</Link>
        </Card>
      </>
    )
  }



  const activeFolios = (folios.data ?? []).filter((f) => f.status === 'ACTIVE')
if(activeFolios.length==0)
{
   return (
     <>
  <div className="page-head">
    <h1>Place a Transaction</h1>
    <p>Subscriptions, redemptions and switches require an active folio.</p>
  </div>

  <Card title="No Folio Available">
    <div className="alert alert-warn">
      You do not have any active folios. To place subscriptions,
      redemptions, or switches, you must first create a folio and
      complete the required onboarding process.
    </div>

    <Link className="btn btn-primary" to="/folios">
      Create a Folio
    </Link>
  </Card>
</>
    )
}
  return (
    <>
      <div className="page-head">
        <h1>Place a Transaction</h1>
        <p>Subscriptions, redemptions and switches are processed against the latest published NAV</p>
      </div>

      <div className="tabs">
        {['SUBSCRIBE', 'REDEEM', 'SWITCH'].map((t) => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{humanize(t)}</div>
        ))}
      </div>

      <div className="grid cols-2">
        <Card>
          {tab === 'SUBSCRIBE' && <SubscribeForm folios={activeFolios} options={options} onDone={toast.success} onError={toast.error} />}
          {tab === 'REDEEM' && <RedeemForm folios={activeFolios} options={options} onDone={toast.success} onError={toast.error} />}
          {tab === 'SWITCH' && <SwitchForm folios={activeFolios} options={options} onDone={toast.success} onError={toast.error} />}
        </Card>
        <Card title="How processing works" hint="Phase 1 operations model">
          <div className="kv"><span className="k">Cut-off (equity/debt)</span><span className="v">15:00</span></div>
          <div className="kv"><span className="k">Cut-off (liquid)</span><span className="v">13:30</span></div>
          <div className="kv"><span className="k">Subscriptions/Redemptions</span><span className="v">Queued → Allotted by Ops</span></div>
          <div className="kv"><span className="k">Switches</span><span className="v">Processed immediately</span></div>
          <div className="kv"><span className="k">Allotment NAV</span><span className="v">Latest published NAV</span></div>
          <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
            Subscriptions and redemptions enter the operations queue and are allotted once accepted.
            Track them under Account Statement.
          </p>
        </Card>
      </div>
    </>
  )
}

function FolioSelect({ folios, value, onChange }) {
  return (
    <div className="field">
      <label>Folio</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">Select a folio…</option>
        {folios.map((f) => <option key={f.id} value={f.id}>{f.folioNumber} — {f.investorName}</option>)}
      </select>
    </div>
  )
}

function OptionSelect({ options, value, onChange, label }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">Select a scheme option…</option>
        {options.map((o) => <option key={o.optionId} value={o.optionId}>{o.label}{o.nav ? ` (NAV ${num(o.nav, 4)})` : ''}</option>)}
      </select>
    </div>
  )
}

function SubscribeForm({ folios, options, onDone, onError }) {
  const [folioId, setFolioId] = useState('')
  const [optionId, setOptionId] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      const { data } = await api.post('/transactions/subscriptions', { folioId: Number(folioId), optionId: Number(optionId), amount: Number(amount) })
      onDone(`Subscription ${data.transactionRef} received (${data.cutOffStatus?.replace(/_/g, ' ').toLowerCase()})`)
      setAmount('')
    } catch (err) { onError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit}>
      <FolioSelect folios={folios} value={folioId} onChange={setFolioId} />
      <OptionSelect options={options} value={optionId} onChange={setOptionId} label="Scheme Option" />
      <div className="field">
        <label>Amount (₹)</label>
        <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="e.g. 25000" />
      </div>
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Submitting…' : 'Submit Subscription'}</button>
    </form>
  )
}

function RedeemForm({ folios, options, onDone, onError }) {
  const [folioId, setFolioId] = useState('')
  const [optionId, setOptionId] = useState('')
  const [unitsVal, setUnitsVal] = useState('')
  const [redeemAll, setRedeemAll] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      const { data } = await api.post('/transactions/redemptions', {
        folioId: Number(folioId), optionId: Number(optionId),
        units: redeemAll ? undefined : Number(unitsVal), redeemAll,
      })
      onDone(`Redemption ${data.transactionRef} received`)
      setUnitsVal('')
    } catch (err) { onError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit}>
      <FolioSelect folios={folios} value={folioId} onChange={setFolioId} />
      <OptionSelect options={options} value={optionId} onChange={setOptionId} label="Scheme Option" />
      <div className="field">
        <label>Units to redeem</label>
        <input type="number" min="0.0001" step="0.0001" value={unitsVal} onChange={(e) => setUnitsVal(e.target.value)} disabled={redeemAll} required={!redeemAll} />
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, marginBottom: 14 }}>
        <input type="checkbox" checked={redeemAll} onChange={(e) => setRedeemAll(e.target.checked)} style={{ width: 'auto' }} /> Redeem entire holding
      </label>
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Submitting…' : 'Submit Redemption'}</button>
    </form>
  )
}

function SwitchForm({ folios, options, onDone, onError }) {
  const [folioId, setFolioId] = useState('')
  const [fromOptionId, setFrom] = useState('')
  const [toOptionId, setTo] = useState('')
  const [unitsVal, setUnitsVal] = useState('')
  const [switchAll, setSwitchAll] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.post('/transactions/switches', {
        folioId: Number(folioId), fromOptionId: Number(fromOptionId), toOptionId: Number(toOptionId),
        units: switchAll ? undefined : Number(unitsVal), switchAll,
      })
      onDone('Switch processed successfully')
      setUnitsVal('')
    } catch (err) { onError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit}>
      <FolioSelect folios={folios} value={folioId} onChange={setFolioId} />
      <OptionSelect options={options} value={fromOptionId} onChange={setFrom} label="Switch From" />
      <OptionSelect options={options} value={toOptionId} onChange={setTo} label="Switch To" />
      <div className="field">
        <label>Units to switch</label>
        <input type="number" min="0.0001" step="0.0001" value={unitsVal} onChange={(e) => setUnitsVal(e.target.value)} disabled={switchAll} required={!switchAll} />
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, marginBottom: 14 }}>
        <input type="checkbox" checked={switchAll} onChange={(e) => setSwitchAll(e.target.checked)} style={{ width: 'auto' }} /> Switch entire holding
      </label>
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Processing…' : 'Process Switch'}</button>
    </form>
  )
}
