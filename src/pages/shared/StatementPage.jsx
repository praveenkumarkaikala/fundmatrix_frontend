
import { useMemo, useState } from 'react'
import { useFetch } from '../../lib/useFetch'
import { Card, EmptyRow, PageLoader, StatusBadge } from '../../components/ui'
import { datetime, humanize, inr, num, units } from '../../lib/format'

const FILTERS = ['ALL', 'RECEIVED', 'ACCEPTED', 'ALLOTTED', 'REJECTED']

export default function StatementPage() {
  const { data, loading, error } = useFetch('/transactions')
  const [filter, setFilter] = useState('ALL')

  const rows = useMemo(
    () => (data ?? []).filter((t) => filter === 'ALL' || t.status === filter),
    [data, filter],
  )

  if (loading) return <PageLoader />

  return (
    <>
      <div className="page-head">
        <h1>Account Statement</h1>
        <p>Complete transaction history with allotment details</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="pill-filter">
        {FILTERS.map((f) => (
          <span key={f} className={`pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {humanize(f)}{f !== 'ALL' && data ? ` (${data.filter((t) => t.status === f).length})` : ''}
          </span>
        ))}
      </div>

      <Card>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Reference</th><th>Date</th><th>Scheme</th><th>Type</th>
                <th className="num">Amount</th><th className="num">Units</th><th className="num">NAV</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={8} />}
              {rows.map((t) => (
                <tr key={t.id}>
                  <td><b>{t.transactionRef}</b>{t.remarks && <div className="muted" style={{ fontSize: 11.5 }}>{t.remarks}</div>}</td>
                  <td>{datetime(t.transactionDate)}</td>
                  <td>{t.schemeName}<div className="muted" style={{ fontSize: 11.5 }}>{humanize(t.optionType)}</div></td>
                  <td><span className="badge gray">{humanize(t.transactionType)}</span></td>
                  <td className="num">{inr(t.amount)}</td>
                  <td className="num">{t.units != null ? units(t.units) : '—'}</td>
                  <td className="num">{t.applicableNav != null ? num(t.applicableNav, 4) : '—'}</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
