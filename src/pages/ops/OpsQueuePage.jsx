
import { useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { datetime, humanize, inr, units } from '../../lib/format'

export default function OpsQueuePage() {
  const toast = useToast()
  const { data, loading, reload } = useFetch('/transactions/queue')
  const [rejecting, setRejecting] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function act(t, verb, msg) {
    setBusyId(t.id)
    try { await api.post(`/transactions/${t.id}/${verb}`); toast.success(msg); reload() }
    catch (e) { toast.error(errorMessage(e)) }
    finally { setBusyId(null) }
  }

  if (loading) return <PageLoader />

  return (
    <>
      <div className="page-head row-between">
        <div>
          <h1>Transaction Queue</h1>
          <p>Review, accept and allot pending subscriptions and redemptions</p>
        </div>
        <button className="btn btn-ghost" onClick={reload}>↻ Refresh</button>
      </div>

      <Card hint={`${data?.length ?? 0} item(s) awaiting processing`}>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Reference</th><th>Received</th><th>Folio</th><th>Scheme</th><th>Type</th>
                <th className="num">Amount</th><th className="num">Units</th><th>Cut-off</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={10} text="Queue is clear — no pending transactions." />}
              {data?.map((t) => (
                <tr key={t.id}>
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
                      {t.status === 'RECEIVED' && <button className="btn btn-ghost btn-sm" disabled={busyId === t.id} onClick={() => act(t, 'accept', `${t.transactionRef} accepted`)}>Accept</button>}
                      {(t.status === 'RECEIVED' || t.status === 'ACCEPTED') && <button className="btn btn-teal btn-sm" disabled={busyId === t.id} onClick={() => act(t, 'allot', `${t.transactionRef} allotted`)}>Allot</button>}
                      <button className="btn btn-danger btn-sm" disabled={busyId === t.id} onClick={() => setRejecting(t)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {rejecting && (
        <RejectModal txn={rejecting} onClose={() => setRejecting(null)} onDone={() => { setRejecting(null); reload() }} />
      )}
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
        <button className="btn btn-danger" disabled={busy || !reason.trim()} onClick={submit}>Reject Transaction</button></>}>
      <div className="field">
        <label>Rejection Reason</label>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. KYC not compliant, insufficient documents" />
      </div>
    </Modal>
  )
}
