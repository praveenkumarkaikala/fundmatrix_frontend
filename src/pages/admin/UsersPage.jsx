
import { useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Card, EmptyRow, Modal, PageLoader, StatusBadge } from '../../components/ui'
import { date, humanize } from '../../lib/format'

const ROLES = ['INVESTOR', 'DISTRIBUTOR', 'FUND_OPS', 'FUND_ACCOUNTANT', 'COMPLIANCE', 'ADMIN']
const FILTERS = ['ALL', ...ROLES]

export default function UsersPage() {
  const toast = useToast()
  const [filter, setFilter] = useState('ALL')
  const url = filter === 'ALL' ? '/users' : `/users?role=${filter}`
  const { data, loading, reload } = useFetch(url)
  const [showCreate, setShowCreate] = useState(false)

  async function setStatus(u, status) {
    try { await api.patch(`/users/${u.id}/status`, { status }); toast.success(`${u.name} → ${humanize(status)}`); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <div className="page-head row-between">
        <div>
          <h1>User Management</h1>
          <p>Provision staff, distributor and investor accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New User</button>
      </div>

      <div className="pill-filter">
        {FILTERS.map((r) => <span key={r} className={`pill ${filter === r ? 'active' : ''}`} onClick={() => setFilter(r)}>{humanize(r)}</span>)}
      </div>

      <Card>
        {loading ? <PageLoader /> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {(!data || data.length === 0) && <EmptyRow colSpan={7} />}
                {data?.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.name}</b></td>
                    <td>{u.email}</td>
                    <td>{u.phone ?? '—'}</td>
                    <td><span className="badge blue">{humanize(u.role)}</span></td>
                    <td>{date(u.createdAt)}</td>
                    <td><StatusBadge status={u.status} /></td>
                    <td>
                      <div className="btn-row">
                        {u.status !== 'ACTIVE' && <button className="btn btn-teal btn-sm" onClick={() => setStatus(u, 'ACTIVE')}>Activate</button>}
                        {u.status === 'ACTIVE' && <button className="btn btn-danger btn-sm" onClick={() => setStatus(u, 'SUSPENDED')}>Suspend</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); reload() }} />}
    </>
  )
}

function CreateUserModal({ onClose, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({ name: '', email: '', phone: '', role: 'INVESTOR', password: '' })
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await api.post('/users', { name: f.name, email: f.email, phone: f.phone || undefined, role: f.role, password: f.password })
      toast.success('User created'); onDone()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return (
    <Modal title="New User" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="user-form" disabled={busy}>{busy ? 'Saving…' : 'Create User'}</button></>}>
      <form id="user-form" onSubmit={submit}>
        <div className="field"><label>Full Name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
        <div className="form-row">
          <div className="field"><label>Email</label><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
          <div className="field"><label>Phone</label><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="field"><label>Role</label><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLES.map((r) => <option key={r} value={r}>{humanize(r)}</option>)}</select></div>
          <div className="field"><label>Password</label><input type="password" minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></div>
        </div>
      </form>
    </Modal>
  )
}
