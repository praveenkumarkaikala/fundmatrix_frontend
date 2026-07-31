
import { Link } from 'react-router-dom'
import { useFetch } from '../../lib/useFetch'
import { Card, EmptyRow, PageLoader, StatCard, StatusBadge } from '../../components/ui'
import { inr } from '../../lib/format'

export default function DistributorDashboard() {
  const dash = useFetch('/dashboard/distributor')
  const folios = useFetch('/folios')
  if (dash.loading) return <PageLoader />
  if (dash.error) return <div className="alert alert-danger">{dash.error}</div>
  const d = dash.data

  return (
    <>
      <div className="page-head">
        <h1>{d.distributorName}</h1>
        <p>ARN {d.arnNumber ?? '—'} · Distributor performance overview</p>
      </div>

      <div className="grid cols-4">
        <StatCard label="AUM Managed" value={inr(d.aumManaged)} icon="₹" />
        <StatCard label="Client Folios" value={d.clientFolioCount} icon="▤" />
        <StatCard label="Commission Earned" value={inr(d.commissionEarnedToDate)} icon="◈" />
        <StatCard label="Commission Pending" value={inr(d.commissionPending)} icon="↻" />
      </div>

      <div className="mt-4">
        <Card title="Client Folios" hint={`${folios.data?.length ?? 0} folios serviced`}
          action={<Link className="btn btn-ghost btn-sm" to="/distributor/commissions">View Commissions</Link>}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr><th>Folio</th><th>Investor</th><th>Tax Status</th><th className="num">Current Value</th><th>Status</th></tr>
              </thead>
              <tbody>
                {(!folios.data || folios.data.length === 0) && <EmptyRow colSpan={5} />}
                {folios.data?.map((f) => (
                  <tr key={f.id}>
                    <td><b>{f.folioNumber}</b></td>
                    <td>{f.investorName}</td>
                    <td>{f.taxStatus}</td>
                    <td className="num">{inr(f.currentValue)}</td>
                    <td><StatusBadge status={f.status} /></td>
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
