# CoreApps ERP – API URL Documentation

This document lists all API URLs **exactly as in Swagger**. Use these URLs for frontend integration. Each endpoint includes payload and response examples.

> **Important:** All URLs use the service prefix (e.g. `/api/finance/purchase-orders`, not `/api/purchase-orders`). This matches Swagger and the gateway circuit-breaker routes.

**Base URL:** `http://localhost:3000` (development) | `https://api.alugra.co.id` (production)  
**Swagger UI:** `http://localhost:3000/api-docs`

---

## Base Configuration

| Property | Value |
|----------|-------|
| Content-Type | `application/json` |
| Accept | `application/json` |
| Authorization | `Bearer <token>` (required for protected routes) |

---

## 1. Auth Service

### POST /api/auth/login

**Payload:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response 200:**
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

**Response 401:**
```json
{
  "message": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}
```

---

### POST /api/auth/register

**Payload:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "fullName": "New User",
  "password": "SecurePass123"
}
```

**Response 201:** Created user object

---

### POST /api/auth/logout

**Payload:** None

**Response 200:** Success message

---

### GET /api/auth/me

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
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
    "permissionKeys": ["dashboard", "finance", "finance.invoice", "hr.employees", "access_control.roles", "access_control.users"]
  }
}
```

---

### GET /api/roles

**Response 200:** Array of roles

---

### GET /api/roles/:id

**Response 200:** Single role object

---

### POST /api/roles

**Payload:**
```json
{
  "code": "CUSTOM_ROLE",
  "name": "Custom Role",
  "description": "Optional description",
  "permissionKeys": ["dashboard", "finance"]
}
```

**Response 201:** Created role

---

### PUT /api/roles/:id

**Payload:** Partial role object

**Response 200:** Updated role

---

### DELETE /api/roles/:id

**Response 200/204:** Success

---

### GET /api/users

**Response 200:** Array of users

---

### GET /api/users/:id

**Response 200:** Single user object

---

### POST /api/users

**Payload:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "fullName": "New User",
  "password": "SecurePass123",
  "role": "HR_ADMIN"
}
```

**Response 201:** Created user

---

### PUT /api/users/:id

**Payload:** Partial user object

**Response 200:** Updated user

---

### DELETE /api/users/:id

**Response 200/204:** Success

---

## 2. CRM Service

### GET /api/crm/leads

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890",
    "source": "Website",
    "status": "NEW"
  }
]
```

---

### POST /api/crm/leads

