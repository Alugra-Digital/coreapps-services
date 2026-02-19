import http from 'k6/http';
import { check, sleep, group } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 50 },     // Hold at 50 users
    { duration: '2m', target: 100 },    // Ramp to 100 users
    { duration: '3m', target: 100 },    // Hold at 100 users
    { duration: '1m', target: 0 },      // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],   // 95% of requests under 200ms
    http_req_failed: ['rate<0.01'],     // Less than 1% failure rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // Authenticate to get a JWT token for subsequent requests
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: 'admin',
    password: 'admin123',
  }), { headers: { 'Content-Type': 'application/json' } });

  check(loginRes, { 'login successful': (r) => r.status === 200 });

  const body = JSON.parse(loginRes.body);
  return { token: body.token };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // ==================== HEALTH CHECKS ====================
  group('Health Checks', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'gateway health OK': (r) => r.status === 200 });
  });

  // ==================== FINANCE MODULE ====================
  group('Finance - List Invoices', () => {
    const res = http.get(`${BASE_URL}/api/finance/invoices`, { headers });
    check(res, { 'invoices 200': (r) => r.status === 200 });
  });

  group('Finance - List Clients', () => {
    const res = http.get(`${BASE_URL}/api/finance/clients`, { headers });
    check(res, { 'clients 200': (r) => r.status === 200 });
  });

  group('Finance - List Quotations', () => {
    const res = http.get(`${BASE_URL}/api/finance/quotations`, { headers });
    check(res, { 'quotations 200': (r) => r.status === 200 });
  });

  // ==================== HR MODULE ====================
  group('HR - List Employees', () => {
    const res = http.get(`${BASE_URL}/api/hr/employees`, { headers });
    check(res, { 'employees 200': (r) => r.status === 200 });
  });

  group('HR - List Shifts', () => {
    const res = http.get(`${BASE_URL}/api/hr/shifts`, { headers });
    check(res, { 'shifts 200': (r) => r.status === 200 });
  });

  // ==================== ACCOUNTING MODULE ====================
  group('Accounting - Chart of Accounts', () => {
    const res = http.get(`${BASE_URL}/api/accounting/accounts`, { headers });
    check(res, { 'accounts 200': (r) => r.status === 200 });
  });

  group('Accounting - Journal Entries', () => {
    const res = http.get(`${BASE_URL}/api/accounting/journal-entries`, { headers });
    check(res, { 'journal entries 200': (r) => r.status === 200 });
  });

  // ==================== CRM MODULE ====================
  group('CRM - List Leads', () => {
    const res = http.get(`${BASE_URL}/api/crm/leads`, { headers });
    check(res, { 'leads 200': (r) => r.status === 200 });
  });

  group('CRM - List Opportunities', () => {
    const res = http.get(`${BASE_URL}/api/crm/opportunities`, { headers });
    check(res, { 'opportunities 200': (r) => r.status === 200 });
  });

  // ==================== INVENTORY MODULE ====================
  group('Inventory - List Products', () => {
    const res = http.get(`${BASE_URL}/api/inventory/products`, { headers });
    check(res, { 'products 200': (r) => r.status === 200 });
  });

  group('Inventory - Stock Balance', () => {
    const res = http.get(`${BASE_URL}/api/inventory/stock/balance`, { headers });
    check(res, { 'stock balance 200': (r) => r.status === 200 });
  });

  // ==================== MANUFACTURING MODULE ====================
  group('Manufacturing - List BOMs', () => {
    const res = http.get(`${BASE_URL}/api/manufacturing/boms`, { headers });
    check(res, { 'boms 200': (r) => r.status === 200 });
  });

  group('Manufacturing - Work Orders', () => {
    const res = http.get(`${BASE_URL}/api/manufacturing/work-orders`, { headers });
    check(res, { 'work orders 200': (r) => r.status === 200 });
  });

  // ==================== ANALYTICS MODULE ====================
  group('Analytics - Dashboard KPIs', () => {
    const res = http.get(`${BASE_URL}/api/analytics/dashboard`, { headers });
    check(res, { 'dashboard 200': (r) => r.status === 200 });
  });

  group('Analytics - Revenue', () => {
    const res = http.get(`${BASE_URL}/api/analytics/revenue?period=monthly`, { headers });
    check(res, { 'revenue 200': (r) => r.status === 200 });
  });

  sleep(1);
}
