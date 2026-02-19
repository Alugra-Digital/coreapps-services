# CoreApps ERP – Frontend API Integration Guide

This document describes how to integrate the frontend with all CoreApps ERP APIs. All requests go through the **API Gateway** at a single base URL.

---

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [ID Format](#id-format)
5. [Endpoints Overview](#endpoints-overview)
6. [Authentication & Access Control](#authentication--access-control)
7. [HR Module](#hr-module)
8. [Finance Module](#finance-module)
9. [Inventory Module](#inventory-module)
10. [Accounting Module](#accounting-module)
11. [Manufacturing Module](#manufacturing-module)
12. [Asset Module](#asset-module)
13. [Analytics Module](#analytics-module)
14. [CRM Module](#crm-module)
15. [Notification Module](#notification-module)
16. [Batch Requests](#batch-requests)

---

## Base Configuration

| Property | Value |
|----------|-------|
| **Base URL** | `http://localhost:3000` (development) or `VITE_API_BASE_URL` (env) |
| **Content-Type** | `application/json` |
| **Accept** | `application/json` |
| **Swagger UI** | `http://localhost:3000/api-docs` |

All API paths are prefixed with `/api` and use the service prefix (e.g. `/api/finance/purchase-orders`, `/api/hr/employees`). This matches Swagger.

---

## Authentication

### 1. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

**Success (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-1",
    "username": "admin",
    "email": "admin@example.com",
    "fullName": "Administrator",
    "role": "SUPER_ADMIN"
  }
}
```

**Error (401):**
```json
{
  "message": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}
```

### 2. Register (Optional)

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "fullName": "New User",
  "password": "SecurePass123"
}
```

### 3. Authenticated Requests

Include the JWT in the `Authorization` header:

```http
Authorization: Bearer <token>
```

### 4. Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "user-1",
  "username": "admin",
  "email": "admin@example.com",
  "fullName": "Administrator",
  "roleId": "role-1",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "role": {
    "id": "role-1",
    "code": "SUPER_ADMIN",
    "name": "Super Administrator",
    "permissionKeys": ["dashboard", "finance", "finance.invoice", "access_control.roles", "access_control.users"]
  }
}
```

Use `role.permissionKeys` for RBAC menu filtering.

**SUPER_ADMIN bypass:** The backend always returns the full list of permission keys for `role.code === 'SUPER_ADMIN'`, so the admin user sees all menu items. No special frontend bypass logic is required.

---

## Error Handling

All error responses follow this format:

```json
{
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "nik",
      "message": "NIK is required"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| message | string | Error message (display to user) |
| code | string | Error code for programmatic handling |
| errors | array | Optional per-field validation errors |

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Not logged in or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input |
| INVALID_ID | 400 | Invalid ID format |
| CONFLICT | 409 | Duplicate or conflict |
| ERROR | 500 | Internal server error |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |

### Frontend Example

```javascript
async function fetchData(url) {
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();

  if (!res.ok) {
    // Display data.message to user
    // Use data.code for conditional logic
    // Use data.errors for form field errors
    throw new Error(data.message || 'Request failed');
  }
  return data;
}
```

---

## ID Format

| Entity | ID Format | Example |
|--------|-----------|---------|
| Employee | `EMP-{id}` | `EMP-001` |
| Position | `POS-{id}` | `POS-1` |
| Client | `CLI-{id}` | `CLI-1` |
| Vendor | `VDR-{id}` | `VDR-1` |
| Invoice | `INV-{id}` | `INV-1` |
| Purchase Order | `PO-{id}` | `PO-1` |
| BAST | `BAST-{id}` | `BAST-1` |
| Project | `PRJ-{id}` | `PRJ-1` |
| Tax Type | `TAX-{id}` | `TAX-1` |
| Proposal | `PP-{id}` | `PP-1` |
| User | `user-{id}` | `user-1` |
| Role | `role-{id}` | `role-1` |

Path params accept both prefixed (`EMP-1`) and numeric (`1`) formats.

---

## Endpoints Overview

### Quick Reference

| Module | Base Path | Auth Required |
|--------|-----------|---------------|
| Auth | `/api/auth` | Login/Register: No; Me: Yes |
| Users | `/api/users` | Yes |
| Roles | `/api/roles` | Yes |
| HR | `/api/hr` | Yes (employees, positions, payroll, leave, etc.) |
| Finance | `/api/finance` | Yes (invoices, clients, vendors, POs, quotations, etc.) |
| Inventory | `/api/inventory` | Yes |
| Dashboard | `/api/analytics/dashboard` | Yes |
| Accounting | `/api/accounting` | Yes |
| Manufacturing | `/api/manufacturing` | Yes |
| Assets | `/api/assets` | Yes |
| Analytics | `/api/analytics` | Yes |
| CRM | `/api/crm` | Yes |
| Notifications | `/api/notification` | Yes |

---

## Authentication & Access Control

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

**Create User Body:**
```json
{
  "username": "finance_user",
  "email": "finance@example.com",
  "fullName": "Finance User",
  "roleId": "role-finance",
  "password": "secret123",
  "isActive": true
}
```

### Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roles` | List all roles |
| GET | `/api/roles/:id` | Get role by ID |
| POST | `/api/roles` | Create role |
| PUT | `/api/roles/:id` | Update role |
| DELETE | `/api/roles/:id` | Delete role |

**Role Response includes `permissionKeys`** for RBAC.

---

## HR Module

All HR endpoints use the `/api/hr` prefix (matches Swagger).

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hr/employees` | List employees (supports pagination) |
| GET | `/api/hr/employees/:id` | Get employee by ID |
| POST | `/api/hr/employees` | Create employee |
| PUT | `/api/hr/employees/:id` | Update employee |
| DELETE | `/api/hr/employees/:id` | Hard delete employee |

**Query params for GET /api/hr/employees:** `page`, `limit`, `search`, `position`, `status`, `includeResigned`

### Positions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hr/positions` | List positions |
| GET | `/api/hr/positions/:id` | Get position by ID |
| POST | `/api/hr/positions` | Create position |
| PUT | `/api/hr/positions/:id` | Update position |
| DELETE | `/api/hr/positions/:id` | Delete position |

### HR Extended

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hr/stats` | HR dashboard stats |
| POST | `/api/hr/employees/import` | Import employees from CSV |
| POST | `/api/hr/employees/:id/documents` | Upload employee document |
| GET | `/api/hr/payroll/salary-structures` | List salary structures |
| PUT | `/api/hr/payroll/salary-structures/:employeeId` | Upsert salary structure |
| GET | `/api/hr/payroll/salary-slips` | List salary slips |
| POST | `/api/hr/payroll/salary-slips` | Create salary slip |
| POST | `/api/hr/payroll/salary-slips/:id/post` | Post salary slip |
| GET | `/api/hr/leave/balance/:employeeId` | Get leave balance |
| POST | `/api/hr/leave/apply` | Apply for leave |
| POST | `/api/hr/leave/applications/:id/approve` | Approve leave |
| GET | `/api/hr/attendance/:employeeId` | Get attendance |
| POST | `/api/hr/attendance/log` | Log attendance |
| GET | `/api/hr/loans/:employeeId` | Get employee loans |
| POST | `/api/hr/loans/apply` | Apply for loan |
| GET | `/api/hr/shifts` | List shifts |
| POST | `/api/hr/shifts` | Create shift |

---

## Finance Module

All Finance endpoints use the `/api/finance` prefix (matches Swagger).

### Clients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/clients` | List clients |
| GET | `/api/finance/clients/:id` | Get client by ID |
| POST | `/api/finance/clients` | Create client |
| PUT | `/api/finance/clients/:id` | Update client |
| DELETE | `/api/finance/clients/:id` | Delete client |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/vendors` | List vendors |
| GET | `/api/finance/vendors/:id` | Get vendor by ID |
| POST | `/api/finance/vendors` | Create vendor |
| PUT | `/api/finance/vendors/:id` | Update vendor |
| DELETE | `/api/finance/vendors/:id` | Delete vendor |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/invoices` | List invoices |
| GET | `/api/finance/invoices/:id` | Get invoice by ID |
| POST | `/api/finance/invoices` | Create invoice |
| PUT | `/api/finance/invoices/:id` | Update invoice |
| DELETE | `/api/finance/invoices/:id` | Delete invoice |
| GET | `/api/finance/invoices/:id/pdf` | Download PDF |

### Purchase Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/purchase-orders` | List POs |
| GET | `/api/finance/purchase-orders/:id` | Get PO by ID |
| POST | `/api/finance/purchase-orders` | Create PO |
| PUT | `/api/finance/purchase-orders/:id` | Update PO |
| DELETE | `/api/finance/purchase-orders/:id` | Delete PO |
| GET | `/api/finance/purchase-orders/:id/pdf` | Download PDF |

### Quotations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/quotations` | List quotations |
| GET | `/api/finance/quotations/:id` | Get quotation by ID |
| POST | `/api/finance/quotations` | Create quotation |
| PUT | `/api/finance/quotations/:id` | Update quotation |
| DELETE | `/api/finance/quotations/:id` | Delete quotation |
| GET | `/api/finance/quotations/:id/pdf` | Download PDF |

### BASTs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/basts` | List BASTs |
| GET | `/api/finance/basts/:id` | Get BAST by ID |
| POST | `/api/finance/basts` | Create BAST |
| PUT | `/api/finance/basts/:id` | Update BAST |
| DELETE | `/api/finance/basts/:id` | Delete BAST |
| GET | `/api/finance/basts/:id/pdf` | Download PDF |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/projects` | List projects |
| GET | `/api/finance/projects/:id` | Get project by ID |
| POST | `/api/finance/projects` | Create project |
| PUT | `/api/finance/projects/:id` | Update project |
| DELETE | `/api/finance/projects/:id` | Delete project |

### Tax Types

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/tax-types` | List tax types |
| GET | `/api/finance/tax-types/:id` | Get tax type by ID |
| POST | `/api/finance/tax-types` | Create tax type |
| PUT | `/api/finance/tax-types/:id` | Update tax type |
| DELETE | `/api/finance/tax-types/:id` | Delete tax type |
| GET | `/api/finance/tax-types/:id/pdf` | Download PDF |

### Proposal Penawaran

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/proposal-penawaran` | List proposals |
| GET | `/api/finance/proposal-penawaran/:id` | Get proposal by ID |
| POST | `/api/finance/proposal-penawaran` | Create proposal |
| PUT | `/api/finance/proposal-penawaran/:id` | Update proposal |
| DELETE | `/api/finance/proposal-penawaran/:id` | Delete proposal |
| GET | `/api/finance/proposal-penawaran/:id/pdf` | Download PDF |

### Payments & Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/payments` | List payments |
| GET | `/api/finance/payments/:id` | Get payment by ID |
| POST | `/api/finance/payments` | Record payment |
| GET | `/api/finance/invoices/:invoiceId/payments` | Get payments by invoice |
| GET | `/api/finance/expenses` | List expenses |
| POST | `/api/finance/expenses` | Create expense |
| PATCH | `/api/finance/expenses/:id/status` | Update expense status |
| POST | `/api/finance/expenses/:id/post` | Post expense |
| POST | `/api/finance/invoices/:id/lock` | Lock invoice PDF |
| POST | `/api/finance/invoices/:id/revise` | Create invoice revision |

---

## Inventory Module

### Inventory Items (Flat API)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List inventory items |
| GET | `/api/inventory/:id` | Get item by ID |
| POST | `/api/inventory` | Create item |
| PUT | `/api/inventory/:id` | Update item |
| DELETE | `/api/inventory/:id` | Delete item |

### Inventory Extended (prefix `/api/inventory`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/products` | List products |
| GET | `/api/inventory/products/:id` | Get product by ID |
| POST | `/api/inventory/products` | Create product |
| PUT | `/api/inventory/products/:id` | Update product |
| DELETE | `/api/inventory/products/:id` | Delete product |
| POST | `/api/inventory/stock/entry` | Create stock entry |
| GET | `/api/inventory/stock/balance` | Get stock balance |
| GET | `/api/inventory/stock/entries` | Get stock entries |
| GET | `/api/inventory/warehouses` | List warehouses |
| GET | `/api/inventory/warehouses/:id` | Get warehouse by ID |
| POST | `/api/inventory/warehouses` | Create warehouse |
| PUT | `/api/inventory/warehouses/:id` | Update warehouse |

---

## Accounting Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounting/accounts` | List accounts |
| POST | `/api/accounting/accounts` | Create account |
| PATCH | `/api/accounting/accounts/:id` | Update account |
| DELETE | `/api/accounting/accounts/:id` | Delete account |
| GET | `/api/accounting/journal-entries` | List journal entries |
| GET | `/api/accounting/journal-entries/:id` | Get journal entry |
| POST | `/api/accounting/journal-entries` | Create journal entry |
| POST | `/api/accounting/journal-entries/:id/post` | Post journal entry |
| GET | `/api/accounting/reports/trial-balance` | Trial balance report |
| GET | `/api/accounting/reports/general-ledger` | General ledger report |
| GET | `/api/accounting/reports/profit-loss` | Profit & loss report |
| GET | `/api/accounting/reports/balance-sheet` | Balance sheet report |
| GET | `/api/accounting/reports/income-statement` | Income statement report |
| GET | `/api/accounting/reports/aged-receivables` | Aged receivables report |
| GET | `/api/accounting/reports/aged-payables` | Aged payables report |

---

## Manufacturing Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/manufacturing/work-orders` | List work orders |
| POST | `/api/manufacturing/work-orders` | Create work order |
| POST | `/api/manufacturing/work-orders/:id/start` | Start work order |
| POST | `/api/manufacturing/work-orders/:id/complete` | Complete work order |

---

## Asset Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | List assets |
| POST | `/api/assets` | Create asset |
| POST | `/api/assets/:id/depreciate` | Run depreciation |
| GET | `/api/assets/maintenance/:assetId/history` | Get maintenance history |
| POST | `/api/assets/maintenance/schedule` | Schedule maintenance |
| POST | `/api/assets/maintenance/:id/complete` | Complete maintenance |

---

## Analytics Module

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Get dashboard summary (metrics, activities, projects) |

### Analytics Extended (prefix `/api/analytics`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard metrics (projects, invoices, etc.) |
| GET | `/api/analytics/revenue` | Revenue analytics |
| GET | `/api/analytics/hr` | HR metrics |
| GET | `/api/analytics/inventory` | Inventory metrics |
| GET | `/api/analytics/manufacturing` | Manufacturing metrics |
| GET | `/api/analytics/dashboard/widgets` | Get widgets |
| POST | `/api/analytics/dashboard/widgets` | Create widget |
| PUT | `/api/analytics/dashboard/widgets/:id` | Update widget |
| DELETE | `/api/analytics/dashboard/widgets/:id` | Delete widget |
| PUT | `/api/analytics/dashboard/layout` | Save layout |
| GET | `/api/analytics/dashboard/layout` | Get layout |
| GET | `/api/analytics/dashboard/kpis` | Get KPIs |
| POST | `/api/analytics/dashboard/kpis` | Create KPI |
| PUT | `/api/analytics/dashboard/kpis/:id` | Update KPI |
| DELETE | `/api/analytics/dashboard/kpis/:id` | Delete KPI |
| GET | `/api/analytics/reports/templates` | List report templates |
| POST | `/api/analytics/reports/templates` | Create template |
| GET | `/api/analytics/reports/templates/:id` | Get template |
| PUT | `/api/analytics/reports/templates/:id` | Update template |
| DELETE | `/api/analytics/reports/templates/:id` | Delete template |
| POST | `/api/analytics/reports/generate` | Generate report |
| GET | `/api/analytics/reports/:id` | Get report |
| POST | `/api/analytics/reports/schedule` | Create report schedule |
| GET | `/api/analytics/reports/schedules` | List report schedules |
| DELETE | `/api/analytics/reports/schedules/:id` | Delete schedule |
| GET | `/api/analytics/reports/export/:id` | Export report |

---

## CRM Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/crm/leads` | List leads |
| POST | `/api/crm/leads` | Create lead |
| PATCH | `/api/crm/leads/:id` | Update lead |
| DELETE | `/api/crm/leads/:id` | Delete lead |
| GET | `/api/crm/opportunities` | List opportunities |
| POST | `/api/crm/opportunities` | Create opportunity |
| PATCH | `/api/crm/opportunities/:id` | Update opportunity |
| DELETE | `/api/crm/opportunities/:id` | Delete opportunity |

---

## Notification Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notification/notifications` | Get user notifications |

**Note:** Notifications also support real-time updates via Socket.IO. Connect with `auth: { token }` for live updates.

---

## Batch Requests

Send multiple API requests in one HTTP call:

```http
POST /api/batch
Content-Type: application/json
Authorization: Bearer <token>

{
  "requests": [
    {
      "id": "req-1",
      "method": "GET",
      "path": "/api/hr/employees",
      "body": null,
      "headers": {}
    },
    {
      "id": "req-2",
      "method": "GET",
      "path": "/api/finance/invoices",
      "body": null,
      "headers": {}
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "req-1",
      "status": 200,
      "data": [ /* employees array */ ]
    },
    {
      "id": "req-2",
      "status": 200,
      "data": [ /* invoices array */ ]
    }
  ]
}
```

- Maximum 50 requests per batch
- Each failed request returns `{ id, status: 500, message, code: 'ERROR' }`

---

## Date Format

All date fields use **ISO 8601**:

- **Date only:** `YYYY-MM-DD` (e.g. `2025-02-18`)
- **DateTime:** `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g. `2025-02-18T10:00:00.000Z`)

---

## Pagination

For list endpoints that support pagination:

**Query params:** `page` (1-based), `limit`

**Response format:**
```json
{
  "data": [ /* array of items */ ],
  "total": 84,
  "page": 1,
  "limit": 10,
  "totalPages": 9
}
```

---

## CORS

The gateway allows origins from `ALLOWED_ORIGINS` env var. In development, localhost origins are allowed. Ensure your frontend origin is configured.

---

## Rate Limiting

- **General API:** 100 requests/minute per user/IP
- **Auth (login/register):** 5 attempts per 15 minutes
- **429:** `{ message, code: 'RATE_LIMIT_EXCEEDED', retryAfter }`

---

For detailed request/response schemas per module, see `docs/API_STRUCTURE.md`.
