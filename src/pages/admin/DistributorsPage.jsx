
import { useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { date, humanize, inr, pct } from '../../lib/format'

const MODELS = ['TRAIL', 'UPFRONT', 'BOTH']
const DIST_STATUS = ['ACTIVE', 'SUSPENDED', 'DEREGISTERED']

export default function DistributorsPage() {
  const { data, loading, reload } = useFetch('/distributors')
  const [showCreate, setShowCreate] = useState(false)
  const [commissionsFor, setCommissionsFor] = useState(null)
  const [editing, setEditing] = useState(null)

  if (loading) return <PageLoader />

  return (
    <>
      <div className="page-head d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1>Distributors</h1>
          <p>Empanelment records and trail commission management</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Empanel Distributor</button>
      </div>

      <Card>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>ARN</th><th>EUIN</th><th>Model</th><th>Empanelled</th><th className="num">AUM Managed</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={8} />}
              {data?.map((d) => (
                <tr key={d.id}>
                  <td><b>{d.name}</b></td>
                  <td>{d.arnNumber ?? '—'}</td>
                  <td>{d.euinNumber ?? '—'}</td>
                  <td><span className="badge gray">{humanize(d.commissionModel)}</span></td>
                  <td>{date(d.empanelmentDate)}</td>
                  <td className="num">{inr(d.aumManaged)}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(d)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setCommissionsFor(d)}>Commissions</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showCreate && <DistributorModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); reload() }} />}
      {commissionsFor && <CommissionsModal distributor={commissionsFor} onClose={() => setCommissionsFor(null)} />}
      {editing && <EditDistributorModal distributor={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); reload() }} />}
    </>
  )
}

