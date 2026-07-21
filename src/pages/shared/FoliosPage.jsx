
import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { humanize, inr, num, units } from '../../lib/format'
import { Link } from 'react-router-dom'

const TAX = ['INDIVIDUAL', 'HUF', 'CORPORATE', 'NRI', 'MINOR']
const MODES = ['SINGLE', 'JOINT', 'ANYONE_OR_SURVIVOR']

export default function FoliosPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useFetch('/folios')
  const [showCreate, setShowCreate] = useState(false)
  const [holdingsFor, setHoldingsFor] = useState(null)
  const [transactionsFor, setTransactionFor] = useState(null)
  const kyc = useFetch(user?.role === 'INVESTOR' ? '/kyc/mine' : null)
  const isStaff = user?.role === 'FUND_OPS' || user?.role === 'ADMIN'
  const canCreate = user && ['INVESTOR', 'DISTRIBUTOR', 'FUND_OPS', 'ADMIN'].includes(user.role)

// useEffect(()=>{
//   console.log("kyc",kyc);
// },[kyc])

const kycVerified = (kyc?.data?.kycStatus !=="COMPLIANT" && user.role=="INVESTOR") || false
  if (kycVerified) {
    return (
      <>
        <div className="page-head">
          <h1>Place a Transaction</h1>
          <p>Subscriptions, redemptions and switches require a verified KYC</p>
        </div>
        <Card title="KYC verification required">
          <div className="alert alert-warn">
            Your KYC is not yet verified. You can place subscriptions, redemptions and switches only
            after your KYC has been verified (COMPLIANT) by the fund operator.
          </div>
          <Link className="btn btn-primary" to="/kyc">Go to KYC Verification</Link>
        </Card>
      </>
    )
  }

  async function changeStatus(f, status) {
    try {
      await api.patch(`/folios/${f.id}/status`, { status })
      toast.success(`Folio ${f.folioNumber} → ${humanize(status)}`)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  if (loading) return <PageLoader />

  return (
    <>
      <div className="page-head row-between">
        <div>
          <h1>{user?.role === 'INVESTOR' ? 'My Folios' : user?.role === 'DISTRIBUTOR' ? 'Client Folios' : 'Folio Manager'}</h1>
          <p>Folios, holdings and lifecycle status</p>
        </div>
        {canCreate && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Folio</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <Card>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Folio No.</th>
                <th>Investor</th>
                <th>Distributor</th>
                <th>Tax Status</th>
                <th>Holding Mode</th>
                <th className="num">Current Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={8} />}
              {data?.map((f) => (
                <tr key={f.id}>
                  <td><b>{f.folioNumber}</b></td>
                  <td>{f.investorName}</td>
                  <td>{f.distributorName ?? <span className="muted">Direct</span>}</td>
                  <td>{humanize(f.taxStatus)}</td>
                  <td>{humanize(f.modeOfHolding)}</td>
                  <td className="num">{inr(f.currentValue)}</td>
                  <td><StatusBadge status={f.status} /></td>
                  <td>
                    <div className="btn-row">
                      <button className="btn btn-ghost btn-sm" onClick={() => setHoldingsFor(f)}>Holdings</button>
                       <button className="btn btn-ghost btn-sm" onClick={() => setTransactionFor(f)}>Transactions</button>

                      {isStaff && f.status !== 'ACTIVE' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(f, 'ACTIVE')}>Activate</button>
                      )}
                      {isStaff && f.status === 'ACTIVE' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(f, 'FROZEN')}>Freeze</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showCreate && (
        <CreateFolioModal isStaff={!!isStaff} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); reload() }} />
      )}
      {holdingsFor && <HoldingsModal folio={holdingsFor} onClose={() => setHoldingsFor(null)} />}
        {transactionsFor && <TransactionModal folio={transactionsFor} onClose={() => setTransactionFor(null)} />}
    </>
  )
}


