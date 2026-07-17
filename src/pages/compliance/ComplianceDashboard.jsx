
import { Link } from 'react-router-dom'
import { useFetch } from '../../lib/useFetch'
import { Card, EmptyRow, PageLoader, StatCard, StatusBadge } from '../../components/ui'
import { datetime, humanize, inr } from '../../lib/format'

export default function ComplianceDashboard() {
  const { data, loading, error } = useFetch('/dashboard/compliance')
  if (loading) return <PageLoader />
  if (error) return <div className="alert alert-error">{error}</div>
  const d = data

  return (
    <>
      <div className="page-head">
        <h1>Compliance Overview</h1>
        <p>KYC compliance posture and flagged transaction monitoring</p>
      </div>

      <div className="grid cols-4">
        <StatCard label="Compliant" value={d.compliantCount} icon="✓" />
        <StatCard label="Pending" value={d.pendingCount} icon="◷" />
        <StatCard label="Non-Compliant" value={d.nonCompliantCount} icon="⚠" />
        <StatCard label="Expired" value={d.expiredCount} icon="⊗" />
      </div>

      <div className="section-gap">
        <Card title="Flagged Transactions" hint={`${d.flaggedTransactionCount} high-value transaction(s) ≥ ₹10,00,000`}
          action={<Link className="btn btn-ghost btn-sm" to="/compliance/kyc">KYC Tracker</Link>}>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Reference</th><th>Date</th><th>Folio</th><th>Scheme</th><th>Type</th><th className="num">Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {d.flaggedTransactions.length === 0 && <EmptyRow colSpan={7} text="No flagged transactions." />}
                {d.flaggedTransactions.map((t) => (
                  <tr key={t.id}>
                    <td><b>{t.transactionRef}</b></td>
                    <td>{datetime(t.transactionDate)}</td>
                    <td>{t.folioNumber}</td>
                    <td>{t.schemeName}</td>
                    <td>{humanize(t.transactionType)}</td>
                    <td className="num">{inr(t.amount)}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  )
}
