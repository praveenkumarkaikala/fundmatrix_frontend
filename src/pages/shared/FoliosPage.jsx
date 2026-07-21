
import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { humanize, inr, num, units } from '../../lib/format'
import { Link } from 'react-router-dom'

const TAX = ['INDIVIDUAL', 'HUF', 'CORPORATE', 'NRI', 'MINOR']
const MODES = ['SINGLE', 'JOINT', 'ANYONE_OR_SURVIVOR']

export default function FoliosPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useFetch('/folios')
  const [showCreate, setShowCreate] = useState(false)
  const [holdingsFor, setHoldingsFor] = useState(null)
  const kyc = useFetch(user?.role === 'INVESTOR' ? '/kyc/mine' : null)
  const isStaff = user?.role === 'FUND_OPS' || user?.role === 'ADMIN'
  const canCreate = user && ['INVESTOR', 'DISTRIBUTOR', 'FUND_OPS', 'ADMIN'].includes(user.role)

// useEffect(()=>{
//   console.log("kyc",kyc);
// },[kyc])

const kycVerified = kyc?.data?.kycStatus !=="COMPLIANT"
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

  async function changeStatus(f, status) {
    try {
      await api.patch(`/folios/${f.id}/status`, { status })
      toast.success(`Folio ${f.folioNumber} → ${humanize(status)}`)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  if (loading) return <PageLoader />

  return (
    <>
      <div className="page-head row-between">
        <div>
          <h1>{user?.role === 'INVESTOR' ? 'My Folios' : user?.role === 'DISTRIBUTOR' ? 'Client Folios' : 'Folio Manager'}</h1>
          <p>Folios, holdings and lifecycle status</p>
        </div>
        {canCreate && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Folio</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <Card>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Folio No.</th>
                <th>Investor</th>
                <th>Distributor</th>
                <th>Tax Status</th>
                <th>Holding Mode</th>
                <th className="num">Current Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={8} />}
              {data?.map((f) => (
                <tr key={f.id}>
                  <td><b>{f.folioNumber}</b></td>
                  <td>{f.investorName}</td>
                  <td>{f.distributorName ?? <span className="muted">Direct</span>}</td>
                  <td>{humanize(f.taxStatus)}</td>
                  <td>{humanize(f.modeOfHolding)}</td>
                  <td className="num">{inr(f.currentValue)}</td>
                  <td><StatusBadge status={f.status} /></td>
                  <td>
                    <div className="btn-row">
                      <button className="btn btn-ghost btn-sm" onClick={() => setHoldingsFor(f)}>Holdings</button>
                      {isStaff && f.status !== 'ACTIVE' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(f, 'ACTIVE')}>Activate</button>
                      )}
                      {isStaff && f.status === 'ACTIVE' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(f, 'FROZEN')}>Freeze</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showCreate && (
        <CreateFolioModal isStaff={!!isStaff} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); reload() }} />
      )}
      {holdingsFor && <HoldingsModal folio={holdingsFor} onClose={() => setHoldingsFor(null)} />}
    </>
  )
}

function CreateFolioModal({ isStaff, onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState({ investorId: '', taxStatus: 'INDIVIDUAL', modeOfHolding: 'SINGLE', nomineeDetails: '', bankAccountRef: '' })
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/folios', {
        investorId: isStaff && form.investorId ? Number(form.investorId) : undefined,
        taxStatus: form.taxStatus,
        modeOfHolding: form.modeOfHolding,
        nomineeDetails: form.nomineeDetails || undefined,
        bankAccountRef: form.bankAccountRef || undefined,
      })
      toast.success('Folio created')
      onCreated()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Create Folio" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="folio-form" disabled={busy}>{busy ? 'Saving…' : 'Create Folio'}</button></>}>
      <form id="folio-form" onSubmit={submit}>
        {isStaff && (
          <div className="field">
            <label>Investor ID</label>
            <input type="number" value={form.investorId} onChange={(e) => setForm({ ...form, investorId: e.target.value })} required placeholder="e.g. 7" />
          </div>
        )}
        <div className="form-row">
          <div className="field">
            <label>Tax Status</label>
            <select value={form.taxStatus} onChange={(e) => setForm({ ...form, taxStatus: e.target.value })}>
              {TAX.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Mode of Holding</label>
            <select value={form.modeOfHolding} onChange={(e) => setForm({ ...form, modeOfHolding: e.target.value })}>
              {MODES.map((m) => <option key={m} value={m}>{humanize(m)}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Nominee Details</label>
          <input value={form.nomineeDetails} onChange={(e) => setForm({ ...form, nomineeDetails: e.target.value })} placeholder="Name (Relationship) - %" />
        </div>
        <div className="field">
          <label>Bank Account Reference</label>
          <input value={form.bankAccountRef} onChange={(e) => setForm({ ...form, bankAccountRef: e.target.value })} placeholder="Bank - XXXX1234" />
        </div>
      </form>
    </Modal>
  )
}

function HoldingsModal({ folio, onClose }) {
  const { data, loading } = useFetch(`/folios/${folio.id}/holdings`)
  return (
    <Modal title={`Holdings · ${folio.folioNumber}`} onClose={onClose}>
      {loading ? <PageLoader /> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Scheme</th><th>Option</th><th className="num">Units</th><th className="num">Value</th><th className="num">P&L</th></tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={5} text="No holdings in this folio." />}
              {data?.map((h) => (
                <tr key={h.id}>
                  <td>{h.schemeName}</td>
                  <td>{humanize(h.optionType)}</td>
                  <td className="num">{units(h.unitsHeld)}</td>
                  <td className="num">{inr(h.currentValue)}</td>
                  <td className="num" style={{ color: (h.unrealisedGainLoss ?? 0) >= 0 ? 'var(--green-500)' : 'var(--rose-500)' }}>{num(h.unrealisedGainLoss)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