function CreateFolioModal({ isStaff, onClose, onCreated }) {
  const toast = useToast()

  const [form, setForm] = useState({
    investorId: '',
    taxStatus: 'INDIVIDUAL',
    modeOfHolding: 'SINGLE',
    nomineeDetails: [
      {
        name: '',
        percentage: '',
      },
    ],
    bankAccountRef: '',
  })

  const [busy, setBusy] = useState(false)

  const addNominee = () => {
    setForm((prev) => ({
      ...prev,
      nomineeDetails: [
        ...prev.nomineeDetails,
        {
          name: '',
          percentage: '',
        },
      ],
    }))
  }

  const removeNominee = (index) => {
    setForm((prev) => ({
      ...prev,
      nomineeDetails: prev.nomineeDetails.filter((_, i) => i !== index),
    }))
  }

 const updateNominee = (index, field, value) => {
  setForm((prev) => ({
    ...prev,
    nomineeDetails: prev.nomineeDetails.map((nominee, i) =>
      i === index
        ? {
            ...nominee,
            [field]: value,   
          }
        : nominee
    ),
  }))
}

  const totalPercentage = form.nomineeDetails.reduce(
    (sum, nominee) => sum + Number(nominee.percentage || 0),
    0
  )

  async function submit(e) {
    e.preventDefault()

    const hasInvalidNominee = form.nomineeDetails.some(
      (nominee) =>
        !nominee.name.trim() || Number(nominee.percentage) <= 0
    )

    if (hasInvalidNominee) {
      toast.error('Please provide nominee name and percentage')
      return
    }

    if (totalPercentage !== 100) {
      toast.error('Nominee percentage must total 100%')
      return
    }

    setBusy(true)

    try {
      await api.post('/folios', {
        investorId:
          isStaff && form.investorId
            ? Number(form.investorId)
            : undefined,
        taxStatus: form.taxStatus,
        modeOfHolding: form.modeOfHolding,
        nomineeDetails: form.nomineeDetails.map((nominee) => ({
          name: nominee.name.trim(),
          percentage: Number(nominee.percentage),
        })),
        bankAccountRef: form.bankAccountRef || undefined,
      })

      toast.success('Folio created')
      onCreated()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Create Folio"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="folio-form"
            className="btn btn-primary"
            disabled={busy}
          >
            {busy ? 'Saving...' : 'Create Folio'}
          </button>
        </>
      }
    >
      <form id="folio-form" onSubmit={submit}>
        {isStaff && (
          <div className="field">
            <label>Investor ID</label>
            <input
              type="number"
              required
              placeholder="e.g. 7"
              value={form.investorId}
              onChange={(e) =>
                setForm({
                  ...form,
                  investorId: e.target.value,
                })
              }
            />
          </div>
        )}

        <div className="form-row">
          <div className="field">
            <label>Tax Status</label>
            <select
              value={form.taxStatus}
              onChange={(e) =>
                setForm({
                  ...form,
                  taxStatus: e.target.value,
                })
              }
            >
              {TAX.map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Mode of Holding</label>
            <select
              value={form.modeOfHolding}
              onChange={(e) =>
                setForm({
                  ...form,
                  modeOfHolding: e.target.value,
                })
              }
            >
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {humanize(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Nominees</label>

          {form.nomineeDetails.map((nominee, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '10px',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                placeholder="Nominee Name"
                value={nominee.name}
                onChange={(e) =>
                  updateNominee(index, 'name', e.target.value)
                }
                style={{ flex: 2 }}
              />

              <input
                type="number"
                min="1"
                max="100"
                placeholder="%"
                value={nominee.percentage}
                onChange={(e) =>
                  updateNominee(index, 'percentage', e.target.value)
                }
                style={{ width: '100px' }}
              />

              {form.nomineeDetails.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeNominee(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addNominee}
          >
            + Add Nominee
          </button>

          <div
            style={{
              marginTop: '10px',
              fontWeight: '600',
              color:
                totalPercentage === 100
                  ? 'green'
                  : totalPercentage > 100
                  ? 'red'
                  : '#666',
            }}
          >
            Total Allocation: {totalPercentage}%
          </div>
        </div>

        <div className="field">
          <label>Bank Account Reference</label>
          <input
            placeholder="Bank - XXXX1234"
            value={form.bankAccountRef}
            onChange={(e) =>
              setForm({
                ...form,
                bankAccountRef: e.target.value,
              })
            }
          />
        </div>
      </form>
    </Modal>
  )
}


function HoldingsModal({ folio, onClose }) {
  const { data, loading } = useFetch(`/folios/${folio.id}/holdings`)
  return (
    <Modal title={`Holdings · ${folio.folioNumber}`} onClose={onClose}>
      {loading ? <PageLoader /> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Scheme</th><th>Option</th><th className="num">Units</th><th className="num">Value</th><th className="num">P&L</th></tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={5} text="No holdings in this folio." />}
              {data?.map((h) => (
                <tr key={h.id}>
                  <td>{h.schemeName}</td>
                  <td>{humanize(h.optionType)}</td>
                  <td className="num">{units(h.unitsHeld)}</td>
                  <td className="num">{inr(h.currentValue)}</td>
                  <td className="num" style={{ color: (h.unrealisedGainLoss ?? 0) >= 0 ? 'var(--green-500)' : 'var(--rose-500)' }}>{num(h.unrealisedGainLoss)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}



function TransactionModal({ folio, onClose }) {
  const { data, loading } = useFetch(`/transactions/folio/${folio.id}`)
  return (
    <Modal title={`Transactions · ${folio.folioNumber}`} onClose={onClose}>
      {loading ? <PageLoader /> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>TXN Ref</th><th>Scheme</th><th>Option</th><th className="num">Units</th><th className="num">Value</th><th className="num">Status</th></tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && <EmptyRow colSpan={5} text="No holdings in this folio." />}
              {data?.map((h) => (
                <tr key={h.id}>
                  <td>{h.transactionRef}</td>
                  <td>{h.schemeName}</td>
                  <td>{humanize(h.optionType)}</td>
                  <td className="num">{units(h.units)}</td>
                  <td className="num">{inr(h.amount)}</td>
                  <td className="num" style={{ color: h.status  =="ALLOTTED" ? 'var(--green-500)' : 'var(--rose-500)' }}>{h.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
