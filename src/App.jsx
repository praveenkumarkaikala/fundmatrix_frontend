import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { RequireAuth, RoleRoute } from './auth/RequireAuth'
import { HOME } from './lib/nav'
import Layout from './components/Layout'

import Login from './pages/Login'
import Register from './pages/Register'

import InvestorDashboard from './pages/investor/InvestorDashboard'
import InvestorDividends from './pages/investor/InvestorDividends'
import InvestorKycPage from './pages/investor/InvestorKycPage'
import DistributorDashboard from './pages/distributor/DistributorDashboard'
import CommissionsPage from './pages/distributor/CommissionsPage'
import FoliosPage from './pages/shared/FoliosPage'
import TransactPage from './pages/shared/TransactPage'
import SipsPage from './pages/shared/SipsPage'
import SwpsPage from './pages/shared/SwpsPage'
import StatementPage from './pages/shared/StatementPage'
import KycPage from './pages/shared/KycPage'
import OpsQueuePage from './pages/ops/OpsQueuePage'
import AllotmentPage from './pages/ops/AllotmentPage'
import NavPage from './pages/accountant/NavPage'
import AumPage from './pages/accountant/AumPage'
import AccrualsPage from './pages/accountant/AccrualsPage'
import AccountantDividends from './pages/accountant/AccountantDividends'
import ComplianceDashboard from './pages/compliance/ComplianceDashboard'
import FlagsPage from './pages/compliance/FlagsPage'
import ComplianceReportsPage from './pages/compliance/ReportsPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import SchemesPage from './pages/admin/SchemesPage'
import DistributorsPage from './pages/admin/DistributorsPage'
import UsersPage from './pages/admin/UsersPage'
import RolesPage from './pages/admin/RolesPage'

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? HOME[user.role] : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />

         
          <Route path="/investor" element={<RoleRoute allow={['INVESTOR']}><InvestorDashboard /></RoleRoute>} />
          <Route path="/kyc" element={<RoleRoute allow={['INVESTOR']}><InvestorKycPage /></RoleRoute>} />
          <Route path="/dividends" element={<RoleRoute allow={['INVESTOR']}><InvestorDividends /></RoleRoute>} />

        
          <Route path="/distributor" element={<RoleRoute allow={['DISTRIBUTOR']}><DistributorDashboard /></RoleRoute>} />
          <Route path="/distributor/commissions" element={<RoleRoute allow={['DISTRIBUTOR']}><CommissionsPage /></RoleRoute>} />

          
          <Route path="/folios" element={<RoleRoute allow={['INVESTOR', 'DISTRIBUTOR', 'FUND_OPS', 'ADMIN']}><FoliosPage /></RoleRoute>} />
          <Route path="/transact" element={<RoleRoute allow={['INVESTOR', 'DISTRIBUTOR']}><TransactPage /></RoleRoute>} />
          <Route path="/sips" element={<RoleRoute allow={['INVESTOR', 'DISTRIBUTOR', 'FUND_OPS', 'ADMIN']}><SipsPage /></RoleRoute>} />
          <Route path="/swp" element={<RoleRoute allow={['INVESTOR', 'DISTRIBUTOR', 'FUND_OPS', 'ADMIN']}><SwpsPage /></RoleRoute>} />
          <Route path="/statement" element={<RoleRoute allow={['INVESTOR', 'DISTRIBUTOR']}><StatementPage /></RoleRoute>} />

          <Route path="/ops/queue" element={<RoleRoute allow={['FUND_OPS', 'ADMIN']}><OpsQueuePage /></RoleRoute>} />
          <Route path="/ops/allotments" element={<RoleRoute allow={['FUND_OPS', 'ADMIN']}><AllotmentPage /></RoleRoute>} />
          <Route path="/ops/kyc" element={<RoleRoute allow={['FUND_OPS', 'ADMIN']}><KycPage /></RoleRoute>} />

         
          <Route path="/accountant/nav" element={<RoleRoute allow={['FUND_ACCOUNTANT', 'ADMIN']}><NavPage /></RoleRoute>} />
          <Route path="/accountant/aum" element={<RoleRoute allow={['FUND_ACCOUNTANT', 'ADMIN', 'COMPLIANCE']}><AumPage /></RoleRoute>} />
          <Route path="/accountant/accruals" element={<RoleRoute allow={['FUND_ACCOUNTANT', 'ADMIN']}><AccrualsPage /></RoleRoute>} />
          <Route path="/accountant/dividends" element={<RoleRoute allow={['FUND_ACCOUNTANT', 'ADMIN']}><AccountantDividends /></RoleRoute>} />

         
          <Route path="/compliance" element={<RoleRoute allow={['COMPLIANCE', 'ADMIN']}><ComplianceDashboard /></RoleRoute>} />
          <Route path="/compliance/kyc" element={<RoleRoute allow={['COMPLIANCE', 'FUND_OPS', 'ADMIN']}><KycPage /></RoleRoute>} />
          <Route path="/compliance/flags" element={<RoleRoute allow={['COMPLIANCE', 'ADMIN']}><FlagsPage /></RoleRoute>} />
          <Route path="/compliance/reports" element={<RoleRoute allow={['COMPLIANCE', 'ADMIN']}><ComplianceReportsPage /></RoleRoute>} />

        
          <Route path="/admin" element={<RoleRoute allow={['ADMIN']}><AdminDashboard /></RoleRoute>} />
          <Route path="/admin/schemes" element={<RoleRoute allow={['ADMIN']}><SchemesPage /></RoleRoute>} />
          <Route path="/admin/distributors" element={<RoleRoute allow={['ADMIN']}><DistributorsPage /></RoleRoute>} />
          <Route path="/admin/users" element={<RoleRoute allow={['ADMIN']}><UsersPage /></RoleRoute>} />
          <Route path="/admin/roles" element={<RoleRoute allow={['ADMIN']}><RolesPage /></RoleRoute>} />

          <Route path="*" element={<HomeRedirect />} />
        </Route>
      </Route>
    </Routes>
  )
}
