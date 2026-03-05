/**
 * Canonical list of permission keys for RBAC.
 * Used for validation, documentation, and frontend menuConfig alignment.
 *
 * Parent keys (e.g. 'finance') grant access to all children.
 * Child keys (e.g. 'finance.invoice') grant access only to that specific item.
 *
 * Granular keys for Access-by-Role matrix (SUPER ADMIN, FINANCE, PROCUREMENT, HR, AUDITOR):
 * - dashboard (View Dashboard)
 * - finance.invoice.create (Create Invoice)
 * - finance.invoice.approve (Approve Invoice)
 * - finance.payment.release (Release Payment)
 * - finance.purchase-orders.create (Create Purchase Order)
 * - finance.purchase-orders.approve (Approve Purchase Order)
 * - hr.employees.view (View Employees)
 * - hr.employees.manage (Manage Employees)
 * - reports.export (Export Reports)
 */
export const PERMISSION_KEYS = [
  'dashboard',
  'finance',
  'finance.accounting',
  'finance.invoice',
  'finance.invoice.create',
  'finance.invoice.approve',
  'finance.payment',
  'finance.payment.release',
  'finance.purchase-orders',
  'finance.purchase-orders.create',
  'finance.purchase-orders.approve',
  'finance.clients',
  'finance.client-purchase-orders',
  'finance.quotations',
  'finance.proposal-penawaran',
  'finance.perpajakan',
  'finance.bast',
  'inventory',
  'projects',
  'sales',
  'reports',
  'reports.export',
  'hr',
  'hr.employees',
  'hr.employees.view',
  'hr.employees.manage',
  'hr.positions',
  'access_control',
  'access_control.roles',
  'access_control.users',
];
