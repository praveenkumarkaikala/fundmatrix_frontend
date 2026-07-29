
import { useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { datetime, humanize, inr } from '../../lib/format'

const FILTERS = ['ALL', 'OPEN', 'REVIEWED', 'ESCALATED', 'CLEARED']

export default function FlagsPage() {
  const [filter, setFilter] = useState('ALL')
  const url = filter === 'ALL' ? '/compliance/transaction-flags' : `/compliance/transaction-flags?status=${filter}`
  const { data, loading, reload } = useFetch(url)
  const [acting, setActing] = useState(null) // { flag, target }

  // Allowed next states per current status (Open → Reviewed → Cleared/Escalated; Escalated → Cleared)
  const nextStates = (s) => ({
    OPEN: [['REVIEWED', 'Review', 'btn-ghost']],
    REVIEWED: [['CLEARED', 'Clear', 'btn-teal'], ['ESCALATED', 'Escalate', 'btn-danger']],
    ESCALATED: [['CLEARED', 'Clear', 'btn-teal']],
    CLEARED: [],
  }[s] ?? [])

  return (
    <>
      <div className="page-head">
        <h1>Transaction Flag Review</h1>
        <p>High-value transactions auto-flagged for review · workflow: Open → Reviewed → Cleared / Escalated</p>
      </div>

      <div className="pill-filter">
        {FILTERS.map((f) => (
          <span key={f} className={`pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {humanize(f)}{f !== 'ALL' && data ? ` (${data.filter((x) => x.status === f).length})` : ''}
          </span>
        ))}
      </div>

      <Card hint={`${data?.length ?? 0} flag(s)`}>
        {loading ? <PageLoader /> : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr><th>Reference</th><th>Folio</th><th>Scheme</th><th className="num">Amount</th><th>Reason</th><th>Raised</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {(!data || data.length === 0) && <EmptyRow colSpan={8} text="No flags." />}
                {data?.map((f) => (
                  <tr key={f.id}>
                    <td><b>{f.transactionRef}</b></td>
                    <td>{f.folioNumber}</td>
                    <td>{f.schemeName}</td>
                    <td className="num">{inr(f.amount)}</td>
                    <td className="muted" style={{ fontSize: 12 }}>{f.reason}{f.reviewNote ? ` · note: ${f.reviewNote}` : ''}</td>
                    <td>{datetime(f.createdDate)}</td>
                    <td><StatusBadge status={f.status} /></td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        {nextStates(f.status).map(([target, label, cls]) => (
                          <button key={target} className={`btn ${cls} btn-sm`} onClick={() => setActing({ flag: f, target })}>{label}</button>
                        ))}
                        {f.status === 'CLEARED' && <span className="muted">closed</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {acting && <ReviewModal flag={acting.flag} target={acting.target} onClose={() => setActing(null)} onDone={() => { setActing(null); reload() }} />}
    </>
  )
}

function ReviewModal({ flag, target, onClose, onDone }) {
  const toast = useToast()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit() {
    setBusy(true)
    try {
      await api.put(`/compliance/transaction-flags/${flag.id}/review`, { status: target, note })
      toast.success(`Flag ${flag.transactionRef} → ${humanize(target)}`)
      onDone()
    } catch (e) { toast.error(errorMessage(e)) } finally { setBusy(false) }
  }
  return (
    <Modal title={`${humanize(target)} · ${flag.transactionRef}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'Saving…' : `Mark ${humanize(target)}`}</button></>}>
      <div className="kv"><span className="k">Amount</span><span className="v">{inr(flag.amount)}</span></div>
      <div className="kv"><span className="k">Reason</span><span className="v">{flag.reason}</span></div>
      <div className="mb-3" style={{ marginTop: 10 }}>
        <label className="form-label">Review note {target === 'ESCALATED' ? '(recommended)' : '(optional)'}</label>
        <textarea className="form-control" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reviewer comments…" />
      </div>
    </Modal>
  )
}
