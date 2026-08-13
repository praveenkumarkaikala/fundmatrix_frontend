
import { useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { date, humanize } from '../../lib/format'

const TYPES = ['FULL', 'SIMPLIFIED', 'EKYC']
const DOCUMENTS=["PAN", "Aadhaar", "Passport", "VoterID"]
export default function InvestorKycPage() {
  const toast = useToast()
  const { data, loading, reload } = useFetch('/kyc/mine')
  const [showSubmit, setShowSubmit] = useState(false)
  const [reSubmit, setReSubmit] = useState(false)
  const record = data ?data: null
  const isCompliant = record?.kycStatus === 'COMPLIANT'
  const isPending = record?.kycStatus==="PENDING"

  if (loading) return <PageLoader />

  return (
    <>
      <div className="page-head d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1>KYC Verification</h1>
          <p>Submit your KYC details for verification. Your fund operator reviews and approves them.</p>
        </div>
        {(!isCompliant && record==null)&& <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>+ Submit KYC</button>}
      </div>

      {isCompliant && <div className="alert alert-success">Your KYC is verified and compliant.</div>}
      {!isCompliant && isPending && <div className="alert alert-warning">Your KYC has been submitted and is pending verification by the fund operator.</div>}
      {record ===null && <div className="alert alert-warning">You have not submitted any KYC yet. Submit your details to complete onboarding.</div>}

      <Card title="My KYC Record" hint="Verification is performed by Fund Operations / Compliance">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr><th>KYC Type</th><th>Document Type</th><th>Reference</th><th>Verified On</th><th>Status</th> {!isCompliant && !isPending && <th>Action</th>}</tr>
            </thead>
            <tbody>
              {record=== null && <EmptyRow colSpan={5} text="No KYC submitted yet." />}
             {
              record && (

                <tr key={record.id}>
                  <td>{humanize(record?.kycType)}</td>
                  <td>{record?.documentType ?? '—'}</td>
                  <td>{record?.documentRef ?? '—'}</td>
                  <td>{date(record?.verifiedDate)}</td>
                  <td><StatusBadge status={record?.kycStatus} /></td>
                   {!isCompliant && !isPending && <td> <button className="btn btn-teal btn-sm" onClick={()=> setReSubmit(true)}>ReSubmit</button></td>}
                </tr>
              )
             }
             
            </tbody>
          </table>
        </div>
      </Card>

              {showSubmit && <SubmitKycModal documentTypes={DOCUMENTS} types={TYPES} onClose={() => setShowSubmit(false)} onDone={() => { setShowSubmit(false); reload() }}  data={null}/>}
              {reSubmit && <SubmitKycModal documentTypes={DOCUMENTS} types={TYPES} onClose={() => setReSubmit(false)} onDone={() => { setReSubmit(false); reload() }}  data={record}/>}
    </>
  )
}

function SubmitKycModal({ documentTypes,types, onClose, onDone,data }) {
  const toast = useToast()
  const [form, setForm] = useState({ kycType: data?.kycType || "FULL", documentType: data?.documentType || "PAN", documentRef: data?.documentRef || "" })
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); 
    setBusy(true)
    try {
      if(data)
      {
        await api.put (`/kyc/${data.id}`, { kycType: form.kycType, documentType: form.documentType, documentRef: form.documentRef })
        toast.success('KYC resubmitted — pending verification')
      }
      else {
        await api.post('/kyc', { kycType: form.kycType, documentType: form.documentType, documentRef: form.documentRef })
        toast.success('KYC submitted — pending verification')
      }
    } catch (err) { 
      console.log(err.response);
      toast.error(errorMessage(err)) } finally {  
      setBusy(false)
      onDone() }
   
  }

  return (
    <Modal title="Submit KYC Details" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="kyc-submit-form" disabled={busy}>{busy ? 'Submitting…' : 'Submit for Verification'}</button></>}>
      <form id="kyc-submit-form" onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">KYC Type</label>
          <select className="form-select" value={form.kycType} onChange={(e) => setForm({ ...form, kycType: e.target.value })}>
            {types.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Document Type</label>
          <select className="form-select" value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })}>
            {documentTypes.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Document Reference / Number</label>
          <input className="form-control" value={form.documentRef} onChange={(e) => setForm({ ...form, documentRef: e.target.value })} placeholder="e.g. ABCDE1234F" required />
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
          Your fund operator will verify these details and update your KYC status. You will be notified once verified.
        </p>
      </form>
    </Modal>
  )
}
