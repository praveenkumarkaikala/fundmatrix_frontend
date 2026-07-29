
import { Link } from 'react-router-dom'
import { useFetch } from '../../lib/useFetch'
import { PageLoader, StatCard, Card, EmptyRow } from '../../components/ui'
import { inr, num, units } from '../../lib/format'

export default function InvestorDashboard() {
  const { data, loading, error } = useFetch('/dashboard/investor')
  if (loading) return <PageLoader />
  if (error) return <div className="alert alert-danger">{error}</div>
  if (!data) return null

  const gain = data.unrealisedGainLoss ?? 0
  const gainPct = data.totalInvested > 0 ? (gain / data.totalInvested) * 100 : 0
  const maxValue = Math.max(...data.holdings.map((h) => h.currentValue ?? 0), 1)

  return (
    <>
      <div className="page-head">
        <h1>Portfolio Dashboard</h1>
        <p>Your consolidated holdings, valuation and systematic investments</p>
      </div>

      <div className="grid cols-4">
        <StatCard label="Current Value" value={inr(data.currentValue)} icon="₹" />
        <StatCard label="Total Invested" value={inr(data.totalInvested)} icon="◧" />
        <StatCard
          label="Unrealised P&L"
          value={inr(gain)}
          icon="◈"
          delta={{ text: `${gain >= 0 ? '▲' : '▼'} ${num(Math.abs(gainPct))}%`, up: gain >= 0 }}
        />
        <StatCard label="Active SIPs" value={data.activeSipCount} icon="↻" />
      </div>

      <div className="mt-4">
        <Card
          title="Holdings"
          hint={`${data.holdings.length} scheme option${data.holdings.length === 1 ? '' : 's'} across ${data.folioCount} folio${data.folioCount === 1 ? '' : 's'}`}
          action={<Link className="btn btn-primary btn-sm" to="/transact">Transact</Link>}
        >
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Scheme</th>
                  <th>Option</th>
                  <th className="num">Units</th>
                  <th className="num">Avg NAV</th>
                  <th className="num">Latest NAV</th>
                  <th className="num">Current Value</th>
                  <th className="num">P&L</th>
                  <th>Allocation</th>
                </tr>
              </thead>
              <tbody>
                {data.holdings.length === 0 && <EmptyRow colSpan={8} text="No holdings yet — place your first subscription." />}
                {data.holdings.map((h) => {
                  const pl = h.unrealisedGainLoss ?? 0
                  return (
                    <tr key={h.id}>
                      <td>{h.schemeName}</td>
                      <td><span className="badge gray">{h.optionType.replace(/_/g, ' ')}</span></td>
                      <td className="num">{units(h.unitsHeld)}</td>
                      <td className="num">{num(h.averageCostNav, 4)}</td>
                      <td className="num">{num(h.latestNav, 4)}</td>
                      <td className="num">{inr(h.currentValue)}</td>
                      <td className="num" style={{ color: pl >= 0 ? 'var(--green-500)' : 'var(--rose-500)' }}>
                        {inr(pl)}
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${((h.currentValue ?? 0) / maxValue) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  )
}
