
import { useMemo, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { useFetch } from '../../lib/useFetch'
import { useToast } from '../../components/Toast'
import { Badge, Card, EmptyRow, Modal, PageLoader } from '../../components/ui'
import { humanize } from '../../lib/format'

export default function RolesPage() {
  const toast = useToast()
  const roles = useFetch('/roles')
  const perms = useFetch('/permissions')
  const [editing, setEditing] = useState(null)   // role object, or {} for new, or null

  async function remove(role) {
    if (!window.confirm(`Delete role "${role.name}"? It will be removed from any users who hold it.`)) return
    try { await api.delete(`/roles/${role.id}`); toast.success(`Role ${role.name} deleted`); roles.reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <div className="page-head d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1>Roles &amp; Permissions</h1>
          <p>Define roles and the permissions they grant. Access is enforced live from these grants.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ New Role</button>
      </div>

      <Card title="Roles" hint="System roles cannot be renamed or deleted. The ADMIN role always holds every permission.">
        {roles.loading ? <PageLoader /> : (
          <div className="table-responsive">
            <table className="table">
              <thead><tr><th>Role</th><th>Description</th><th>Type</th><th>Permissions</th><th>Actions</th></tr></thead>
              <tbody>
                {(!roles.data || roles.data.length === 0) && <EmptyRow colSpan={5} />}
                {roles.data?.map((r) => (
                  <tr key={r.id}>
                    <td><b>{humanize(r.name)}</b><div className="muted-sm">{r.name}</div></td>
                    <td>{r.description || '—'}</td>
                    <td>{r.system ? <Badge color="blue">System</Badge> : <Badge color="teal">Custom</Badge>}</td>
                    <td><Badge color="gray">{r.permissions.length} permission{r.permissions.length === 1 ? '' : 's'}</Badge></td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(r)}>Edit</button>
                        {!r.system && <button className="btn btn-danger btn-sm" onClick={() => remove(r)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-4"><AssignPanel roles={roles.data || []} /></div>

      {editing && (
        <RoleModal
          role={editing}
          permissions={perms.data || []}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); roles.reload() }}
        />
      )}
    </>
  )
}

/** Create / edit a role with a permission picker grouped by module. */
function RoleModal({ role, permissions, onClose, onDone }) {
  const toast = useToast()
  const isNew = !role.id
  const isSystem = !!role.system
  const isAdmin = role.name === 'ADMIN'
  const [name, setName] = useState(role.name || '')
  const [description, setDescription] = useState(role.description || '')
  const [selected, setSelected] = useState(new Set(role.permissions || []))
  const [busy, setBusy] = useState(false)

  const groups = useMemo(() => {
    const m = {}
    for (const p of permissions) (m[p.module] ||= []).push(p)
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]))
  }, [permissions])

  function toggle(code) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      if (isNew) {
        await api.post('/roles', { name, description: description || undefined, permissions: [...selected] })
        toast.success(`Role ${name} created`)
      } else {
        const body = { description: description || undefined }
        if (!isSystem) body.name = name          // system roles cannot be renamed
        if (!isAdmin) body.permissions = [...selected]   // ADMIN permissions are fixed
        await api.put(`/roles/${role.id}`, body)
        toast.success(`Role ${name} updated`)
      }
      onDone()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <Modal title={isNew ? 'New Role' : `Edit Role — ${humanize(role.name)}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="role-form" disabled={busy}>{busy ? 'Saving…' : (isNew ? 'Create Role' : 'Save Changes')}</button></>}>
      <form id="role-form" onSubmit={submit}>
        <div className="form-row">
          <div className="mb-3">
            <label className="form-label">Role Name</label>
            <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSystem}
              placeholder="e.g. ANALYST" />
            {isSystem && <div className="hint">System role — name is fixed.</div>}
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <input className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div className="mb-3">
          <label>Permissions</label>
          {isAdmin ? (
            <div className="hint">The ADMIN role always holds all {permissions.length} permissions and cannot be edited.</div>
          ) : (
            <div className="perm-picker">
              {groups.map(([module, list]) => (
                <div key={module} className="perm-group">
                  <div className="perm-group-head">{module}</div>
                  {list.map((p) => (
                    <label key={p.code} className="perm-item">
                      <input type="checkbox" checked={selected.has(p.code)} onChange={() => toggle(p.code)} />
                      <span>{p.label}<code>{p.code}</code></span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}

/** Assign roles to a user and preview their effective permissions. */
function AssignPanel({ roles }) {
  const toast = useToast()
  const users = useFetch('/users')
  const [userId, setUserId] = useState('')
  const [current, setCurrent] = useState(null)   // { roles:[], permissions:[] }
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)

  async function pick(id) {
    setUserId(id); setCurrent(null); setSelected(new Set())
    if (!id) return
    try {
      const { data } = await api.get(`/users/${id}/permissions`)
      setCurrent(data); setSelected(new Set(data.roles))
    } catch (e) { toast.error(errorMessage(e)) }
  }

  function toggle(name) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  async function save() {
    setBusy(true)
    try {
      const { data } = await api.put(`/users/${userId}/roles`, { roles: [...selected] })
      setCurrent(data); setSelected(new Set(data.roles))
      toast.success('Roles updated')
    } catch (e) { toast.error(errorMessage(e)) } finally { setBusy(false) }
  }

  return (
    <Card title="Assign Roles to a User" hint="A user's effective permissions are the union of all roles assigned to them.">
      <div className="mb-3" style={{ maxWidth: 420 }}>
        <label className="form-label">User</label>
        <select className="form-select" value={userId} onChange={(e) => pick(e.target.value)}>
          <option value="">Select a user…</option>
          {users.data?.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.email} ({humanize(u.role)})</option>)}
        </select>
      </div>

      {current && (
        <>
          <div className="mb-3">
            <label>Roles</label>
            <div className="chip-row">
              {roles.map((r) => (
                <label key={r.id} className={`chip-toggle ${selected.has(r.name) ? 'on' : ''}`}>
                  <input type="checkbox" checked={selected.has(r.name)} onChange={() => toggle(r.name)} />
                  {humanize(r.name)}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label>Effective Permissions ({current.permissions.length})</label>
            <div className="chip-row">
              {current.permissions.length === 0 && <span className="muted-sm">No permissions — user cannot access protected endpoints.</span>}
              {current.permissions.map((p) => <code key={p} className="perm-chip">{p}</code>)}
            </div>
          </div>

          <button className="btn btn-primary" disabled={busy || selected.size === 0} onClick={save}>
            {busy ? 'Saving…' : 'Save Roles'}
          </button>
          {selected.size === 0 && <span className="hint" style={{ marginLeft: 10 }}>Select at least one role.</span>}
        </>
      )}
    </Card>
  )
}
