import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { HOME } from '../lib/nav'
import { PageLoader } from '../components/ui'

/** Gate for all authenticated routes. */
export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Restricts a route to specific roles, redirecting others to their home. */
export function RoleRoute({ allow, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!allow.includes(user.role)) return <Navigate to={HOME[user.role]} replace />
  return <>{children}</>
}
