
import { useMemo, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch, useOptionNavMap } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { date, humanize, inr, num, units } from '../../lib/format'

export default function AccountantDividends() {
  const toast = useToast()
  const { data, loading, reload } = useFetch('/dividends')
  const [showDeclare, setShowDeclare] = useState(false)
  const [viewing, setViewing] = useState(null)

  async function act(id, verb, msg) {
    try { await api.post(`/dividends/${id}/${verb}`); toast.success(msg); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  if (loading) return <PageLoader />

  return (
    <>
      <div className="page-head d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1>Dividend Workspace</h1>
          <p>Declare dividends, compute investor entitlements and process payouts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowDeclare(true)}>+ Declare Dividend</button>
      </div>

      <Card>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Scheme</th><th>Option</th><th>Record Date</th><th className="num">₹/Unit</th>
                <th className="num">Total Distribution</th><th className="num">Entitlements</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={8} />}
              {data?.map((d) => (
                <tr key={d.id}>
                  <td><b>{d.schemeName}</b></td>
                  <td>{humanize(d.optionType)}</td>
                  <td>{date(d.recordDate)}</td>
                  <td className="num">{num(d.dividendPerUnit, 4)}</td>
                  <td className="num">{inr(d.totalDistributionAmount)}</td>
                  <td className="num">{d.entitlementCount}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      {(d.status === 'DECLARED' || d.status === 'APPROVED') && <button className="btn btn-ghost btn-sm" onClick={() => act(d.id, 'compute', 'Entitlements computed')}>Compute</button>}
                      {d.status === 'DECLARED' && <button className="btn btn-ghost btn-sm" onClick={() => act(d.id, 'approve', 'Dividend approved')}>Approve</button>}
                      {d.status === 'APPROVED' && <button className="btn btn-teal btn-sm" onClick={() => act(d.id, 'process', 'Dividend processed')}>Process</button>}
                      {d.entitlementCount > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setViewing(d)}>View</button>}
                      {d.status !== 'PROCESSED' && d.status !== 'CANCELLED' && <button className="btn btn-danger btn-sm" onClick={() => act(d.id, 'cancel', 'Dividend cancelled')}>Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showDeclare && <DeclareModal onClose={() => setShowDeclare(false)} onDone={() => { setShowDeclare(false); reload() }} />}
      {viewing && <EntitlementsModal declaration={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}

function DeclareModal({ onClose, onDone }) {
  const toast = useToast()
  const schemes = useFetch('/schemes')
  const navByOption = useOptionNavMap(schemes.data)
  const [form, setForm] = useState({ optionId: '', recordDate: new Date().toISOString().slice(0, 10), dividendPerUnit: '' })
  const [busy, setBusy] = useState(false)

  const options = useMemo(() => {
    const out = []
    schemes.data?.forEach((s) => s.options.filter((o) => o.optionType !== 'GROWTH').forEach((o) => out.push({ id: o.id, label: `${s.schemeName} · ${humanize(o.optionType)}`, nav: navByOption[o.id] })))
    return out
  }, [schemes.data, navByOption])

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.post('/dividends', { optionId: Number(form.optionId), recordDate: form.recordDate, dividendPerUnit: Number(form.dividendPerUnit) })
      toast.success('Dividend declared'); onDone()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <Modal title="Declare Dividend" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="div-form" disabled={busy}>{busy ? 'Saving…' : 'Declare'}</button></>}>
      <form id="div-form" onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Scheme Option (dividend-bearing)</label>
          <select className="form-select" value={form.optionId} onChange={(e) => setForm({ ...form, optionId: e.target.value })} required>
            <option value="">Select…</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.label}{o.nav ? ` (NAV ${num(o.nav, 4)})` : ''}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="mb-3">
            <label className="form-label">Record Date</label>
            <input className="form-control" type="date" value={form.recordDate} onChange={(e) => setForm({ ...form, recordDate: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Dividend / Unit (₹)</label>
            <input className="form-control" type="number" step="0.0001" min="0.0001" value={form.dividendPerUnit} onChange={(e) => setForm({ ...form, dividendPerUnit: e.target.value })} required />
          </div>
        </div>
      </form>
    </Modal>
  )
}

function EntitlementsModal({ declaration, onClose }) {
  const { data, loading } = useFetch(`/dividends/${declaration.id}/entitlements`)
  return (
    <Modal title={`Entitlements · ${declaration.schemeName}`} onClose={onClose}>
      {loading ? <PageLoader /> : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr><th>Folio</th><th>Investor</th><th className="num">Units</th><th className="num">Gross</th><th className="num">Tax</th><th className="num">Net</th><th>Status</th></tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={7} text="No entitlements computed." />}
              {data?.map((e) => (
                <tr key={e.id}>
                  <td>{e.folioNumber}</td>
                  <td>{e.investorName}</td>
                  <td className="num">{units(e.unitsOnRecordDate)}</td>
                  <td className="num">{inr(e.grossDividend)}</td>
                  <td className="num">{inr(e.taxDeducted)}</td>
                  <td className="num">{inr(e.netDividend)}</td>
                  <td><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
