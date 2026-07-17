
import { useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { date, humanize } from '../../lib/format'

const TYPES = ['FULL', 'SIMPLIFIED', 'EKYC']

export default function InvestorKycPage() {
  const toast = useToast()
  const { data, loading, reload } = useFetch('/kyc/mine')
  const [showSubmit, setShowSubmit] = useState(false)

  const records = data ?? []
  const isCompliant = records.some((r) => r.kycStatus === 'COMPLIANT')
  const isPending = records.some((r) => r.kycStatus === 'PENDING')

  if (loading) return <PageLoader />

  return (
    <>
      <div className="page-head row-between">
        <div>
          <h1>KYC Verification</h1>
          <p>Submit your KYC details for verification. Your fund operator reviews and approves them.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>+ Submit KYC</button>
      </div>

      {isCompliant && <div className="alert alert-success">Your KYC is verified and compliant.</div>}
      {!isCompliant && isPending && <div className="alert alert-warn">Your KYC has been submitted and is pending verification by the fund operator.</div>}
      {records.length === 0 && <div className="alert alert-warn">You have not submitted any KYC yet. Submit your details to complete onboarding.</div>}

      <Card title="My KYC Records" hint="Verification is performed by Fund Operations / Compliance">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>KYC Type</th><th>Document Type</th><th>Reference</th><th>Verified On</th><th>Status</th></tr>
            </thead>
            <tbody>
              {records.length === 0 && <EmptyRow colSpan={5} text="No KYC submitted yet." />}
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{humanize(r.kycType)}</td>
                  <td>{r.documentType ?? '—'}</td>
                  <td>{r.documentRef ?? '—'}</td>
                  <td>{date(r.verifiedDate)}</td>
                  <td><StatusBadge status={r.kycStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showSubmit && <SubmitKycModal types={TYPES} onClose={() => setShowSubmit(false)} onDone={() => { setShowSubmit(false); reload() }} />}
    </>
  )
}

function SubmitKycModal({ types, onClose, onDone }) {
  const toast = useToast()
  const [form, setForm] = useState({ kycType: 'FULL', documentType: 'PAN', documentRef: '' })
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.post('/kyc', { kycType: form.kycType, documentType: form.documentType, documentRef: form.documentRef })
      toast.success('KYC submitted — pending verification')
      onDone()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <Modal title="Submit KYC Details" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="kyc-submit-form" disabled={busy}>{busy ? 'Submitting…' : 'Submit for Verification'}</button></>}>
      <form id="kyc-submit-form" onSubmit={submit}>
        <div className="field">
          <label>KYC Type</label>
          <select value={form.kycType} onChange={(e) => setForm({ ...form, kycType: e.target.value })}>
            {types.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Document Type</label>
          <input value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} placeholder="PAN / Aadhaar / Passport" required />
        </div>
        <div className="field">
          <label>Document Reference / Number</label>
          <input value={form.documentRef} onChange={(e) => setForm({ ...form, documentRef: e.target.value })} placeholder="e.g. ABCDE1234F" required />
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
          Your fund operator will verify these details and update your KYC status. You will be notified once verified.
        </p>
      </form>
    </Modal>
  )
}
