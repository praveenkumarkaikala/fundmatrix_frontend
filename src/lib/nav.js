// Landing route per role.
export const HOME = {
  INVESTOR: '/investor',
  DISTRIBUTOR: '/distributor',
  FUND_OPS: '/ops/kyc',
  FUND_ACCOUNTANT: '/accountant/nav',
  COMPLIANCE: '/compliance',
  ADMIN: '/admin',
}

export const ROLE_LABEL = {
  INVESTOR: 'Investor Portal',
  DISTRIBUTOR: 'Distributor Console',
  FUND_OPS: 'Operations Workbench',
  FUND_ACCOUNTANT: 'Fund Accountant',
  COMPLIANCE: 'Compliance Portal',
  ADMIN: 'Admin Console',
}

export const NAV = {
  INVESTOR: [
    { to: '/investor', label: 'Dashboard', icon: '◈' },
    { to: '/folios', label: 'My Folios', icon: '▤' },
    { to: '/kyc', label: 'KYC Verification', icon: '✓' },
    { to: '/transact', label: 'Transact', icon: '⇄' },
    // { to: '/sips', label: 'SIP Manager', icon: '↻' },
    // { to: '/swp', label: 'SWP Withdrawals', icon: '↺' },
    // { to: '/statement', label: 'Account Statement', icon: '≣' },
    // { to: '/dividends', label: 'Dividend History', icon: '₹' },
  ],
  DISTRIBUTOR: [
    { to: '/distributor', label: 'Dashboard', icon: '◈' },
    { to: '/folios', label: 'Client Folios', icon: '▤' },
    { to: '/transact', label: 'Place Transaction', icon: '⇄' },
    // { to: '/sips', label: 'Client SIPs', icon: '↻' },
    // { to: '/swp', label: 'Client SWPs', icon: '↺' },
    { to: '/statement', label: 'Transactions', icon: '≣' },
    // { to: '/distributor/commissions', label: 'Trail Commission', icon: '₹' },
  ],
  FUND_OPS: [
    { to: '/ops/queue', label: 'Transaction Queue', icon: '▦' },
    // { to: '/ops/allotments', label: 'Allotment Processing', icon: '◳' },
    { to: '/folios', label: 'Folio Manager', icon: '▤' },
    { to: '/ops/kyc', label: 'KYC Verification', icon: '✓' },
    // { to: '/sips', label: 'SIP Processing', icon: '↻' },
    // { to: '/swp', label: 'SWP Processing', icon: '↺' },
  ],
  FUND_ACCOUNTANT: [
    { to: '/accountant/nav', label: 'NAV Entry', icon: '◧' },
    { to: '/accountant/aum', label: 'AUM Tracker', icon: '◈' },
    // { to: '/accountant/accruals', label: 'Expense Accruals', icon: '≣' },
    // { to: '/accountant/dividends', label: 'Dividend Workspace', icon: '₹' },
  ],
  COMPLIANCE: [
    { to: '/compliance', label: 'Compliance Overview', icon: '◈' },
    { to: '/compliance/kyc', label: 'KYC Tracker', icon: '✓' },
    // { to: '/compliance/flags', label: 'Transaction Flags', icon: '⚑' },
    // { to: '/compliance/reports', label: 'Regulatory Reports', icon: '≣' },
  ],
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: '◈' },
    { to: '/admin/schemes', label: 'Scheme Catalogue', icon: '▤' },
    // { to: '/admin/distributors', label: 'Distributors', icon: '◧' },
    { to: '/admin/users', label: 'User Management', icon: '✓' },
    // { to: '/admin/roles', label: 'Roles & Permissions', icon: '⚿' },
  ],
}
