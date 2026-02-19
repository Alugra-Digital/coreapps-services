/**
 * Canonical list of permission keys for RBAC.
 * Used for validation, documentation, and frontend menuConfig alignment.
 *
 * Parent keys (e.g. 'finance') grant access to all children.
 * Child keys (e.g. 'finance.invoice') grant access only to that specific item.
 */
export const PERMISSION_KEYS = [
  'dashboard',
  'finance',
  'finance.accounting',
  'finance.invoice',
  'finance.payment',
  'finance.purchase-orders',
  'finance.clients',
  'finance.vendors',
  'finance.quotations',
  'finance.proposal-penawaran',
  'finance.perpajakan',
  'finance.bast',
  'inventory',
  'projects',
  'sales',
  'reports',
  'hr',
  'hr.employees',
  'hr.positions',
  'access_control',
  'access_control.roles',
  'access_control.users',
];
