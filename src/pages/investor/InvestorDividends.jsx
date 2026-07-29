
import { useFetch } from '../../lib/useFetch'
import { Card, EmptyRow, PageLoader, StatusBadge } from '../../components/ui'
import { humanize, inr, units } from '../../lib/format'

export default function InvestorDividends() {
  const { data, loading, error } = useFetch('/dividends/entitlements/mine')
  if (loading) return <PageLoader />

  const totalNet = (data ?? []).reduce((s, e) => s + (e.netDividend ?? 0), 0)

  return (
    <>
      <div className="page-head">
        <h1>Dividend History</h1>
        <p>Your dividend entitlements, tax deducted and payout mode</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <Card title="Entitlements" hint={`Total net received: ${inr(totalNet)}`}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Folio</th><th className="num">Units on Record Date</th><th className="num">Gross</th>
                <th className="num">Tax (TDS)</th><th className="num">Net</th><th>Payout Mode</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={7} text="No dividend entitlements yet." />}
              {data?.map((e) => (
                <tr key={e.id}>
                  <td><b>{e.folioNumber}</b></td>
                  <td className="num">{units(e.unitsOnRecordDate)}</td>
                  <td className="num">{inr(e.grossDividend)}</td>
                  <td className="num">{inr(e.taxDeducted)}</td>
                  <td className="num">{inr(e.netDividend)}</td>
                  <td><span className="badge blue">{humanize(e.payoutMode)}</span></td>
                  <td><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
