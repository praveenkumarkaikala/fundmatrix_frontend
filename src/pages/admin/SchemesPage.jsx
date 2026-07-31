
import { Fragment, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { humanize, inr, num, pct } from '../../lib/format'

const CATEGORIES = ['EQUITY', 'DEBT', 'HYBRID', 'LIQUID', 'ETF', 'ELSS', 'FOF']
const RISKS = ['LOW', 'MODERATE', 'HIGH']
const SCHEME_STATUS = ['ACTIVE', 'NFO_OPEN', 'CLOSED', 'WOUND_UP']
const OPTION_TYPES = ['GROWTH', 'DIVIDEND_PAYOUT', 'DIVIDEND_REINVESTMENT']

export default function SchemesPage() {
  const { data, loading, reload } = useFetch('/schemes')
  const [showCreate, setShowCreate] = useState(false)
  const [addOptionFor, setAddOptionFor] = useState(null)
  const [configFor, setConfigFor] = useState(null)
  const [expanded, setExpanded] = useState(null)

  if (loading) return <PageLoader />

  return (
    <>
      <div className="page-head d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1>Scheme Catalogue</h1>
          <p>Build and configure fund schemes, fee structures and plan options</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Scheme</button>
      </div>

      <Card>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Scheme</th><th>Code</th><th>Category</th><th>Risk</th>
                <th className="num">Min Inv.</th><th className="num">Expense</th><th>Options</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={9} />}
              {data?.map((s) => (
                <Fragment key={s.id}>
                  <tr>
                    <td><b>{s.schemeName}</b><div className="muted" style={{ fontSize: 11.5 }}>{s.benchmarkIndex}</div></td>
                    <td>{s.schemeCode}</td>
                    <td><span className="badge gray">{humanize(s.category)}</span></td>
                    <td><span className={`badge ${s.riskProfile === 'HIGH' ? 'red' : s.riskProfile === 'MODERATE' ? 'amber' : 'green'}`}>{humanize(s.riskProfile)}</span></td>
                    <td className="num">{inr(s.minInvestment)}</td>
                    <td className="num">{pct(s.expenseRatio)}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>{s.options.length} ▾</button></td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => setConfigFor(s)}>Config</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAddOptionFor(s)}>+ Option</button>
                      </div>
                    </td>
                  </tr>
                  {expanded === s.id && (
                    <tr>
                      <td colSpan={9} style={{ background: 'var(--slate-50)' }}>
                        <table className="table" style={{ background: 'transparent' }}>
                          <thead><tr><th>Option</th><th>ISIN</th><th className="num">Latest NAV</th><th>Status</th></tr></thead>
                          <tbody>
                            {s.options.length === 0 && <EmptyRow colSpan={4} text="No options yet." />}
                            {s.options.map((o) => (
                              <tr key={o.id}>
                                <td>{humanize(o.optionType)}</td>
                                <td>{o.isin ?? '—'}</td>
                                <td className="num">{num(o.latestNav, 4)}</td>
                                <td><StatusBadge status={o.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showCreate && <SchemeModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); reload() }} />}
      {addOptionFor && <OptionModal scheme={addOptionFor} onClose={() => setAddOptionFor(null)} onDone={() => { setAddOptionFor(null); reload() }} />}
      {configFor && <ConfigSchemeModal scheme={configFor} onClose={() => setConfigFor(null)} onDone={() => { setConfigFor(null); reload() }} />}
    </>
  )
}

function ConfigSchemeModal({ scheme, onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({
    minInvestment: scheme.minInvestment ?? '', expenseRatio: scheme.expenseRatio ?? '',
    exitLoadSlab: scheme.exitLoadSlab ?? '', exitLoadRate: scheme.exitLoadRate ?? '',
    exitLoadPeriodDays: scheme.exitLoadPeriodDays ?? '', minSipAmount: scheme.minSipAmount ?? '',
    minSwpAmount: scheme.minSwpAmount ?? '', cutoffTime: scheme.cutoffTime ?? '', status: scheme.status,
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const numOrUndef = (v) => (v !== '' && v != null ? Number(v) : undefined)

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.put(`/schemes/${scheme.id}`, {
        schemeName: scheme.schemeName, schemeCode: scheme.schemeCode, category: scheme.category,
        riskProfile: scheme.riskProfile, benchmarkIndex: scheme.benchmarkIndex || undefined,
        fundManagerName: scheme.fundManagerName || undefined,
        minInvestment: numOrUndef(f.minInvestment), expenseRatio: numOrUndef(f.expenseRatio),
        exitLoadSlab: f.exitLoadSlab || undefined, exitLoadRate: numOrUndef(f.exitLoadRate),
        exitLoadPeriodDays: numOrUndef(f.exitLoadPeriodDays),
        minSipAmount: numOrUndef(f.minSipAmount), minSwpAmount: numOrUndef(f.minSwpAmount),
        cutoffTime: f.cutoffTime || undefined, status: f.status,
      })
      toast.success('Scheme configuration saved'); onDone()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <Modal title={`Configure · ${scheme.schemeName}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="config-form" disabled={busy}>{busy ? 'Saving…' : 'Save Config'}</button></>}>
      <form id="config-form" onSubmit={submit}>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Min Investment (₹)</label><input className="form-control" type="number" value={f.minInvestment} onChange={set('minInvestment')} /></div>
          <div className="mb-3"><label className="form-label">Expense Ratio / TER (%)</label><input className="form-control" type="number" step="0.0001" value={f.expenseRatio} onChange={set('expenseRatio')} /></div>
        </div>
        <div className="hint" style={{ margin: '8px 0 4px', fontWeight: 600 }}>SIP / SWP rules</div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Min SIP Amount (₹)</label><input className="form-control" type="number" value={f.minSipAmount} onChange={set('minSipAmount')} placeholder="e.g. 1000" /></div>
          <div className="mb-3"><label className="form-label">Min SWP Amount (₹)</label><input className="form-control" type="number" value={f.minSwpAmount} onChange={set('minSwpAmount')} placeholder="e.g. 1000" /></div>
        </div>
        <div className="hint" style={{ margin: '8px 0 4px', fontWeight: 600 }}>Cut-off & exit load</div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Cut-off Time (HH:mm)</label><input className="form-control" value={f.cutoffTime} onChange={set('cutoffTime')} placeholder="15:00 (blank = category default)" /></div>
          <div className="mb-3"><label className="form-label">Status</label><select className="form-select" value={f.status} onChange={set('status')}>{SCHEME_STATUS.map((x) => <option key={x} value={x}>{humanize(x)}</option>)}</select></div>
        </div>
        <div className="mb-3"><label className="form-label">Exit Load Slab</label><input className="form-control" value={f.exitLoadSlab} onChange={set('exitLoadSlab')} placeholder="1% if redeemed within 365 days" /></div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Exit Load Rate (%)</label><input className="form-control" type="number" step="0.0001" value={f.exitLoadRate} onChange={set('exitLoadRate')} /></div>
          <div className="mb-3"><label className="form-label">Exit Load Period (days)</label><input className="form-control" type="number" value={f.exitLoadPeriodDays} onChange={set('exitLoadPeriodDays')} /></div>
        </div>
      </form>
    </Modal>
  )
}

function SchemeModal({ onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({
    schemeName: '', schemeCode: '', category: 'EQUITY', riskProfile: 'MODERATE', benchmarkIndex: '',
    fundManagerName: '', minInvestment: '5000', expenseRatio: '1.5', exitLoadSlab: '', exitLoadRate: '',
    exitLoadPeriodDays: '', status: 'ACTIVE',
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.post('/schemes', {
        schemeName: f.schemeName, schemeCode: f.schemeCode, category: f.category, riskProfile: f.riskProfile,
        benchmarkIndex: f.benchmarkIndex || undefined, fundManagerName: f.fundManagerName || undefined,
        minInvestment: f.minInvestment ? Number(f.minInvestment) : undefined,
        expenseRatio: f.expenseRatio ? Number(f.expenseRatio) : undefined,
        exitLoadSlab: f.exitLoadSlab || undefined,
        exitLoadRate: f.exitLoadRate ? Number(f.exitLoadRate) : undefined,
        exitLoadPeriodDays: f.exitLoadPeriodDays ? Number(f.exitLoadPeriodDays) : undefined,
        status: f.status,
      })
      toast.success('Scheme created'); onDone()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <Modal title="New Fund Scheme" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="scheme-form" disabled={busy}>{busy ? 'Saving…' : 'Create Scheme'}</button></>}>
      <form id="scheme-form" onSubmit={submit}>
        <div className="mb-3"><label className="form-label">Scheme Name</label><input className="form-control" value={f.schemeName} onChange={set('schemeName')} required /></div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Scheme Code</label><input className="form-control" value={f.schemeCode} onChange={set('schemeCode')} required /></div>
          <div className="mb-3"><label className="form-label">Status</label><select className="form-select" value={f.status} onChange={set('status')}>{SCHEME_STATUS.map((x) => <option key={x} value={x}>{humanize(x)}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Category</label><select className="form-select" value={f.category} onChange={set('category')}>{CATEGORIES.map((x) => <option key={x} value={x}>{humanize(x)}</option>)}</select></div>
          <div className="mb-3"><label className="form-label">Risk Profile</label><select className="form-select" value={f.riskProfile} onChange={set('riskProfile')}>{RISKS.map((x) => <option key={x} value={x}>{humanize(x)}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Benchmark Index</label><input className="form-control" value={f.benchmarkIndex} onChange={set('benchmarkIndex')} /></div>
          <div className="mb-3"><label className="form-label">Fund Manager</label><input className="form-control" value={f.fundManagerName} onChange={set('fundManagerName')} /></div>
        </div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Min Investment (₹)</label><input className="form-control" type="number" value={f.minInvestment} onChange={set('minInvestment')} /></div>
          <div className="mb-3"><label className="form-label">Expense Ratio (%)</label><input className="form-control" type="number" step="0.0001" value={f.expenseRatio} onChange={set('expenseRatio')} /></div>
        </div>
        <div className="mb-3"><label className="form-label">Exit Load Slab (description)</label><input className="form-control" value={f.exitLoadSlab} onChange={set('exitLoadSlab')} placeholder="1% if redeemed within 365 days" /></div>
        <div className="form-row">
          <div className="mb-3"><label className="form-label">Exit Load Rate (%)</label><input className="form-control" type="number" step="0.0001" value={f.exitLoadRate} onChange={set('exitLoadRate')} /></div>
          <div className="mb-3"><label className="form-label">Exit Load Period (days)</label><input className="form-control" type="number" value={f.exitLoadPeriodDays} onChange={set('exitLoadPeriodDays')} /></div>
        </div>
      </form>
    </Modal>
  )
}

function OptionModal({ scheme, onClose, onDone }) {
  const toast = useToast()
  const [optionType, setType] = useState('GROWTH')
  const [isin, setIsin] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try { await api.post(`/schemes/${scheme.id}/options`, { optionType, isin: isin || undefined, status: 'ACTIVE' }); toast.success('Option added'); onDone() }
    catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return (
    <Modal title={`Add Option · ${scheme.schemeName}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="opt-form" disabled={busy}>{busy ? 'Saving…' : 'Add Option'}</button></>}>
      <form id="opt-form" onSubmit={submit}>
        <div className="mb-3"><label className="form-label">Option Type</label><select className="form-select" value={optionType} onChange={(e) => setType(e.target.value)}>{OPTION_TYPES.map((x) => <option key={x} value={x}>{humanize(x)}</option>)}</select></div>
        <div className="mb-3"><label className="form-label">ISIN</label><input className="form-control" value={isin} onChange={(e) => setIsin(e.target.value)} placeholder="INF000A0XXXX" /></div>
      </form>
    </Modal>
  )
}