function EditDistributorModal({ distributor, onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({
    name: distributor.name ?? '', arnNumber: distributor.arnNumber ?? '', euinNumber: distributor.euinNumber ?? '',
    empanelmentDate: distributor.empanelmentDate ?? '', commissionModel: distributor.commissionModel ?? 'TRAIL',
    status: distributor.status ?? 'ACTIVE',
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.put(`/distributors/${distributor.id}`, {
        name: f.name, arnNumber: f.arnNumber || undefined, euinNumber: f.euinNumber || undefined,
        empanelmentDate: f.empanelmentDate || undefined, commissionModel: f.commissionModel, status: f.status,
      })
      toast.success('Distributor updated'); onDone()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return (
    <Modal title={`Edit · ${distributor.name}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="dist-edit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></>}>
      <form id="dist-edit" onSubmit={submit}>
        <div className="mb-3"><label className="form-label">Name</label><input className="form-control" value={f.name} onChange={set('name')} required /></div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">ARN Number</label><input className="form-control" value={f.arnNumber} onChange={set('arnNumber')} /></div>
          <div className="mb-3"><label className="form-label">EUIN Number</label><input className="form-control" value={f.euinNumber} onChange={set('euinNumber')} /></div>
        </div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Commission Model</label><select className="form-select" value={f.commissionModel} onChange={set('commissionModel')}>{MODELS.map((m) => <option key={m} value={m}>{humanize(m)}</option>)}</select></div>
          <div className="mb-3"><label className="form-label">Status (lifecycle)</label><select className="form-select" value={f.status} onChange={set('status')}>{DIST_STATUS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</select></div>
        </div>
        <div className="mb-3"><label className="form-label">Empanelment Date</label><input className="form-control" type="date" value={f.empanelmentDate} onChange={set('empanelmentDate')} /></div>
      </form>
    </Modal>
  )
}

function DistributorModal({ onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({ name: '', arnNumber: '', euinNumber: '', empanelmentDate: '', commissionModel: 'TRAIL', status: 'ACTIVE', userId: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.post('/distributors', {
        name: f.name, arnNumber: f.arnNumber || undefined, euinNumber: f.euinNumber || undefined,
        empanelmentDate: f.empanelmentDate || undefined, commissionModel: f.commissionModel,
        status: f.status, userId: f.userId ? Number(f.userId) : undefined,
      })
      toast.success('Distributor empanelled'); onDone()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <Modal title="Empanel Distributor" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="dist-form" disabled={busy}>{busy ? 'Saving…' : 'Empanel'}</button></>}>
      <form id="dist-form" onSubmit={submit}>
        <div className="mb-3"><label className="form-label">Name</label><input className="form-control" value={f.name} onChange={set('name')} required /></div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">ARN Number</label><input className="form-control" value={f.arnNumber} onChange={set('arnNumber')} /></div>
          <div className="mb-3"><label className="form-label">EUIN Number</label><input className="form-control" value={f.euinNumber} onChange={set('euinNumber')} /></div>
        </div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Empanelment Date</label><input className="form-control" type="date" value={f.empanelmentDate} onChange={set('empanelmentDate')} /></div>
          <div className="mb-3"><label className="form-label">Commission Model</label><select className="form-select" value={f.commissionModel} onChange={set('commissionModel')}>{MODELS.map((m) => <option key={m} value={m}>{humanize(m)}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Status</label><select className="form-select" value={f.status} onChange={set('status')}>{DIST_STATUS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</select></div>
          <div className="mb-3"><label className="form-label">Linked User ID (optional)</label><input className="form-control" type="number" value={f.userId} onChange={set('userId')} placeholder="DISTRIBUTOR user id" /></div>
        </div>
      </form>
    </Modal>
  )
}

function CommissionsModal({ distributor, onClose }) {
  const toast = useToast()
  const schemes = useFetch('/schemes')
  const list = useFetch(`/commissions/distributor/${distributor.id}`)
  const [form, setForm] = useState({ schemeId: '', period: new Date().toISOString().slice(0, 7), trailRate: '0.75' })
  const [busy, setBusy] = useState(false)

  async function compute(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.post('/commissions/compute', { distributorId: distributor.id, schemeId: Number(form.schemeId), period: form.period, trailRate: Number(form.trailRate) })
      toast.success('Commission computed'); list.reload()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  async function act(id, verb, msg) {
    try { await api.post(`/commissions/${id}/${verb}`); toast.success(msg); list.reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <Modal title={`Trail Commission · ${distributor.name}`} onClose={onClose}>
      <form className="d-flex justify-content-between align-items-center flex-wrap gap-3" onSubmit={compute} style={{ alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
        <div className="mb-3" style={{ flex: 1, marginBottom: 0 }}>
          <label className="form-label">Scheme</label>
          <select className="form-select" value={form.schemeId} onChange={(e) => setForm({ ...form, schemeId: e.target.value })} required>
            <option value="">Select…</option>
            {schemes.data?.map((s) => <option key={s.id} value={s.id}>{s.schemeName}</option>)}
          </select>
        </div>
        <div className="mb-3" style={{ width: 120, marginBottom: 0 }}>
          <label className="form-label">Period</label>
          <input className="form-control" type="month" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required />
        </div>
        <div className="mb-3" style={{ width: 100, marginBottom: 0 }}>
          <label className="form-label">Rate %</label>
          <input className="form-control" type="number" step="0.0001" value={form.trailRate} onChange={(e) => setForm({ ...form, trailRate: e.target.value })} required />
        </div>
        <button className="btn btn-primary" disabled={busy}>Compute</button>
      </form>

      {list.loading ? <PageLoader /> : (
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>Period</th><th>Scheme</th><th className="num">Commission</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {(!list.data || list.data.length === 0) && <EmptyRow colSpan={5} text="No commissions yet." />}
              {list.data?.map((c) => (
                <tr key={c.id}>
                  <td>{c.period}</td>
                  <td>{c.schemeName}</td>
                  <td className="num">{inr(c.commissionAmount)} <span className="muted">({pct(c.trailRate)})</span></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    {c.status === 'COMPUTED' && <button className="btn btn-ghost btn-sm" onClick={() => act(c.id, 'approve', 'Approved')}>Approve</button>}
                    {c.status === 'APPROVED' && <button className="btn btn-teal btn-sm" onClick={() => act(c.id, 'pay', 'Paid')}>Pay</button>}
                    {c.status === 'PAID' && <span className="muted">Paid {date(c.payoutDate)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
