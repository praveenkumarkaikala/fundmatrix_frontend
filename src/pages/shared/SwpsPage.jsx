
import { useMemo, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch, useOptionNavMap } from '../../lib/useFetch'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { date, humanize, inr, num } from '../../lib/format'

export default function SwpsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, loading, reload } = useFetch('/swp-mandates')
  const [showCreate, setShowCreate] = useState(false)

  const isOps = user?.role === 'FUND_OPS' || user?.role === 'ADMIN'
  const canCreate = user && ['INVESTOR', 'DISTRIBUTOR', 'FUND_OPS', 'ADMIN'].includes(user.role)

  async function setStatus(id, status, msg) {
    try { await api.put(`/swp-mandates/${id}/status`, { status }); toast.success(msg); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }
  async function process(id, ref) {
    try { await api.post(`/swp-mandates/${id}/process`); toast.success(`Instalment processed for ${ref}`); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  if (loading) return <PageLoader />

  return (
    <>
      <div className="page-head row-between">
        <div>
          <h1>{isOps ? 'SWP Processing' : 'SWP Withdrawals'}</h1>
          <p>Recurring systematic withdrawal mandates — fixed amount redeemed each period</p>
        </div>
        {canCreate && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New SWP</button>}
      </div>

      <Card>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Mandate</th><th>Folio</th><th>Scheme</th><th className="num">Amount</th>
                <th>Frequency</th><th className="num">Progress</th><th>Next Instalment</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={9} text="No SWP mandates yet." />}
              {data?.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.mandateRef}</b></td>
                  <td>{s.folioNumber}</td>
                  <td>{s.schemeName}</td>
                  <td className="num">{inr(s.amount)}</td>
                  <td>{humanize(s.frequency)}</td>
                  <td className="num">{s.instalmentsExecuted}{s.instalmentCount ? ` / ${s.instalmentCount}` : ''}</td>
                  <td>{date(s.nextInstalmentDate)}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <div className="btn-row">
                      {isOps && s.status === 'ACTIVE' && <button className="btn btn-teal btn-sm" onClick={() => process(s.id, s.mandateRef)}>Process</button>}
                      {s.status === 'ACTIVE' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus(s.id, 'PAUSED', 'SWP paused')}>Pause</button>}
                      {s.status === 'PAUSED' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus(s.id, 'ACTIVE', 'SWP resumed')}>Resume</button>}
                      {(s.status === 'ACTIVE' || s.status === 'PAUSED') && <button className="btn btn-danger btn-sm" onClick={() => setStatus(s.id, 'CANCELLED', 'SWP cancelled')}>Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showCreate && <CreateSwpModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); reload() }} />}
    </>
  )
}

function CreateSwpModal({ onClose, onCreated }) {
  const toast = useToast()
  const folios = useFetch('/folios')
  const schemes = useFetch('/schemes')
  const navByOption = useOptionNavMap(schemes.data)
  const [form, setForm] = useState({ folioId: '', optionId: '', amount: '', frequency: 'MONTHLY', startDate: '', instalmentCount: '' })
  const [busy, setBusy] = useState(false)

  const options = useMemo(() => {
    const out = []
    schemes.data?.forEach((s) => s.options.filter((o) => o.status === 'ACTIVE').forEach((o) => out.push({ id: o.id, label: `${s.schemeName} · ${humanize(o.optionType)}`, nav: navByOption[o.id] })))
    return out
  }, [schemes.data, navByOption])

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.post('/swp-mandates', {
        folioId: Number(form.folioId), optionId: Number(form.optionId), amount: Number(form.amount),
        frequency: form.frequency, startDate: form.startDate,
        instalmentCount: form.instalmentCount ? Number(form.instalmentCount) : undefined,
      })
      toast.success('SWP mandate created'); onCreated()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <Modal title="New SWP Mandate" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="swp-form" disabled={busy}>{busy ? 'Saving…' : 'Create SWP'}</button></>}>
      <form id="swp-form" onSubmit={submit}>
        <div className="field">
          <label>Folio</label>
          <select value={form.folioId} onChange={(e) => setForm({ ...form, folioId: e.target.value })} required>
            <option value="">Select…</option>
            {(folios.data ?? []).filter((f) => f.status === 'ACTIVE').map((f) => <option key={f.id} value={f.id}>{f.folioNumber} — {f.investorName}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Scheme Option (to withdraw from)</label>
          <select value={form.optionId} onChange={(e) => setForm({ ...form, optionId: e.target.value })} required>
            <option value="">Select…</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.label}{o.nav ? ` (NAV ${num(o.nav, 4)})` : ''}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Withdrawal Amount (₹)</label>
            <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div className="field">
            <label>Frequency</label>
            <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </div>
          <div className="field">
            <label>Instalments</label>
            <input type="number" min="1" value={form.instalmentCount} onChange={(e) => setForm({ ...form, instalmentCount: e.target.value })} placeholder="e.g. 12" />
          </div>
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
          Each instalment redeems units worth the withdrawal amount at the published NAV. Blocked if the folio is frozen or KYC is not verified.
        </p>
      </form>
    </Modal>
  )
}
