
import { useFetch } from '../../lib/useFetch'
import { Card, EmptyRow, PageLoader, StatusBadge } from '../../components/ui'
import { date, inr, pct } from '../../lib/format'

export default function CommissionsPage() {
  const { data, loading, error } = useFetch('/commissions/mine')
  if (loading) return <PageLoader />

  const totalPaid = (data ?? []).filter((c) => c.status === 'PAID').reduce((s, c) => s + (c.commissionAmount ?? 0), 0)

  return (
    <>
      <div className="page-head">
        <h1>Trail Commission Statement</h1>
        <p>Commission computed on assets under management, by scheme and billing period</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <Card title="Commission History" hint={`Total paid to date: ${inr(totalPaid)}`}>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Period</th><th>Scheme</th><th className="num">AUM Managed</th>
                <th className="num">Trail Rate</th><th className="num">Commission</th><th>Payout Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={7} text="No commissions computed yet." />}
              {data?.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.period}</b></td>
                  <td>{c.schemeName}</td>
                  <td className="num">{inr(c.aumManaged)}</td>
                  <td className="num">{pct(c.trailRate)}</td>
                  <td className="num">{inr(c.commissionAmount)}</td>
                  <td>{date(c.payoutDate)}</td>
                  <td><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
