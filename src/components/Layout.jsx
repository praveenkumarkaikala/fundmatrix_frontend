import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { NAV, ROLE_LABEL } from '../lib/nav'
import { api } from '../api/client'
import { datetime, humanize, initials } from '../lib/format'
import './Layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [openNotif, setOpenNotif] = useState(false)
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [railExpanded, setRailExpanded] = useState(() => localStorage.getItem('fm.railExpanded') === '1')

  function toggleRail() {
    setRailExpanded((v) => {
      const next = !v
      localStorage.setItem('fm.railExpanded', next ? '1' : '0')
      return next
    })
  }

  const items = user ? NAV[user.role] : []
  const current = items.find((i) => location.pathname === i.to)
    ?? items.find((i) => i.to !== '/' && location.pathname.startsWith(i.to))

  // Close the mobile drawer whenever the route changes (e.g. after tapping a nav link).
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  async function loadNotifs() {
    try {
      const [list, count] = await Promise.all([
        api.get('/notifications/mine'),
        api.get('/notifications/unread-count'),
      ])
      setNotifs(list.data)
      setUnread(count.data.unread)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadNotifs()
    const t = setInterval(loadNotifs, 30000)
    return () => clearInterval(t)
  }, [])

  async function markRead(n) {
    if (n.status === 'UNREAD') {
      await api.patch(`/notifications/${n.id}/read`)
      loadNotifs()
    }
  }

  async function markAll() {
    await api.post('/notifications/read-all')
    loadNotifs()
  }

  function toggleNotif() {
    setOpenUserMenu(false)
    setOpenNotif((v) => !v)
  }

  function toggleUserMenu() {
    setOpenNotif(false)
    setOpenUserMenu((v) => !v)
  }

  if (!user) return null

  return (
    <div className="app-shell" style={{ '--rail-w': railExpanded ? '224px' : '84px' }}>
      <div className={`sidebar-backdrop ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(false)} />

      <aside className={`rail ${navOpen ? 'open' : ''} ${railExpanded ? 'expanded' : ''}`}>
        <div className="rail-logo">FM</div>
        <button className="rail-close" onClick={() => setNavOpen(false)} aria-label="Close menu">×</button>
        <div className="rail-role">{ROLE_LABEL[user.role]}</div>

        <nav className="rail-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <span className="ic">{item.icon}</span>
              <span className="lb">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="rail-toggle" onClick={toggleRail} aria-label={railExpanded ? 'Collapse menu' : 'Expand menu'}>
          {railExpanded ? '«' : '»'}
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="left">
            <button className="menu-btn" onClick={() => setNavOpen(true)} aria-label="Open menu">☰</button>
            <div className="page-title">{current?.label ?? ROLE_LABEL[user.role]}</div>
          </div>
          <div className="right">
            <div className="bell" onClick={toggleNotif}>
              🔔
              {unread > 0 && <span className="count">{unread}</span>}
            </div>
            <div className="avatar" onClick={toggleUserMenu}>{initials(user.name)}</div>
          </div>
        </header>

        {openNotif && (
          <div className="notif-panel">
            <div className="notif-head">
              <span>Notifications</span>
              <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all read</button>
            </div>
            {notifs.length === 0 && <div className="empty">No notifications</div>}
            {notifs.slice(0, 12).map((n) => (
              <div
                key={n.id}
                className={`notif-item ${n.status === 'UNREAD' ? 'unread' : ''}`}
                onClick={() => markRead(n)}
              >
                <div className="cat">{n.category}</div>
                <div>{n.message}</div>
                <div className="tm">{datetime(n.createdDate)}</div>
              </div>
            ))}
          </div>
        )}

        {openUserMenu && (
          <div className="user-menu-popover">
            <div className="nm">{user.name}</div>
            <div className="rl">{humanize(user.role)}</div>
            <div className="signout" onClick={logout}>↩ Sign out</div>
          </div>
        )}

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
