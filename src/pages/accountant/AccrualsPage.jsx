
import { useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { date, humanize, inr, pct } from '../../lib/format'

const EXPENSE_TYPES = ['MANAGEMENT_FEE', 'TRUSTEE_FEE', 'AUDIT_FEE', 'CUSTODY', 'DISTRIBUTION']

export default function AccrualsPage() {
  const schemes = useFetch('/schemes')
  const [schemeId, setSchemeId] = useState('')
  const accruals = useFetch(schemeId ? `/accruals/scheme/${schemeId}` : null)
  const compliance = useFetch(schemeId ? `/accruals/scheme/${schemeId}/compliance` : null)
  const [showCreate, setShowCreate] = useState(false)
  const [reversing, setReversing] = useState(null)

  function refresh() { accruals.reload(); compliance.reload() }

  if (schemes.loading) return <PageLoader />

  return (
    <>
      <div className="page-head d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1>Expense Accruals</h1>
          <p>Daily fund-level expense accruals (all 5 expense types) at annualised rates</p>
        </div>
        <button className="btn btn-primary" disabled={!schemeId} onClick={() => setShowCreate(true)}>+ Book Accrual</button>
      </div>

      <Card>
        <div className="mb-3" style={{ maxWidth: 380 }}>
          <label className="form-label">Scheme</label>
          <select className="form-select" value={schemeId} onChange={(e) => setSchemeId(e.target.value)}>
            <option value="">Select a scheme…</option>
            {schemes.data?.map((s) => <option key={s.id} value={s.id}>{s.schemeName}</option>)}
          </select>
        </div>
      </Card>

      {schemeId && compliance.data && <ComplianceMonitor c={compliance.data} />}

      {schemeId && (
        <div className="mt-4">
          <Card title="Accrual History" hint="Reversal requires a mandatory reason (audit-logged)">
            {accruals.loading ? <PageLoader /> : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Expense Type</th><th className="num">Annualised Rate</th><th className="num">Amount</th><th>Status</th><th>Reversal Reason</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {(!accruals.data || accruals.data.length === 0) && <EmptyRow colSpan={7} />}
                    {accruals.data?.map((a) => (
                      <tr key={a.id}>
                        <td>{date(a.accrualDate)}</td>
                        <td>{humanize(a.expenseType)}</td>
                        <td className="num">{pct(a.annualisedRate)}</td>
                        <td className="num">{inr(a.accrualAmount)}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td className="muted" style={{ fontSize: 12 }}>{a.reversalReason ?? '—'}</td>
                        <td>{a.status === 'ACCRUED'
                          ? <button className="btn btn-danger btn-sm" onClick={() => setReversing(a)}>Reverse</button>
                          : <span className="muted">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {showCreate && (
        <CreateAccrualModal schemeId={Number(schemeId)} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refresh() }} />
      )}
      {reversing && (
        <ReverseModal accrual={reversing} onClose={() => setReversing(null)} onDone={() => { setReversing(null); refresh() }} />
      )}
    </>
  )
}

function ComplianceMonitor({ c }) {
  const color = c.status === 'BREACH' ? 'red' : c.status === 'WARN' ? 'amber' : c.status === 'OK' ? 'green' : 'gray'
  const util = c.utilisationPct != null ? Number(c.utilisationPct) : null
  return (
    <div className="mt-4">
      <Card title="Expense-Ratio Compliance" hint="Charged rate (sum of latest annualised rate per expense type) vs the scheme TER limit"
        action={<span className={`badge ${color}`}>{c.status}</span>}>
        <div className="grid cols-3">
          <div className="kv"><span className="k">TER Limit</span><span className="v">{pct(c.expenseRatioLimit)}</span></div>
          <div className="kv"><span className="k">Charged Rate</span><span className="v">{pct(c.chargedRate)}</span></div>
          <div className="kv"><span className="k">Utilisation</span><span className="v">{util != null ? util.toFixed(1) + '%' : '—'}</span></div>
        </div>
        {util != null && (
          <div className="bar-track" style={{ marginTop: 12, height: 10 }}>
            <div className="bar-fill" style={{ width: `${Math.min(util, 100)}%`, background: color === 'red' ? 'var(--rose-500)' : color === 'amber' ? '#d97706' : 'var(--green-500)' }} />
          </div>
        )}
        {c.status === 'BREACH' && <div className="alert alert-danger" style={{ marginTop: 12 }}>Charged expense rate exceeds the scheme's expense-ratio limit.</div>}
        {c.status === 'WARN' && <div className="alert alert-warning" style={{ marginTop: 12 }}>Approaching the expense-ratio limit (≥ 80% utilised).</div>}
      </Card>
    </div>
  )
}

function ReverseModal({ accrual, onClose, onDone }) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit() {
    setBusy(true)
    try {
      await api.post(`/accruals/${accrual.id}/reverse`, { reason })
      toast.success('Accrual reversed')
      onDone()
    } catch (e) { toast.error(errorMessage(e)) } finally { setBusy(false) }
  }
  return (
    <Modal title="Reverse Accrual" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" disabled={busy || !reason.trim()} onClick={submit}>Reverse</button></>}>
      <div className="kv"><span className="k">Expense</span><span className="v">{humanize(accrual.expenseType)} · {inr(accrual.accrualAmount)}</span></div>
      <div className="mb-3" style={{ marginTop: 10 }}>
        <label className="form-label">Reason (required)</label>
        <textarea className="form-control" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Booked in error / duplicate entry" />
      </div>
    </Modal>
  )
}

function CreateAccrualModal({ schemeId, onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState({ expenseType: 'MANAGEMENT_FEE', annualisedRate: '', accrualAmount: '', accrualDate: new Date().toISOString().slice(0, 10) })
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.post('/accruals', {
        schemeId, expenseType: form.expenseType, annualisedRate: Number(form.annualisedRate),
        accrualAmount: form.accrualAmount ? Number(form.accrualAmount) : undefined, accrualDate: form.accrualDate,
      })
      toast.success('Accrual booked'); onCreated()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return (
    <Modal title="Book Expense Accrual" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="acc-form" disabled={busy}>{busy ? 'Saving…' : 'Book Accrual'}</button></>}>
      <form id="acc-form" onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Expense Type</label>
          <select className="form-select" value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value })}>
            {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="mb-3">
            <label className="form-label">Annualised Rate (%)</label>
            <input className="form-control" type="number" step="0.0001" value={form.annualisedRate} onChange={(e) => setForm({ ...form, annualisedRate: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Accrual Date</label>
            <input className="form-control" type="date" value={form.accrualDate} onChange={(e) => setForm({ ...form, accrualDate: e.target.value })} />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Amount (₹) — leave blank to auto-compute from AUM</label>
          <input className="form-control" type="number" step="0.01" value={form.accrualAmount} onChange={(e) => setForm({ ...form, accrualAmount: e.target.value })} placeholder="Auto = AUM × rate ÷ 365" />
        </div>
      </form>
    </Modal>
  )
}
