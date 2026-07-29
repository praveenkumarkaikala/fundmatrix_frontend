
import { useFetch } from '../../lib/useFetch'
import { Card, EmptyRow, PageLoader, StatCard } from '../../components/ui'
import { humanize, inr, num, units } from '../../lib/format'

export default function AumPage() {
  const { data, loading, error } = useFetch('/nav/aum-summary')
  if (loading) return <PageLoader />
  if (error) return <div className="alert alert-danger">{error}</div>

  const rows = data ?? []
  const total = rows.reduce((s, r) => s + (r.totalAum ?? 0), 0)
  const max = Math.max(...rows.map((r) => r.totalAum ?? 0), 1)

  return (
    <>
      <div className="page-head">
        <h1>AUM Tracker</h1>
        <p>Assets under management across the scheme catalogue</p>
      </div>

      <div className="grid cols-3">
        <StatCard label="Total AUM" value={inr(total)} icon="₹" />
        <StatCard label="Schemes" value={rows.length} icon="▤" />
        <StatCard label="Avg AUM / Scheme" value={inr(rows.length ? total / rows.length : 0)} icon="◈" />
      </div>

      <div className="mt-4">
        <Card title="Scheme-wise AUM">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr><th>Scheme</th><th>Code</th><th>Category</th><th className="num">Latest NAV</th><th className="num">Units O/S</th><th className="num">AUM</th><th>Share</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && <EmptyRow colSpan={7} />}
                {rows.map((r) => (
                  <tr key={r.schemeId}>
                    <td><b>{r.schemeName}</b></td>
                    <td>{r.schemeCode}</td>
                    <td><span className="badge gray">{humanize(r.category)}</span></td>
                    <td className="num">{num(r.latestNav, 4)}</td>
                    <td className="num">{units(r.totalUnitsOutstanding)}</td>
                    <td className="num">{inr(r.totalAum)}</td>
                    <td style={{ minWidth: 120 }}>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${((r.totalAum ?? 0) / max) * 100}%` }} /></div>
                    </td>
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
