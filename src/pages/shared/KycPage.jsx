
import { useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, PageLoader, StatusBadge } from '../../components/ui'
import { date, humanize } from '../../lib/format'

const STATUSES = ['ALL', 'PENDING', 'COMPLIANT', 'NON_COMPLIANT', 'EXPIRED']

// Staff (Fund Ops / Compliance) view: VERIFY investor-submitted KYC only.
// Investors submit their own KYC from the Investor Portal; staff validate it here.
export default function KycPage() {
  const toast = useToast()
  const [filter, setFilter] = useState('ALL')
  const url = filter === 'ALL' ? '/kyc' : `/kyc?status=${filter}`
  const { data, loading, reload } = useFetch(url)

  async function setStatus(rec, kycStatus) {
    try {
      await api.patch(`/kyc/${rec.id}/status`, { kycStatus })
      toast.success(`KYC for ${rec.investorName} → ${humanize(kycStatus)}`)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>KYC Verification</h1>
        <p>Review and validate investor-submitted KYC. Investors upload their own KYC; you verify it.</p>
      </div>

      <div className="pill-filter">
        {STATUSES.map((s) => (
          <span key={s} className={`pill ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{humanize(s)}</span>
        ))}
      </div>

      <Card hint="Pending records are awaiting your verification">
        {loading ? <PageLoader /> : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr><th>Investor</th><th>KYC Type</th><th>Document</th><th>Reference</th><th>Verified</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {(!data || data.length === 0) && <EmptyRow colSpan={7} />}
                {data?.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.investorName}</b></td>
                    <td>{humanize(r.kycType)}</td>
                    <td>{r.documentType ?? '—'}</td>
                    <td>{r.documentRef ?? '—'}</td>
                    <td>{date(r.verifiedDate)}</td>
                    <td><StatusBadge status={r.kycStatus} /></td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        {r.kycStatus !== 'COMPLIANT' && <button className="btn btn-teal btn-sm" onClick={() => setStatus(r, 'COMPLIANT')}>Approve</button>}
                        {r.kycStatus !== 'NON_COMPLIANT' && <button className="btn btn-danger btn-sm" onClick={() => setStatus(r, 'NON_COMPLIANT')}>Reject</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
