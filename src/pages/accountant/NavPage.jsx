
import { useMemo, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch, useOptionNavMap } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, PageLoader, StatusBadge } from '../../components/ui'
import { date, humanize, inr, num } from '../../lib/format'

export default function NavPage() {
  const toast = useToast()
  const schemes = useFetch('/schemes')
  const navByOption = useOptionNavMap(schemes.data)
  const [optionId, setOptionId] = useState('')
  const [navDate, setNavDate] = useState(new Date().toISOString().slice(0, 10))
  const [navValue, setNavValue] = useState('')
  const [busy, setBusy] = useState(false)

  const history = useFetch(optionId ? `/nav/option/${optionId}` : null)

  const options = useMemo(() => {
    const out = []
    schemes.data?.forEach((s) => s.options.forEach((o) => out.push({ id: o.id, label: `${s.schemeName} · ${humanize(o.optionType)}`, nav: navByOption[o.id] })))
    return out
  }, [schemes.data, navByOption])

  async function save(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.post('/nav', { optionId: Number(optionId), navDate, navValue: Number(navValue) })
      toast.success('NAV captured (provisional)'); setNavValue(''); history.reload()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  async function publish(rec) {
    try { await api.post(`/nav/${rec.id}/publish`); toast.success('NAV published — holdings revalued'); history.reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  if (schemes.loading) return <PageLoader />

  return (
    <>
      <div className="page-head">
        <h1>NAV Entry</h1>
        <p>Capture daily NAV inputs and publish to revalue investor holdings</p>
      </div>

      <div className="grid cols-2">
        <Card title="Capture NAV">
          <form onSubmit={save}>
            <div className="field">
              <label>Scheme Option</label>
              <select value={optionId} onChange={(e) => setOptionId(e.target.value)} required>
                <option value="">Select…</option>
                {options.map((o) => <option key={o.id} value={o.id}>{o.label}{o.nav ? ` (NAV ${num(o.nav, 4)})` : ''}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="field">
                <label>NAV Date</label>
                <input type="date" value={navDate} onChange={(e) => setNavDate(e.target.value)} required />
              </div>
              <div className="field">
                <label>NAV Value (₹)</label>
                <input type="number" min="0.0001" step="0.0001" value={navValue} onChange={(e) => setNavValue(e.target.value)} required />
              </div>
            </div>
            <button className="btn btn-primary btn-block" disabled={busy || !optionId}>{busy ? 'Saving…' : 'Capture NAV'}</button>
          </form>
        </Card>

        <Card title="NAV History" hint={optionId ? 'Latest first' : 'Select an option to view history'}>
          {!optionId ? <div className="empty">No option selected</div> : history.loading ? <PageLoader /> : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Date</th><th className="num">NAV</th><th className="num">AUM</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {(!history.data || history.data.length === 0) && <EmptyRow colSpan={5} />}
                  {history.data?.map((r) => (
                    <tr key={r.id}>
                      <td>{date(r.navDate)}</td>
                      <td className="num">{num(r.navValue, 4)}</td>
                      <td className="num">{inr(r.totalAum)}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>{r.status !== 'PUBLISHED'
                        ? <button className="btn btn-teal btn-sm" onClick={() => publish(r)}>Publish</button>
                        : <span className="muted">Published</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
