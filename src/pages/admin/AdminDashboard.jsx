
import { Link } from 'react-router-dom'
import { useFetch } from '../../lib/useFetch'
import { Card, EmptyRow, PageLoader, StatCard } from '../../components/ui'
import { humanize, inr } from '../../lib/format'

export default function AdminDashboard() {
  const stats = useFetch('/dashboard/admin')
  const aum = useFetch('/nav/aum-summary')
  if (stats.loading) return <PageLoader />
  if (stats.error) return <div className="alert alert-error">{stats.error}</div>
  const s = stats.data

  return (
    <>
      <div className="page-head">
        <h1>Platform Overview</h1>
        <p>AMC-wide operational statistics and assets under management</p>
      </div>

      <div className="grid cols-4">
        <StatCard label="Total AUM" value={inr(s.totalAum)} icon="₹" />
        <StatCard label="Active Schemes" value={`${s.activeSchemes} / ${s.totalSchemes}`} icon="▤" />
        <StatCard label="Investor Folios" value={s.totalFolios} icon="◧" />
        <StatCard label="Pending Transactions" value={s.pendingTransactions} icon="▦" />
      </div>
      <div className="grid cols-3 section-gap">
        <StatCard label="Total Users" value={s.totalUsers} icon="✓" />
        <StatCard label="Distributors" value={s.totalDistributors} icon="◈" />
        <StatCard label="Schemes" value={s.totalSchemes} icon="↻" />
      </div>

      <div className="section-gap">
        <Card title="Assets Under Management" hint="By scheme"
          action={<Link className="btn btn-ghost btn-sm" to="/admin/schemes">Manage Catalogue</Link>}>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Scheme</th><th>Category</th><th className="num">Latest NAV</th><th className="num">AUM</th></tr>
              </thead>
              <tbody>
                {(!aum.data || aum.data.length === 0) && <EmptyRow colSpan={4} />}
                {aum.data?.map((r) => (
                  <tr key={r.schemeId}>
                    <td><b>{r.schemeName}</b></td>
                    <td><span className="badge gray">{humanize(r.category)}</span></td>
                    <td className="num">{r.latestNav ?? '—'}</td>
                    <td className="num">{inr(r.totalAum)}</td>
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
