
import { useMemo, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { datetime, humanize, inr, num, units } from '../../lib/format'

export default function AllotmentPage() {
  const toast = useToast()
  const { data, loading, reload } = useFetch('/transactions/queue')
  const [selected, setSelected] = useState(new Set())
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState(null)
  const [statementFor, setStatementFor] = useState(null)

  const rows = data ?? []
  const allChecked = rows.length > 0 && rows.every((t) => selected.has(t.id))

  function toggle(id) {
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(rows.map((t) => t.id)))
  }

  async function allotBatch(ids) {
    if (ids.length === 0) return
    setBusy(true)
    try {
      const { data: res } = await api.post('/transactions/allot-batch', { transactionIds: ids })
      setResults(res)
      const ok = res.filter((r) => r.success).length
      const failed = res.length - ok
      toast.success(`Allotted ${ok}${failed ? `, ${failed} failed` : ''}`)
      setSelected(new Set())
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const failedResults = useMemo(() => (results ?? []).filter((r) => !r.success), [results])

  if (loading) return <PageLoader />

  return (
    <>
      <div className="page-head row-between">
        <div>
          <h1>Allotment Processing</h1>
          <p>Batch-process pending allotments against the published NAV; retry or reject failures</p>
        </div>
        <button className="btn btn-ghost" onClick={reload}>↻ Refresh</button>
      </div>

      <Card
        title="Allotment Queue"
        hint={`${rows.length} pending · ${selected.size} selected`}
        action={
          <button className="btn btn-primary btn-sm" disabled={busy || selected.size === 0}
            onClick={() => allotBatch([...selected])}>
            {busy ? 'Processing…' : `Allot Selected (${selected.size})`}
          </button>
        }
      >
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 34 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ width: 'auto' }} /></th>
                <th>Reference</th><th>Received</th><th>Folio</th><th>Scheme</th><th>Type</th>
                <th className="num">Amount</th><th className="num">Units</th><th>Cut-off</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={11} text="Queue is clear — nothing to allot." />}
              {rows.map((t) => (
                <tr key={t.id}>
                  <td><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} style={{ width: 'auto' }} /></td>
                  <td><b>{t.transactionRef}</b></td>
                  <td>{datetime(t.transactionDate)}</td>
                  <td>{t.folioNumber}</td>
                  <td>{t.schemeName}<div className="muted" style={{ fontSize: 11.5 }}>{humanize(t.optionType)}</div></td>
                  <td><span className="badge gray">{humanize(t.transactionType)}</span></td>
                  <td className="num">{inr(t.amount)}</td>
                  <td className="num">{t.units != null ? units(t.units) : '—'}</td>
                  <td>{t.cutOffStatus ? <span className={`badge ${t.cutOffStatus === 'BEFORE_CUTOFF' ? 'green' : 'amber'}`}>{humanize(t.cutOffStatus)}</span> : '—'}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <div className="btn-row">
                      <button className="btn btn-teal btn-sm" disabled={busy} onClick={() => allotBatch([t.id])}>Allot</button>
                      <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => setRejecting(t)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {results && (
        <div className="section-gap">
          <Card title="Last Batch Result" hint={`${results.filter((r) => r.success).length} allotted · ${failedResults.length} failed`}
            action={<button className="btn btn-ghost btn-sm" onClick={() => setResults(null)}>Clear</button>}>
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th>Reference</th><th>Outcome</th><th>Detail</th><th>Action</th></tr></thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.transactionId}>
                      <td><b>{r.transactionRef}</b></td>
                      <td><span className={`badge ${r.success ? 'green' : 'red'}`}>{r.success ? 'ALLOTTED' : 'FAILED'}</span></td>
                      <td style={{ color: r.success ? 'var(--ink, #1e293b)' : 'var(--rose-500)' }}>{r.message}</td>
                      <td>
                        {r.success
                          ? <button className="btn btn-ghost btn-sm" onClick={() => setStatementFor(r.transactionId)}>Statement</button>
                          : <button className="btn btn-teal btn-sm" disabled={busy} onClick={() => allotBatch([r.transactionId])}>Retry</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {rejecting && <RejectModal txn={rejecting} onClose={() => setRejecting(null)} onDone={() => { setRejecting(null); reload() }} />}
      {statementFor && <StatementModal txnId={statementFor} onClose={() => setStatementFor(null)} />}
    </>
  )
}

function RejectModal({ txn, onClose, onDone }) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit() {
    setBusy(true)
    try { await api.post(`/transactions/${txn.id}/reject`, { reason }); toast.success(`${txn.transactionRef} rejected`); onDone() }
    catch (e) { toast.error(errorMessage(e)) } finally { setBusy(false) }
  }
  return (
    <Modal title={`Reject ${txn.transactionRef}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" disabled={busy || !reason.trim()} onClick={submit}>Reject</button></>}>
      <div className="field">
        <label>Rejection Reason</label>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. KYC not compliant" />
      </div>
    </Modal>
  )
}

function StatementModal({ txnId, onClose }) {
  const { data, loading } = useFetch(`/transactions/${txnId}/allotment`)
  return (
    <Modal title="Allotment Statement" onClose={onClose}>
      {loading ? <PageLoader /> : !data ? <div className="empty">No allotment found.</div> : (
        <div>
          <div className="kv"><span className="k">Transaction</span><span className="v">{data.transactionRef}</span></div>
          <div className="kv"><span className="k">Units Allotted</span><span className="v">{units(data.unitsAllotted)}</span></div>
          <div className="kv"><span className="k">Allotment NAV</span><span className="v">{num(data.allotmentNav, 4)}</span></div>
          <div className="kv"><span className="k">Allotment Date</span><span className="v">{data.allotmentDate}</span></div>
          <div className="kv"><span className="k">Status</span><span className="v"><StatusBadge status={data.status} /></span></div>
        </div>
      )}
    </Modal>
  )
}