**Payload:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "company": "PT Example",
  "source": "Website",
  "status": "NEW",
  "notes": "Optional notes"
}
```

**Response 201:** Created lead

---

### PATCH /api/crm/leads/:id

**Payload:** Partial lead object

**Response 200:** Updated lead

---

### DELETE /api/crm/leads/:id

**Response 200:** Success

---

### GET /api/crm/opportunities

**Response 200:** Array of opportunities

---

### POST /api/crm/opportunities

**Payload:**
```json
{
  "name": "Big Deal",
  "leadId": 1,
  "clientId": 1,
  "amount": 150000000,
  "probability": 70,
  "stage": "PROSPECTING",
  "expectedCloseDate": "2026-03-01",
  "notes": "Optional"
}
```

**Response 201:** Created opportunity

---

## 3. HR Service

### GET /api/hr/employees

**Query:** `?page=1&limit=10&search=&position=&status=active&includeResigned=false`

**Response 200:** Array of employees (or paginated `{ data, total, page, limit, totalPages }`)

---

### GET /api/hr/employees/:id

**Response 200:** Single employee object

---

### POST /api/hr/employees

**Payload:**
```json
{
  "nik": "2024001",
  "name": "Achmad Hakim",
  "department": "Engineering",
  "position": "Project Manager",
  "tmk": "2020-01-15",
  "status": "ACTIVE"
}
```

**Response 201:** Created employee

---

### PUT /api/hr/employees/:id

**Payload:** Partial employee object

**Response 200:** Updated employee

---

### PATCH /api/hr/employees/:id

**Payload:** Partial employee object

**Response 200:** Updated employee

---

### DELETE /api/hr/employees/:id

**Response 200/204:** Success

---

### POST /api/hr/employees/import

**Content-Type:** `multipart/form-data`  
**Payload:** `file` (CSV)

**Response 200:** Import result

---

### GET /api/hr/positions

**Response 200:** Array of positions

---

### GET /api/hr/positions/:id

**Response 200:** Single position

---

### POST /api/hr/positions

**Payload:**
```json
{
  "name": "Project Manager",
  "code": "PM",
  "description": "Manages projects"
}
```

**Response 201:** Created position

---

### PUT /api/hr/positions/:id

**Payload:** Partial position object

**Response 200:** Updated position

---

### DELETE /api/hr/positions/:id

**Response 200/204:** Success

---

### GET /api/hr/stats

**Response 200:** HR statistics

---

### GET /api/hr/payroll/salary-structures

**Response 200:** Array of salary structures

---

### PUT /api/hr/payroll/salary-structures/:employeeId

**Payload:** Salary structure object

**Response 200:** Updated salary structure

---

### GET /api/hr/payroll/salary-slips

**Response 200:** Array of salary slips

---

### POST /api/hr/payroll/salary-slips

**Payload:** Salary slip object

**Response 201:** Created salary slip

---

### POST /api/hr/payroll/salary-slips/:id/post

**Response 200:** Posted salary slip

---

### GET /api/hr/leave/balance/:employeeId

**Response 200:** Leave balance by type

---

### POST /api/hr/leave/apply

**Payload:**
```json
{
  "employeeId": 1,
  "leaveTypeId": 1,
  "fromDate": "2026-02-10",
  "toDate": "2026-02-12",
  "totalDays": 3,
  "reason": "Family matter"
}
```

**Response 201:** Created leave application

---

### POST /api/hr/leave/applications/:id/approve

**Payload:**
```json
{
  "approved": true,
  "notes": "Approved"
}
```

**Response 200:** Updated leave application

---

### GET /api/hr/attendance/:employeeId

**Response 200:** Attendance records

---

### POST /api/hr/attendance/log

**Payload:**
```json
{
  "employeeId": 1,
  "type": "CLOCK_IN",
  "timestamp": "2026-02-18T08:00:00Z"
}
```

**Response 201:** Logged attendance

---

### GET /api/hr/loans/:employeeId

**Response 200:** Employee loans

---

### POST /api/hr/loans/apply

**Payload:**
```json
{
  "employeeId": 1,
  "amount": 5000000,
  "purpose": "Emergency",
  "tenureMonths": 12
}
```

**Response 201:** Created loan application

---

### GET /api/hr/shifts

**Response 200:** Array of shifts

---

### POST /api/hr/shifts

**Payload:**
```json
{
  "name": "Morning Shift",
  "startTime": "08:00",
  "endTime": "17:00"
}
```

**Response 201:** Created shift

---

## 4. Finance Service

### GET /api/finance/invoices

**Response 200:** Array of invoices

---

### GET /api/finance/invoices/:id

**Response 200:** Single invoice

---

### POST /api/finance/invoices

**Payload:** Invoice object (clientId, items, dueDate, etc.)

**Response 201:** Created invoice

---

### PUT /api/finance/invoices/:id

**Payload:** Partial invoice object

**Response 200:** Updated invoice

---

### PATCH /api/finance/invoices/:id/status

**Payload:**
```json
{
  "status": "SENT"
}
```

**Response 200:** Updated invoice status

---

### GET /api/finance/invoices/:id/pdf

**Response 200:** PDF file (`application/pdf`)

---

### DELETE /api/finance/invoices/:id

**Response 200/204:** Success

---

### GET /api/finance/purchase-orders

**Response 200:** Array of purchase orders

---

### GET /api/finance/purchase-orders/:id

**Response 200:** Single purchase order

---

### POST /api/finance/purchase-orders

**Payload:** Purchase order object

**Response 201:** Created purchase order

---

### PUT /api/finance/purchase-orders/:id

**Payload:** Partial purchase order object

**Response 200:** Updated purchase order

---

### PATCH /api/finance/purchase-orders/:id

**Payload:** Partial purchase order object

**Response 200:** Updated purchase order

---

### DELETE /api/finance/purchase-orders/:id

**Response 200/204:** Success

---

### GET /api/finance/purchase-orders/:id/pdf

**Response 200:** PDF file (`application/pdf`)

---

### GET /api/finance/quotations

**Response 200:** Array of quotations

---

### GET /api/finance/quotations/:id

**Response 200:** Single quotation

---

### POST /api/finance/quotations

**Payload:** Quotation object

**Response 201:** Created quotation

---

### PUT /api/finance/quotations/:id

**Payload:** Partial quotation object

**Response 200:** Updated quotation

---

### PATCH /api/finance/quotations/:id

**Payload:** Partial quotation object

**Response 200:** Updated quotation

---

### DELETE /api/finance/quotations/:id

**Response 200/204:** Success

---

### GET /api/finance/quotations/:id/pdf

**Response 200:** PDF file (`application/pdf`)

---

### GET /api/finance/clients

**Response 200:** Array of clients

---

### GET /api/finance/clients/:id

**Response 200:** Single client

---

### POST /api/finance/clients

**Payload:**
```json
{
  "name": "PT ABC Indonesia",
  "email": "finance@abc.co.id",
  "phone": "021-1234567",
  "address": "Jl. Sudirman No. 1",
  "npwp": "12.345.678.9-001.000"
}
```

**Response 201:** Created client

---

### PUT /api/finance/clients/:id

**Payload:** Partial client object

**Response 200:** Updated client

---

### PATCH /api/finance/clients/:id

**Payload:** Partial client object

**Response 200:** Updated client

---

### DELETE /api/finance/clients/:id

**Response 200/204:** Success

---

### GET /api/finance/vendors

**Response 200:** Array of vendors

---

### GET /api/finance/vendors/:id

**Response 200:** Single vendor

---

### POST /api/finance/vendors

**Payload:** Vendor object

**Response 201:** Created vendor

---

### PUT /api/finance/vendors/:id

**Payload:** Partial vendor object

**Response 200:** Updated vendor

---

### DELETE /api/finance/vendors/:id

**Response 200/204:** Success

---

### GET /api/finance/payments

**Response 200:** Array of payments

---

### GET /api/finance/payments/:id

**Response 200:** Single payment

---

### POST /api/finance/payments

**Payload:**
```json
{
  "invoiceId": 1,
  "amount": 15000000,
  "paymentMethod": "BANK_TRANSFER",
  "reference": "TRF-001"
}
```

**Response 201:** Created payment

---

### GET /api/finance/basts

**Response 200:** Array of BASTs

---

### GET /api/finance/basts/:id

**Response 200:** Single BAST

---

### POST /api/finance/basts

**Payload:** BAST object

**Response 201:** Created BAST

---

### PUT /api/finance/basts/:id

**Payload:** Partial BAST object

**Response 200:** Updated BAST

---

### DELETE /api/finance/basts/:id

**Response 200/204:** Success

---

### GET /api/finance/basts/:id/pdf

**Response 200:** PDF file (`application/pdf`)

---

### GET /api/finance/projects

**Response 200:** Array of projects

---

### GET /api/finance/projects/:id

**Response 200:** Single project

---

### POST /api/finance/projects

**Payload:** Project object

**Response 201:** Created project

---

### PUT /api/finance/projects/:id

**Payload:** Partial project object

**Response 200:** Updated project

---

### DELETE /api/finance/projects/:id

**Response 200/204:** Success

---

### GET /api/finance/tax-types

**Response 200:** Array of tax types

---

### GET /api/finance/tax-types/:id

**Response 200:** Single tax type

---

### POST /api/finance/tax-types

**Payload:** Tax type object

**Response 201:** Created tax type

---

### PUT /api/finance/tax-types/:id

**Payload:** Partial tax type object

**Response 200:** Updated tax type

---

### DELETE /api/finance/tax-types/:id

**Response 200/204:** Success

---

### GET /api/finance/proposal-penawaran

**Response 200:** Array of proposals

---

### GET /api/finance/proposal-penawaran/:id

**Response 200:** Single proposal

---

### POST /api/finance/proposal-penawaran

**Payload:** Proposal object

**Response 201:** Created proposal

---

### PUT /api/finance/proposal-penawaran/:id

**Payload:** Partial proposal object

**Response 200:** Updated proposal

---

### DELETE /api/finance/proposal-penawaran/:id

**Response 200/204:** Success

---

### GET /api/finance/proposal-penawaran/:id/pdf

**Response 200:** PDF file (`application/pdf`)

---

### GET /api/finance/expenses

**Response 200:** Array of expenses

---

### POST /api/finance/expenses

**Payload:** Expense object

**Response 201:** Created expense

---

### PATCH /api/finance/expenses/:id/status

**Payload:** `{ "status": "APPROVED" }`

**Response 200:** Updated expense

---

## 5. Inventory Service

### GET /api/inventory

**Response 200:** Array of inventory items

---

### GET /api/inventory/:id

**Response 200:** Single inventory item

---

### POST /api/inventory

**Payload:** Inventory item object

**Response 201:** Created inventory item

---

### PUT /api/inventory/:id

**Payload:** Partial inventory item object

**Response 200:** Updated inventory item

---

### DELETE /api/inventory/:id

**Response 200/204:** Success

---

### GET /api/inventory/products

**Response 200:** Array of products

---

### GET /api/inventory/products/:id

**Response 200:** Single product

---

### POST /api/inventory/products

**Payload:**
```json
{
  "name": "Widget A",
  "sku": "WGT-001",
  "unit": "pcs",
  "sellingPrice": "50000",
  "costPrice": "30000"
}
```

**Response 201:** Created product

---

### PUT /api/inventory/products/:id

**Payload:** Partial product object

**Response 200:** Updated product

---

### DELETE /api/inventory/products/:id

**Response 200:** Success

---

### POST /api/inventory/stock/entry

**Payload:**
```json
{
  "productId": 1,
  "warehouseId": 1,
  "quantity": 100,
  "type": "RECEIPT",
  "reference": "PO-001"
}
```

**Response 201:** Created stock entry

---

### GET /api/inventory/stock/balance

**Response 200:** Stock balance report

---

### GET /api/inventory/stock/entries

**Response 200:** Array of stock entries

---

### GET /api/inventory/warehouses

**Response 200:** Array of warehouses

---

### GET /api/inventory/warehouses/:id

**Response 200:** Single warehouse

---

### POST /api/inventory/warehouses

**Payload:**
```json
{
  "name": "Warehouse Jakarta",
  "location": "Jakarta Utara"
}
```

**Response 201:** Created warehouse

---

### PUT /api/inventory/warehouses/:id

**Payload:** Partial warehouse object

**Response 200:** Updated warehouse

---

## 6. Accounting Service

### GET /api/accounting/accounts

**Response 200:** Array of accounts (Chart of Accounts)

---

### POST /api/accounting/accounts

**Payload:**
```json
{
  "code": "1000",
  "name": "Cash",
  "type": "ASSET",
  "description": "Cash on hand"
}
```

**Response 201:** Created account

---

### PATCH /api/accounting/accounts/:id

**Payload:** Partial account object

**Response 200:** Updated account

---

### GET /api/accounting/journal-entries

**Response 200:** Array of journal entries

---

### POST /api/accounting/journal-entries

**Payload:**
```json
{
  "date": "2026-02-18",
  "description": "Payment received",
  "reference": "INV-001",
  "lines": [
    { "accountId": 1, "debit": 15000000, "credit": 0, "description": "Cash" },
    { "accountId": 2, "debit": 0, "credit": 15000000, "description": "Receivable" }
  ]
}
```

**Response 201:** Created journal entry

---

### GET /api/accounting/reports/balance-sheet

**Query:** `?asOfDate=2026-02-18`

**Response 200:**
```json
{
  "reportName": "Balance Sheet",
  "asOfDate": "2026-02-18",
  "assets": { "accounts": [], "total": 0 },
  "liabilities": { "accounts": [], "total": 0 },
  "equity": { "accounts": [], "total": 0 },
  "totalLiabilitiesAndEquity": 0,
  "balanced": true
}
```

---

### GET /api/accounting/reports/income-statement

**Query:** `?startDate=2026-01-01&endDate=2026-01-31`

**Response 200:** Income statement (P&L)

---

### GET /api/accounting/reports/trial-balance

**Query:** `?asOfDate=2026-02-18`

**Response 200:** Trial balance report

---

### GET /api/accounting/reports/general-ledger

**Query:** `?startDate=2026-01-01&endDate=2026-01-31&accountId=1`

**Response 200:** General ledger report

---

### GET /api/accounting/reports/aged-receivables

**Query:** `?asOfDate=2026-02-18`

**Response 200:** Aged receivables report

---

### GET /api/accounting/reports/aged-payables

**Query:** `?asOfDate=2026-02-18`

**Response 200:** Aged payables report

---

## 7. Manufacturing Service

### GET /api/manufacturing/boms

**Response 200:** Array of BOMs

---

### POST /api/manufacturing/boms

**Payload:**
```json
{
  "itemId": 1,
  "name": "BOM Product A",
  "quantity": 1,
  "items": [
    { "itemId": 2, "quantity": 5 }
  ]
}
```

**Response 201:** Created BOM

---

### GET /api/manufacturing/work-orders

**Response 200:** Array of work orders

---

### POST /api/manufacturing/work-orders

**Payload:**
```json
{
  "bomId": 1,
  "itemId": 1,
  "qtyToProduce": 10,
  "warehouseId": 1
}
```

**Response 201:** Created work order

---

### POST /api/manufacturing/work-orders/:id/start

**Response 200:** Work order started

---

### POST /api/manufacturing/work-orders/:id/complete

**Response 200:** Work order completed

---

## 8. Asset Service

### GET /api/assets

**Response 200:** Array of assets

---

### POST /api/assets

**Payload:**
```json
{
  "name": "Office Building",
  "category": "BUILDING",
  "purchaseDate": "2020-01-01",
  "purchaseAmount": "2000000000",
  "depreciationMethod": "SLM",
  "location": "Jakarta"
}
```

**Response 201:** Created asset

---

### GET /api/assets/:id

**Response 200:** Single asset

---

### PUT /api/assets/:id

**Payload:** Partial asset object

**Response 200:** Updated asset

---

### DELETE /api/assets/:id

**Response 200/204:** Success

---

## 9. Analytics Service

### GET /api/analytics/dashboard

**Response 200:** Dashboard KPIs

---

### GET /api/analytics/revenue

**Query:** `?period=monthly&year=2026&month=2`

**Response 200:** Revenue analytics data

---

### GET /api/analytics/hr

**Response 200:** HR metrics

---

### GET /api/analytics/inventory

**Response 200:** Inventory metrics

---

### GET /api/analytics/manufacturing

**Response 200:** Manufacturing metrics

---

## 10. Notification Service

### GET /api/notification

**Response 200:** Array of notifications

---

### GET /api/notification/:id

**Response 200:** Single notification

---

### PATCH /api/notification/:id/read

**Payload:** `{ "isRead": true }`

**Response 200:** Updated notification

---

## 11. Integration Service

### POST /api/integration/email/send

**Payload:**
```json
{
  "to": "client@example.com",
  "subject": "Invoice #INV-2026-001",
  "body": "<p>Please find attached invoice.</p>",
  "attachments": []
}
```

**Response 200/202:** Email sent or queued

---

### POST /api/integration/payment/create-link

**Payload:**
```json
{
  "invoiceId": 1,
  "invoiceNumber": "INV-2026-001",
  "amount": 15000000,
  "currency": "IDR",
  "description": "Invoice payment",
  "customerEmail": "client@example.com",
  "customerName": "PT Client"
}
```

**Response 201:** Payment link created

---

### POST /api/integration/payment/webhook/xendit

**Headers:** `x-callback-token: <token>`

**Payload:** Xendit webhook payload

**Response 200:** Webhook acknowledged

---

## 12. Batch Requests

### POST /api/batch

**Payload:**
```json
{
  "requests": [
    { "method": "GET", "url": "/api/employees" },
    { "method": "GET", "url": "/api/clients" }
  ]
}
```

**Response 200:** Array of responses for each request

---

## Error Response Format

All error responses use this structure:

```json
{
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error"
    }
  ]
}
```

| HTTP | Code | Description |
|------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Not logged in or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate or conflict |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | ERROR | Internal server error |
