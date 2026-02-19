# API Mapping Documentation – Employee Module

This document describes the API contract the frontend expects for the Employee module. Backend teams should implement endpoints that match this specification.

---

## Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `VITE_API_BASE_URL` (default: `/api`) |
| Content-Type | `application/json` |
| Accept | `application/json` |

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees |
| GET | `/api/employees/:id` | Get employee by ID |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |

---

## 1. List Employees

**Request**

```
GET /api/employees
```

**Response:** `200 OK`

```json
[
  {
    "id": "EMP-001",
    "nik": "2024001",
    "namaKaryawan": "Achmad Hakim",
    "namaJabatan": "DIREKTUR",
    "tmk": "2020-01-15",
    "noKtp": "3301011501850001",
    "noKk": "3301010101080001234",
    "npwp": "12.345.678.9-012.000",
    "noHp": "081234567890",
    "email": "achmadhakim@gmail.com",
    "pendidikan": "S2",
    "statusPajak": "K/2",
    "statusPerkawinan": "Kawin",
    "jumlahAnak": 2,
    "tempatLahir": "Jakarta",
    "tanggalLahir": "1985-01-15",
    "jenisKelamin": "L",
    "alamatKtp": "Jl. Sudirman No. 123",
    "kotaKtp": "Jakarta Pusat",
    "provinsiKtp": "DKI Jakarta",
    "noRek": "1370012345678",
    "namaBank": "Mandiri",
    "noJknKis": "0001234567890",
    "noJms": "JMS001234",
    "tanggalKeluar": null
  }
]
```

- Returns an array of Employee objects.
- Empty array `[]` if no employees.

---

## 2. Get Employee by ID

**Request**

```
GET /api/employees/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Employee ID (e.g. `EMP-001`) |

**Response:** `200 OK`

```json
{
  "id": "EMP-001",
  "nik": "2024001",
  "namaKaryawan": "Achmad Hakim",
  "namaJabatan": "DIREKTUR",
  "tmk": "2020-01-15",
  "noKtp": "3301011501850001",
  "noKk": "3301010101080001234",
  "npwp": "12.345.678.9-012.000",
  "noHp": "081234567890",
  "email": "achmadhakim@gmail.com",
  "pendidikan": "S2",
  "statusPajak": "K/2",
  "statusPerkawinan": "Kawin",
  "jumlahAnak": 2,
  "tempatLahir": "Jakarta",
  "tanggalLahir": "1985-01-15",
  "jenisKelamin": "L",
  "alamatKtp": "Jl. Sudirman No. 123",
  "kotaKtp": "Jakarta Pusat",
  "provinsiKtp": "DKI Jakarta",
  "noRek": "1370012345678",
  "namaBank": "Mandiri",
  "noJknKis": "0001234567890",
  "noJms": "JMS001234",
  "tanggalKeluar": null
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Employee not found |

---

## 3. Create Employee

**Request**

```
POST /api/employees
Content-Type: application/json
```

**Request Body:** All fields except `id` (server-generated)

```json
{
  "nik": "2024001",
  "namaKaryawan": "Achmad Hakim",
  "namaJabatan": "DIREKTUR",
  "tmk": "2020-01-15",
  "noKtp": "3301011501850001",
  "noKk": "3301010101080001234",
  "npwp": "12.345.678.9-012.000",
  "noHp": "081234567890",
  "email": "achmadhakim@gmail.com",
  "pendidikan": "S2",
  "statusPajak": "K/2",
  "statusPerkawinan": "Kawin",
  "jumlahAnak": 2,
  "tempatLahir": "Jakarta",
  "tanggalLahir": "1985-01-15",
  "jenisKelamin": "L",
  "alamatKtp": "Jl. Sudirman No. 123",
  "kotaKtp": "Jakarta Pusat",
  "provinsiKtp": "DKI Jakarta",
  "noRek": "1370012345678",
  "namaBank": "Mandiri",
  "noJknKis": "0001234567890",
  "noJms": "JMS001234",
  "tanggalKeluar": null
}
```

**Response:** `201 Created`

```json
{
  "id": "EMP-1739337600000-abc12",
  "nik": "2024001",
  "namaKaryawan": "Achmad Hakim",
  "namaJabatan": "DIREKTUR",
  ...
}
```

Backend must return the created employee, including the generated `id`.

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error (see Error Format) |
| 409 | Duplicate NIK or other conflict |

---

## 4. Update Employee

**Request**

```
PUT /api/employees/:id
Content-Type: application/json
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Employee ID |

**Request Body:** Partial – only fields to update

```json
{
  "namaKaryawan": "Achmad Hakim Updated",
  "noHp": "081234567899",
  "email": "achmad.updated@gmail.com"
}
```

**Response:** `200 OK`

```json
{
  "id": "EMP-001",
  "nik": "2024001",
  "namaKaryawan": "Achmad Hakim Updated",
  "namaJabatan": "DIREKTUR",
  "noHp": "081234567899",
  "email": "achmad.updated@gmail.com",
  ...
}
```

Return the full updated employee object.

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error |
| 404 | Employee not found |

---

## 5. Delete Employee

**Request**

```
DELETE /api/employees/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Employee ID |

**Response:** `200 OK` or `204 No Content`

- No response body required.
- Frontend treats any 2xx as success.

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Employee not found |

---

## Entity Schema: Employee

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes (response) | Unique identifier (server-generated) |
| nik | string | Yes | Nomor Induk Karyawan |
| namaKaryawan | string | Yes | Full name |
| namaJabatan | string | Yes | Job title (see enum) |
| tmk | string | No | Tanggal Mulai Kerja (YYYY-MM-DD) |
| noKtp | string | No | No. KTP |
| noKk | string | No | No. KK |
| npwp | string | No | NPWP |
| noHp | string | No | Phone number |
| email | string | No | Email (valid format if provided) |
| pendidikan | string | No | Education level |
| statusPajak | string | No | Tax status (see enum) |
| statusPerkawinan | string | No | Marital status (see enum) |
| jumlahAnak | number | No | Number of children |
| tempatLahir | string | No | Place of birth |
| tanggalLahir | string | No | Date of birth (YYYY-MM-DD) |
| jenisKelamin | string | No | Gender (see enum) |
| alamatKtp | string | No | KTP address |
| kotaKtp | string | No | City (KTP) |
| provinsiKtp | string | No | Province (KTP) |
| noRek | string | No | Bank account number |
| namaBank | string | No | Bank name (e.g. Mandiri) |
| noJknKis | string | No | JKN/KIS number |
| noJms | string | No | JMS number |
| tanggalKeluar | string \| null | No | Resignation date (YYYY-MM-DD), null if active |

### Enums

**namaJabatan** (exact values):

```
DIREKTUR
Manajemen Opration
Project Manager
SA
Secretary Office
HR GA
Finance Accounting
Technical Writer
Tenaga Ahli
EOS Oracle
EOS Ticketing
EOS Unsoed
```

**statusPajak**:

```
TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, K/3
```

**statusPerkawinan**:

```
Kawin, Belum Kawin
```

**jenisKelamin**:

```
L, P
```

---

## Error Response Format

Frontend expects errors in this shape:

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
| message | string | Error message (used for display) |
| code | string | Optional error code |
| errors | array | Optional per-field validation errors |

### HTTP Status Codes

| Code | Usage |
|------|--------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request / Validation |
| 404 | Not Found |
| 409 | Conflict (e.g. duplicate NIK) |
| 500 | Internal Server Error |

---

## Date Format

All date fields use ISO 8601 date only:

```
YYYY-MM-DD
```

Examples: `2020-01-15`, `1985-06-10`

---

## Summary Checklist for Backend

- [ ] `GET /api/employees` returns array of Employee
- [ ] `GET /api/employees/:id` returns single Employee or 404
- [ ] `POST /api/employees` accepts body without `id`, returns created Employee with `id`
- [ ] `PUT /api/employees/:id` accepts partial body, returns updated Employee
- [ ] `DELETE /api/employees/:id` returns 200/204 on success, 404 if not found
- [ ] All responses use `Content-Type: application/json`
- [ ] Error responses include `message` (and optionally `code`, `errors`)
- [ ] Enums match the values above (including "Manajemen Opration")

---

# API Mapping Documentation – Purchase Order Module

This document describes the API contract the frontend expects for the Purchase Order module. Backend teams should implement endpoints that match this specification.

---

## Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `VITE_API_BASE_URL` (default: `/api`) |
| Content-Type | `application/json` |
| Accept | `application/json` |

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchase-orders` | List all purchase orders |
| GET | `/api/purchase-orders/:id` | Get purchase order by ID |
| POST | `/api/purchase-orders` | Create purchase order |
| PUT | `/api/purchase-orders/:id` | Update purchase order |
| DELETE | `/api/purchase-orders/:id` | Delete purchase order |
| GET | `/api/purchase-orders/:id/pdf` | Get PDF document (Content-Type: application/pdf) |

---

## 1. List Purchase Orders

**Request**

```
GET /api/purchase-orders
```

**Response:** `200 OK`

```json
[
  {
    "id": "PO-001",
    "companyInfo": {
      "letterhead": "PT Rubbick Indonesia",
      "companyName": "PT Rubbick Indonesia",
      "logoUrl": "",
      "address": "Jl. Sudirman No. 123, Jakarta Pusat 10220",
      "phone": "+62 21 1234567"
    },
    "orderInfo": {
      "poDate": "2025-02-01",
      "poNumber": "PO-2025-001",
      "docReference": "REF-QUOTE-001"
    },
    "vendorInfo": {
      "vendorName": "PT Supplier Teknologi",
      "phone": "+62 21 7654321",
      "pic": {
        "name": "Budi Santoso",
        "position": "Sales Manager",
        "contact": "budi@supplier.com"
      }
    },
    "lineItems": [
      {
        "number": 1,
        "itemDescription": "Laptop Dell Latitude 5520",
        "quantity": 5,
        "unit": "Unit",
        "price": 15000000,
        "subtotal": 75000000,
        "taxRate": 11,
        "taxAmount": 8250000,
        "priceAfterTax": 83250000
      }
    ],
    "paymentProcedure": "DP 50% saat order, Pelunasan 50% saat delivery",
    "otherTerms": "Garansi 1 tahun untuk semua barang",
    "approval": {
      "position": "Direktur",
      "name": "Achmad Hakim",
      "signatureUrl": ""
    },
    "createdAt": "2025-02-01T10:00:00Z",
    "updatedAt": "2025-02-01T10:00:00Z"
  }
]
```

- Returns an array of PurchaseOrder objects.
- Empty array `[]` if no purchase orders.

---

## 2. Get Purchase Order by ID

**Request**

```
GET /api/purchase-orders/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Purchase Order ID (e.g. `PO-001`) |

**Response:** `200 OK`

```json
{
  "id": "PO-001",
  "companyInfo": {
    "letterhead": "PT Rubbick Indonesia",
    "companyName": "PT Rubbick Indonesia",
    "logoUrl": "",
    "address": "Jl. Sudirman No. 123, Jakarta Pusat 10220",
    "phone": "+62 21 1234567"
  },
  "orderInfo": {
    "poDate": "2025-02-01",
    "poNumber": "PO-2025-001",
    "docReference": "REF-QUOTE-001"
  },
  "vendorInfo": {
    "vendorName": "PT Supplier Teknologi",
    "phone": "+62 21 7654321",
    "pic": {
      "name": "Budi Santoso",
      "position": "Sales Manager",
      "contact": "budi@supplier.com"
    }
  },
  "lineItems": [
    {
      "number": 1,
      "itemDescription": "Laptop Dell Latitude 5520",
      "quantity": 5,
      "unit": "Unit",
      "price": 15000000,
      "subtotal": 75000000,
      "taxRate": 11,
      "taxAmount": 8250000,
      "priceAfterTax": 83250000
    }
  ],
  "paymentProcedure": "DP 50% saat order, Pelunasan 50% saat delivery",
  "otherTerms": "Garansi 1 tahun untuk semua barang",
  "approval": {
    "position": "Direktur",
    "name": "Achmad Hakim",
    "signatureUrl": ""
  },
  "createdAt": "2025-02-01T10:00:00Z",
  "updatedAt": "2025-02-01T10:00:00Z"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Purchase order not found |

---

## 3. Create Purchase Order

**Request**

```
POST /api/purchase-orders
Content-Type: application/json
```

**Request Body:** All fields except `id`, `createdAt`, `updatedAt` (server-generated)

```json
{
  "companyInfo": {
    "letterhead": "PT Rubbick Indonesia",
    "companyName": "PT Rubbick Indonesia",
    "logoUrl": "",
    "address": "Jl. Sudirman No. 123, Jakarta Pusat 10220",
    "phone": "+62 21 1234567"
  },
  "orderInfo": {
    "poDate": "2025-02-01",
    "poNumber": "PO-2025-001",
    "docReference": "REF-QUOTE-001"
  },
  "vendorInfo": {
    "vendorName": "PT Supplier Teknologi",
    "phone": "+62 21 7654321",
    "pic": {
      "name": "Budi Santoso",
      "position": "Sales Manager",
      "contact": "budi@supplier.com"
    }
  },
  "lineItems": [
    {
      "number": 1,
      "itemDescription": "Laptop Dell Latitude 5520",
      "quantity": 5,
      "unit": "Unit",
      "price": 15000000,
      "subtotal": 75000000,
      "taxRate": 11,
      "taxAmount": 8250000,
      "priceAfterTax": 83250000
    }
  ],
  "paymentProcedure": "DP 50% saat order, Pelunasan 50% saat delivery",
  "otherTerms": "Garansi 1 tahun untuk semua barang",
  "approval": {
    "position": "Direktur",
    "name": "Achmad Hakim",
    "signatureUrl": ""
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "PO-1739337600000-abc12",
  "companyInfo": { ... },
  "orderInfo": { ... },
  "vendorInfo": { ... },
  "lineItems": [ ... ],
  "paymentProcedure": "...",
  "otherTerms": "...",
  "approval": { ... },
  "createdAt": "2025-02-01T10:00:00Z",
  "updatedAt": "2025-02-01T10:00:00Z"
}
```

Backend must return the created purchase order, including the generated `id`, `createdAt`, and `updatedAt`.

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error (see Error Format) |
| 409 | Duplicate PO number or other conflict |

---

## 4. Update Purchase Order

**Request**

```
PUT /api/purchase-orders/:id
Content-Type: application/json
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Purchase Order ID |

**Request Body:** Partial – only fields to update

```json
{
  "orderInfo": {
    "poDate": "2025-02-02",
    "poNumber": "PO-2025-001",
    "docReference": "REF-QUOTE-001-UPDATED"
  }
}
```

**Response:** `200 OK`

Return the full updated purchase order object.

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error |
| 404 | Purchase order not found |

---

## 5. Delete Purchase Order

**Request**

```
DELETE /api/purchase-orders/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Purchase Order ID |

**Response:** `200 OK` or `204 No Content`

- No response body required.
- Frontend treats any 2xx as success.

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Purchase order not found |

---

## 6. Get Purchase Order PDF

**Request**

```
GET /api/purchase-orders/:id/pdf
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Purchase Order ID |

**Response:** `200 OK`

- **Content-Type:** `application/pdf`
- Body: Binary PDF document
- Frontend displays this in an iframe for document preview

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Purchase order not found |

---

## Entity Schema: Purchase Order

### CompanyInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| letterhead | string | No | Kop Surat |
| companyName | string | Yes | Nama Perusahaan |
| logoUrl | string | No | Logo URL |
| address | string | Yes | Alamat Lengkap + No. Telepon |
| phone | string | Yes | No. Telepon |

### OrderInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| poDate | string | Yes | Tanggal PO (YYYY-MM-DD) |
| poNumber | string | Yes | No. PO |
| docReference | string | No | Doc. Reference |

### VendorPic

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | PIC Nama |
| position | string | Yes | PIC Jabatan |
| contact | string | No | PIC Kontak |

### VendorInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| vendorName | string | Yes | Nama Vendor |
| phone | string | Yes | No. Telepon Vendor |
| pic | VendorPic | Yes | PIC (Nama, Jabatan, Kontak) |

### PurchaseOrderLineItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| number | number | Yes | Nomor urut |
| itemDescription | string | Yes | Item deskripsi |
| quantity | number | Yes | Kuantitas |
| unit | string | Yes | Unit |
| price | number | Yes | Harga |
| subtotal | number | Yes | Subtotal (qty × price) |
| taxRate | number | No | Tax rate % (e.g. 11 for 11%) |
| taxAmount | number | No | Pajak amount |
| priceAfterTax | number | No | Harga setelah pajak |

### DocumentApproval

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| position | string | Yes | Jabatan |
| name | string | Yes | Nama |
| signatureUrl | string | No | TTD (signature image URL) |

### PurchaseOrder

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes (response) | Unique identifier (server-generated) |
| companyInfo | CompanyInfo | Yes | Informasi Perusahaan |
| orderInfo | OrderInfo | Yes | Informasi Pesanan |
| vendorInfo | VendorInfo | Yes | Informasi Vendor |
| lineItems | PurchaseOrderLineItem[] | Yes | Detail Pesanan |
| paymentProcedure | string | No | Prosedur Pembayaran (Termin, DP, Pelunasan) |
| otherTerms | string | No | Ketentuan Lain |
| approval | DocumentApproval | Yes | Pengesahan Dokumen |
| createdAt | string | No | ISO 8601 datetime |
| updatedAt | string | No | ISO 8601 datetime |

---

## Error Response Format

Same as Employee module – see Error Response Format section above.

---

## Summary Checklist for Backend

- [ ] `GET /api/purchase-orders` returns array of PurchaseOrder
- [ ] `GET /api/purchase-orders/:id` returns single PurchaseOrder or 404
- [ ] `POST /api/purchase-orders` accepts body without `id`, returns created PurchaseOrder with `id`, `createdAt`, `updatedAt`
- [ ] `PUT /api/purchase-orders/:id` accepts partial body, returns updated PurchaseOrder
- [ ] `DELETE /api/purchase-orders/:id` returns 200/204 on success, 404 if not found
- [ ] `GET /api/purchase-orders/:id/pdf` returns PDF binary with Content-Type: application/pdf
- [ ] All JSON responses use `Content-Type: application/json`
- [ ] Error responses include `message` (and optionally `code`, `errors`)

---

# API Mapping Documentation – Invoice Module

This document describes the API contract the frontend expects for the Invoice module. Backend teams should implement endpoints that match this specification.

---

## Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `VITE_API_BASE_URL` (default: `/api`) |
| Content-Type | `application/json` |
| Accept | `application/json` |

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List all invoices |
| GET | `/api/invoices/:id` | Get invoice by ID |
| POST | `/api/invoices` | Create invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| GET | `/api/invoices/:id/pdf` | Get PDF document (Content-Type: application/pdf) |

---

## 1. List Invoices

**Request**

```
GET /api/invoices
```

**Response:** `200 OK`

```json
[
  {
    "id": "INV-001",
    "companyInfo": {
      "letterhead": "PT Rubbick Indonesia",
      "companyName": "PT Rubbick Indonesia",
      "logoUrl": "",
      "address": "Jl. Sudirman No. 123, Jakarta Pusat 10220",
      "phone": "+62 21 1234567"
    },
    "invoiceInfo": {
      "invoiceName": "Invoice Penjualan Barang",
      "invoiceNumber": "INV-2025-001",
      "invoiceDate": "2025-02-01",
      "taxInvoice": "010.000-25.12345678",
      "dueDate": "2025-02-15"
    },
    "billingInfo": {
      "companyName": "PT Bank Mandiri",
      "address": "Jl. Gatot Subroto Kav. 36-38, Jakarta Selatan",
      "phone": "+62 21 5245000",
      "pic": {
        "name": "Budi Santoso",
        "position": "Purchasing Manager",
        "contact": "budi@bankmandiri.co.id"
      }
    },
    "lineItems": [
      {
        "number": 1,
        "itemDescription": "Laptop Dell Latitude 5520",
        "quantity": 5,
        "unit": "Unit",
        "price": 15000000,
        "subtotal": 75000000,
        "taxRate": 11,
        "taxAmount": 8250000,
        "priceAfterTax": 83250000
      }
    ],
    "paymentInfo": {
      "bank": "Bank Mandiri",
      "accountNumber": "1370012345678",
      "branch": "Cabang Sudirman",
      "accountName": "PT Rubbick Indonesia",
      "npwp": "12.345.678.9-012.000"
    },
    "approval": {
      "position": "Direktur",
      "name": "Achmad Hakim",
      "signatureUrl": ""
    },
    "notes": "Pembayaran transfer ke rekening di atas.",
    "createdAt": "2025-02-01T10:00:00Z",
    "updatedAt": "2025-02-01T10:00:00Z"
  }
]
```

- Returns an array of Invoice objects.
- Empty array `[]` if no invoices.

---

## 2. Get Invoice by ID

**Request**

```
GET /api/invoices/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Invoice ID (e.g. `INV-001`) |

**Response:** `200 OK`

```json
{
  "id": "INV-001",
  "companyInfo": {
    "letterhead": "PT Rubbick Indonesia",
    "companyName": "PT Rubbick Indonesia",
    "logoUrl": "",
    "address": "Jl. Sudirman No. 123, Jakarta Pusat 10220",
    "phone": "+62 21 1234567"
  },
  "invoiceInfo": {
    "invoiceName": "Invoice Penjualan Barang",
    "invoiceNumber": "INV-2025-001",
    "invoiceDate": "2025-02-01",
    "taxInvoice": "010.000-25.12345678",
    "dueDate": "2025-02-15"
  },
  "billingInfo": {
    "companyName": "PT Bank Mandiri",
    "address": "Jl. Gatot Subroto Kav. 36-38, Jakarta Selatan",
    "phone": "+62 21 5245000",
    "pic": {
      "name": "Budi Santoso",
      "position": "Purchasing Manager",
      "contact": "budi@bankmandiri.co.id"
    }
  },
  "lineItems": [
    {
      "number": 1,
      "itemDescription": "Laptop Dell Latitude 5520",
      "quantity": 5,
      "unit": "Unit",
      "price": 15000000,
      "subtotal": 75000000,
      "taxRate": 11,
      "taxAmount": 8250000,
      "priceAfterTax": 83250000
    }
  ],
  "paymentInfo": {
    "bank": "Bank Mandiri",
    "accountNumber": "1370012345678",
    "branch": "Cabang Sudirman",
    "accountName": "PT Rubbick Indonesia",
    "npwp": "12.345.678.9-012.000"
  },
  "approval": {
    "position": "Direktur",
    "name": "Achmad Hakim",
    "signatureUrl": ""
  },
  "notes": "Pembayaran transfer ke rekening di atas.",
  "createdAt": "2025-02-01T10:00:00Z",
  "updatedAt": "2025-02-01T10:00:00Z"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Invoice not found |

---

## 3. Create Invoice

**Request**

```
POST /api/invoices
Content-Type: application/json
```

**Request Body:** All fields except `id`, `createdAt`, `updatedAt` (server-generated)

```json
{
  "companyInfo": {
    "letterhead": "PT Rubbick Indonesia",
    "companyName": "PT Rubbick Indonesia",
    "logoUrl": "",
    "address": "Jl. Sudirman No. 123, Jakarta Pusat 10220",
    "phone": "+62 21 1234567"
  },
  "invoiceInfo": {
    "invoiceName": "Invoice Penjualan Barang",
    "invoiceNumber": "INV-2025-001",
    "invoiceDate": "2025-02-01",
    "taxInvoice": "010.000-25.12345678",
    "dueDate": "2025-02-15"
  },
  "billingInfo": {
    "companyName": "PT Bank Mandiri",
    "address": "Jl. Gatot Subroto Kav. 36-38, Jakarta Selatan",
    "phone": "+62 21 5245000",
    "pic": {
      "name": "Budi Santoso",
      "position": "Purchasing Manager",
      "contact": "budi@bankmandiri.co.id"
    }
  },
  "lineItems": [
    {
      "number": 1,
      "itemDescription": "Laptop Dell Latitude 5520",
      "quantity": 5,
      "unit": "Unit",
      "price": 15000000,
      "subtotal": 75000000,
      "taxRate": 11,
      "taxAmount": 8250000,
      "priceAfterTax": 83250000
    }
  ],
  "paymentInfo": {
    "bank": "Bank Mandiri",
    "accountNumber": "1370012345678",
    "branch": "Cabang Sudirman",
    "accountName": "PT Rubbick Indonesia",
    "npwp": "12.345.678.9-012.000"
  },
  "approval": {
    "position": "Direktur",
    "name": "Achmad Hakim",
    "signatureUrl": ""
  },
  "notes": "Pembayaran transfer ke rekening di atas."
}
```

**Response:** `201 Created`

```json
{
  "id": "INV-1739337600000-abc12",
  "companyInfo": { ... },
  "invoiceInfo": { ... },
  "billingInfo": { ... },
  "lineItems": [ ... ],
  "paymentInfo": { ... },
  "approval": { ... },
  "notes": "...",
  "createdAt": "2025-02-01T10:00:00Z",
  "updatedAt": "2025-02-01T10:00:00Z"
}
```

Backend must return the created invoice, including the generated `id`, `createdAt`, and `updatedAt`.

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error (see Error Format) |
| 409 | Duplicate invoice number or other conflict |

---

## 4. Update Invoice

**Request**

```
PUT /api/invoices/:id
Content-Type: application/json
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Invoice ID |

**Request Body:** Partial – only fields to update

```json
{
  "invoiceInfo": {
    "invoiceDate": "2025-02-02",
    "dueDate": "2025-02-16"
  }
}
```

**Response:** `200 OK`

Return the full updated invoice object.

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error |
| 404 | Invoice not found |

---

## 5. Delete Invoice

**Request**

```
DELETE /api/invoices/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Invoice ID |

**Response:** `200 OK` or `204 No Content`

- No response body required.
- Frontend treats any 2xx as success.

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Invoice not found |

---

## 6. Get Invoice PDF

**Request**

```
GET /api/invoices/:id/pdf
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Invoice ID |

**Response:** `200 OK`

- **Content-Type:** `application/pdf`
- Body: Binary PDF document
- Frontend displays this in an iframe for document preview

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Invoice not found |

---

## Entity Schema: Invoice

### CompanyInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| letterhead | string | No | Kop Surat |
| companyName | string | Yes | Nama Perusahaan |
| logoUrl | string | No | Logo URL |
| address | string | Yes | Alamat Lengkap + No. Telepon |
| phone | string | Yes | No. Telepon |

### InvoiceInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| invoiceName | string | Yes | Nama Invoice |
| invoiceNumber | string | Yes | No. Invoice |
| invoiceDate | string | Yes | Tanggal Inv. (YYYY-MM-DD) |
| taxInvoice | string | No | Faktur Pajak |
| dueDate | string | Yes | Jatuh Tempo (YYYY-MM-DD) |

### BillingPic

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | PIC Nama |
| position | string | Yes | PIC Jabatan |
| contact | string | No | PIC Kontak |

### BillingInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| companyName | string | Yes | Nama Lengkap Perusahaan |
| address | string | Yes | Alamat Lengkap Perusahaan |
| phone | string | Yes | No. Telepon |
| pic | BillingPic | Yes | PIC (Nama, Jabatan, Kontak) |

### InvoiceLineItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| number | number | Yes | Nomor urut |
| itemDescription | string | Yes | Item deskripsi |
| quantity | number | Yes | Kuantitas |
| unit | string | Yes | Unit |
| price | number | Yes | Harga |
| subtotal | number | Yes | Subtotal (qty × price) |
| taxRate | number | No | Tax rate % (e.g. 11 for 11%) |
| taxAmount | number | No | Pajak amount |
| priceAfterTax | number | No | Harga setelah pajak |

### PaymentInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| bank | string | Yes | Bank |
| accountNumber | string | Yes | Nomor Akun Bank |
| branch | string | Yes | Cabang Bank |
| accountName | string | Yes | Nama Akun Bank |
| npwp | string | No | NPWP |

### DocumentApproval

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| position | string | Yes | Jabatan |
| name | string | Yes | Nama |
| signatureUrl | string | No | TTD (signature image URL) |

### Invoice

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes (response) | Unique identifier (server-generated) |
| companyInfo | CompanyInfo | Yes | Informasi Perusahaan |
| invoiceInfo | InvoiceInfo | Yes | Informasi Invoice |
| billingInfo | BillingInfo | Yes | Informasi Tagihan |
| lineItems | InvoiceLineItem[] | Yes | Detail Pesanan |
| paymentInfo | PaymentInfo | Yes | Informasi Pembayaran |
| approval | DocumentApproval | Yes | Pengesahan Dokumen |
| notes | string | No | Notes / Terms and Conditions |
| createdAt | string | No | ISO 8601 datetime |
| updatedAt | string | No | ISO 8601 datetime |

---

## Error Response Format

Same as Employee module – see Error Response Format section above.

---

## Summary Checklist for Backend

- [ ] `GET /api/invoices` returns array of Invoice
- [ ] `GET /api/invoices/:id` returns single Invoice or 404
- [ ] `POST /api/invoices` accepts body without `id`, returns created Invoice with `id`, `createdAt`, `updatedAt`
- [ ] `PUT /api/invoices/:id` accepts partial body, returns updated Invoice
- [ ] `DELETE /api/invoices/:id` returns 200/204 on success, 404 if not found
- [ ] `GET /api/invoices/:id/pdf` returns PDF binary with Content-Type: application/pdf
- [ ] All JSON responses use `Content-Type: application/json`
- [ ] Error responses include `message` (and optionally `code`, `errors`)

---

# API Mapping Documentation – BAST Module

This document describes the API contract the frontend expects for the BAST (Berita Acara Serah Terima) module. Backend teams should implement endpoints that match this specification.

---

## Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `VITE_API_BASE_URL` (default: `/api`) |
| Content-Type | `application/json` |
| Accept | `application/json` |

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/basts` | List all BASTs |
| GET | `/api/basts/:id` | Get BAST by ID |
| POST | `/api/basts` | Create BAST |
| PUT | `/api/basts/:id` | Update BAST |
| DELETE | `/api/basts/:id` | Delete BAST |
| GET | `/api/basts/:id/pdf` | Get PDF document (Content-Type: application/pdf) |

---

## 1. List BASTs

**Request**

```
GET /api/basts
```

**Response:** `200 OK`

```json
[
  {
    "id": "BAST-001",
    "coverInfo": {
      "jobOffer": "Jasa Konsultasi Migrasi Cloud",
      "companyName": "PT Rubbick Indonesia",
      "bastMonth": "2025-02",
      "address": "Jl. Sudirman No. 123, Jakarta Pusat 10220",
      "phone": "+62 21 1234567"
    },
    "documentInfo": {
      "bastNumber": "BAST-2025-001",
      "bastDate": "2025-02-15",
      "relatedPoOrInvoice": "PO-2025-001 / INV-2025-001"
    },
    "deliveringParty": {
      "name": "Budi Santoso",
      "position": "Project Manager",
      "company": "PT Rubbick Indonesia",
      "signatureUrl": ""
    },
    "receivingParty": {
      "name": "Achmad Hakim",
      "position": "IT Manager",
      "company": "PT Bank Mandiri",
      "signatureUrl": ""
    },
    "createdAt": "2025-02-15T10:00:00Z",
    "updatedAt": "2025-02-15T10:00:00Z"
  }
]
```

- Returns an array of BAST objects.
- Empty array `[]` if no BASTs.

---

## 2. Get BAST by ID

**Request**

```
GET /api/basts/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | BAST ID (e.g. `BAST-001`) |

**Response:** `200 OK`

```json
{
  "id": "BAST-001",
  "coverInfo": {
    "jobOffer": "Jasa Konsultasi Migrasi Cloud",
    "companyName": "PT Rubbick Indonesia",
    "bastMonth": "2025-02",
    "address": "Jl. Sudirman No. 123, Jakarta Pusat 10220",
    "phone": "+62 21 1234567"
  },
  "documentInfo": {
    "bastNumber": "BAST-2025-001",
    "bastDate": "2025-02-15",
    "relatedPoOrInvoice": "PO-2025-001 / INV-2025-001"
  },
  "deliveringParty": {
    "name": "Budi Santoso",
    "position": "Project Manager",
    "company": "PT Rubbick Indonesia",
    "signatureUrl": ""
  },
  "receivingParty": {
    "name": "Achmad Hakim",
    "position": "IT Manager",
    "company": "PT Bank Mandiri",
    "signatureUrl": ""
  },
  "createdAt": "2025-02-15T10:00:00Z",
  "updatedAt": "2025-02-15T10:00:00Z"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | BAST not found |

---

## 3. Create BAST

**Request**

```
POST /api/basts
Content-Type: application/json
```

**Request Body:** All fields except `id`, `createdAt`, `updatedAt` (server-generated)

```json
{
  "coverInfo": {
    "jobOffer": "Jasa Konsultasi Migrasi Cloud",
    "companyName": "PT Rubbick Indonesia",
    "bastMonth": "2025-02",
    "address": "Jl. Sudirman No. 123, Jakarta Pusat 10220",
    "phone": "+62 21 1234567"
  },
  "documentInfo": {
    "bastNumber": "BAST-2025-001",
    "bastDate": "2025-02-15",
    "relatedPoOrInvoice": "PO-2025-001 / INV-2025-001"
  },
  "deliveringParty": {
    "name": "Budi Santoso",
    "position": "Project Manager",
    "company": "PT Rubbick Indonesia",
    "signatureUrl": ""
  },
  "receivingParty": {
    "name": "Achmad Hakim",
    "position": "IT Manager",
    "company": "PT Bank Mandiri",
    "signatureUrl": ""
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "BAST-1739337600000-abc12",
  "coverInfo": { ... },
  "documentInfo": { ... },
  "deliveringParty": { ... },
  "receivingParty": { ... },
  "createdAt": "2025-02-15T10:00:00Z",
  "updatedAt": "2025-02-15T10:00:00Z"
}
```

Backend must return the created BAST, including the generated `id`, `createdAt`, and `updatedAt`.

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error (see Error Format) |
| 409 | Duplicate BAST number or other conflict |

---

## 4. Update BAST

**Request**

```
PUT /api/basts/:id
Content-Type: application/json
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | BAST ID |

**Request Body:** Partial – only fields to update

```json
{
  "documentInfo": {
    "bastDate": "2025-02-16",
    "relatedPoOrInvoice": "PO-2025-001"
  }
}
```

**Response:** `200 OK`

Return the full updated BAST object.

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error |
| 404 | BAST not found |

---

## 5. Delete BAST

**Request**

```
DELETE /api/basts/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | BAST ID |

**Response:** `200 OK` or `204 No Content`

- No response body required.
- Frontend treats any 2xx as success.

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | BAST not found |

---

## 6. Get BAST PDF

**Request**

```
GET /api/basts/:id/pdf
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | BAST ID |

**Response:** `200 OK`

- **Content-Type:** `application/pdf`
- Body: Binary PDF document
- Frontend displays this in an iframe for document preview

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | BAST not found |

---

## Entity Schema: BAST

### CoverInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| jobOffer | string | Yes | Penawaran pekerjaan/jasa |
| companyName | string | Yes | Nama Perusahaan |
| bastMonth | string | Yes | Bulan BAST (YYYY-MM format) |
| address | string | Yes | Alamat (Informasi Perusahaan) |
| phone | string | Yes | No. Telepon |

### DocumentInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| bastNumber | string | Yes | Nomor BAST |
| bastDate | string | Yes | Tanggal BAST (YYYY-MM-DD) |
| relatedPoOrInvoice | string | No | Nomor PO/Invoice Terkait |

### PartySignature

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Nama |
| position | string | Yes | Jabatan |
| company | string | Yes | Perusahaan |
| signatureUrl | string | No | Tanda Tangan (signature image URL) |

### BAST

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes (response) | Unique identifier (server-generated) |
| coverInfo | CoverInfo | Yes | Cover |
| documentInfo | DocumentInfo | Yes | Informasi Dokumen |
| deliveringParty | PartySignature | Yes | Pihak Penyerah |
| receivingParty | PartySignature | Yes | Pihak Penerima |
| createdAt | string | No | ISO 8601 datetime |
| updatedAt | string | No | ISO 8601 datetime |

---

## Error Response Format

Same as Employee module – see Error Response Format section above.

---

## Summary Checklist for Backend

- [ ] `GET /api/basts` returns array of BAST
- [ ] `GET /api/basts/:id` returns single BAST or 404
- [ ] `POST /api/basts` accepts body without `id`, returns created BAST with `id`, `createdAt`, `updatedAt`
- [ ] `PUT /api/basts/:id` accepts partial body, returns updated BAST
- [ ] `DELETE /api/basts/:id` returns 200/204 on success, 404 if not found
- [ ] `GET /api/basts/:id/pdf` returns PDF binary with Content-Type: application/pdf
- [ ] All JSON responses use `Content-Type: application/json`
- [ ] Error responses include `message` (and optionally `code`, `errors`)

---

# API Mapping Documentation – Project Module

This document describes the API contract the frontend expects for the Project module. Backend teams should implement endpoints that match this specification.

---

## Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `VITE_API_BASE_URL` (default: `/api`) |
| Content-Type | `application/json` |
| Accept | `application/json` |

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get project by ID |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

---

## 1. List Projects

**Request**

```
GET /api/projects
```

**Response:** `200 OK`

```json
[
  {
    "id": "PRJ-001",
    "identity": {
      "projectId": "PRJ-2025-001",
      "namaProject": "Migrasi Cloud Bank Mandiri",
      "clientId": "C001",
      "clientName": "PT Bank Mandiri",
      "scopeProject": "Migrasi infrastruktur ke cloud",
      "startDate": "2025-01-15",
      "endDate": "2025-07-15",
      "projectManagerId": "EMP-002",
      "projectManagerName": "Dewi Sartika",
      "status": "on_progress"
    },
    "documentRelations": {
      "proposalIds": ["PROP-001"],
      "quotationIds": ["QUO-001"],
      "purchaseOrderIds": ["PO-001"],
      "invoiceIds": ["INV-001"],
      "bastIds": ["BAST-001"]
    },
    "finance": {
      "income": 125000000,
      "expense": 45000000,
      "profitLoss": 80000000
    },
    "documents": [
      {
        "url": "https://example.com/contract-001.pdf",
        "name": "Kontrak Kerja",
        "type": "contract",
        "uploadedAt": "2025-01-10T09:00:00Z"
      }
    ],
    "createdAt": "2025-01-10T09:00:00Z",
    "updatedAt": "2025-02-01T10:00:00Z"
  }
]
```

- Returns an array of Project objects.
- Empty array `[]` if no projects.

---

## 2. Get Project by ID

**Request**

```
GET /api/projects/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Project ID (e.g. `PRJ-001`) |

**Response:** `200 OK`

Full Project object (same structure as list item).

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Project not found |

---

## 3. Create Project

**Request**

```
POST /api/projects
Content-Type: application/json
```

**Request Body:** All fields except `id`, `createdAt`, `updatedAt` (server-generated). `profitLoss` may be computed server-side as `income - expense`.

```json
{
  "identity": {
    "projectId": "PRJ-2025-001",
    "namaProject": "Migrasi Cloud Bank Mandiri",
    "clientId": "C001",
    "clientName": "PT Bank Mandiri",
    "scopeProject": "Migrasi infrastruktur ke cloud",
    "startDate": "2025-01-15",
    "endDate": "2025-07-15",
    "projectManagerId": "EMP-002",
    "projectManagerName": "Dewi Sartika",
    "status": "on_progress"
  },
  "documentRelations": {
    "proposalIds": ["PROP-001"],
    "quotationIds": ["QUO-001"],
    "purchaseOrderIds": ["PO-001"],
    "invoiceIds": ["INV-001"],
    "bastIds": ["BAST-001"]
  },
  "finance": {
    "income": 125000000,
    "expense": 45000000,
    "profitLoss": 80000000
  },
  "documents": [
    {
      "url": "https://example.com/contract-001.pdf",
      "name": "Kontrak Kerja",
      "type": "contract",
      "uploadedAt": "2025-01-10T09:00:00Z"
    }
  ]
}
```

**Response:** `201 Created`

Returns the created Project with `id`, `createdAt`, `updatedAt`.

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error |
| 409 | Duplicate project ID or conflict |

---

## 4. Update Project

**Request**

```
PUT /api/projects/:id
Content-Type: application/json
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Project ID |

**Request Body:** Partial – only fields to update. If `finance.income` or `finance.expense` is updated, `profitLoss` should be recomputed.

**Response:** `200 OK`

Returns the full updated Project object.

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error |
| 404 | Project not found |

---

## 5. Delete Project

**Request**

```
DELETE /api/projects/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Project ID |

**Response:** `200 OK` or `204 No Content`

- No response body required.
- Frontend treats any 2xx as success.

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Project not found |

---

## Entity Schema: Project

### ProjectIdentity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| projectId | string | Yes | Project ID |
| namaProject | string | Yes | Nama Project |
| clientId | string | Yes | FK to clients table |
| clientName | string | Yes | Client name (denormalized for display) |
| scopeProject | string | No | Scope Project |
| startDate | string | Yes | Start Date (YYYY-MM-DD) |
| endDate | string | Yes | End Date (YYYY-MM-DD) |
| projectManagerId | string | No | FK to employees (PIC Internal) |
| projectManagerName | string | No | Project Manager name (denormalized) |
| status | string | Yes | on_progress, completed, cancelled |

### DocumentRelations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| proposalIds | string[] | Yes | Linked Proposal document IDs |
| quotationIds | string[] | Yes | Linked Quotation document IDs |
| purchaseOrderIds | string[] | Yes | Linked PO document IDs |
| invoiceIds | string[] | Yes | Linked Invoice document IDs |
| bastIds | string[] | Yes | Linked BAST document IDs |

### ProjectFinance

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| income | number | Yes | Income (linked to Invoice/Payment) |
| expense | number | Yes | Expense (internal, vendor, operational) |
| profitLoss | number | Yes | Computed: income - expense |

### ProjectDocument

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | Document URL |
| name | string | Yes | Document name |
| type | string | Yes | contract, photo, file, report |
| uploadedAt | string | No | ISO 8601 datetime |

### Project

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes (response) | Unique identifier (server-generated) |
| identity | ProjectIdentity | Yes | Identitas Project |
| documentRelations | DocumentRelations | Yes | Relasi Dokumen |
| finance | ProjectFinance | Yes | Keuangan Project |
| documents | ProjectDocument[] | Yes | Dokumentasi Project |
| createdAt | string | No | ISO 8601 datetime |
| updatedAt | string | No | ISO 8601 datetime |

### Status Enum

| Value | Display |
|-------|---------|
| on_progress | On Progress |
| completed | Completed |
| cancelled | Cancelled |

---

## Error Response Format

Same as Employee module – see Error Response Format section above.

---

## Summary Checklist for Backend

- [ ] `GET /api/projects` returns array of Project
- [ ] `GET /api/projects/:id` returns single Project or 404
- [ ] `POST /api/projects` accepts body without `id`, returns created Project with `id`, `createdAt`, `updatedAt`
- [ ] `PUT /api/projects/:id` accepts partial body, returns updated Project
- [ ] `DELETE /api/projects/:id` returns 200/204 on success, 404 if not found
- [ ] All JSON responses use `Content-Type: application/json`
- [ ] Error responses include `message` (and optionally `code`, `errors`)
- [ ] `clientId` references clients table; `projectManagerId` references employees table

---

# API Mapping Documentation – Perpajakan (Tax Type) Module

This document describes the API contract the frontend expects for the Perpajakan (Tax Type) module. Backend teams should implement endpoints that match this specification.

---

## Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `VITE_API_BASE_URL` (default: `/api`) |
| Content-Type | `application/json` |
| Accept | `application/json` |

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tax-types` | List all tax types |
| GET | `/api/tax-types/:id` | Get tax type by ID |
| POST | `/api/tax-types` | Create tax type |
| PUT | `/api/tax-types/:id` | Update tax type |
| DELETE | `/api/tax-types/:id` | Delete tax type |
| GET | `/api/tax-types/:id/pdf` | Get PDF document (regulation/certificate) for iframe display |

---

## 1. List Tax Types

**Request**

```
GET /api/tax-types
```

**Response:** `200 OK`

```json
[
  {
    "id": "TAX-001",
    "code": "PPN_11",
    "name": "PPN 11%",
    "rate": 11,
    "category": "output_tax",
    "description": "Paling sering muncul di Invoice ke klien",
    "regulation": null,
    "applicableDocuments": ["invoice"],
    "documentUrl": null,
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  {
    "id": "TAX-002",
    "code": "PPH_23_2",
    "name": "PPh 23 (2%)",
    "rate": 2,
    "category": "withholding_tax",
    "description": "Pemotongan biaya antar PT, paling sering di PO",
    "regulation": null,
    "applicableDocuments": ["po"],
    "documentUrl": null,
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

- Returns an array of TaxType objects.
- Empty array `[]` if no tax types.

---

## 2. Get Tax Type by ID

**Request**

```
GET /api/tax-types/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Tax type ID (e.g. `TAX-001`) |

**Response:** `200 OK`

```json
{
  "id": "TAX-001",
  "code": "PPN_11",
  "name": "PPN 11%",
  "rate": 11,
  "category": "output_tax",
  "description": "Paling sering muncul di Invoice ke klien",
  "regulation": null,
  "applicableDocuments": ["invoice"],
  "documentUrl": null,
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Tax type not found |

---

## 3. Create Tax Type

**Request**

```
POST /api/tax-types
Content-Type: application/json
```

**Request Body:** All fields except `id`, `createdAt`, `updatedAt` (server-generated)

```json
{
  "code": "PPN_11",
  "name": "PPN 11%",
  "rate": 11,
  "category": "output_tax",
  "description": "Paling sering muncul di Invoice ke klien",
  "regulation": null,
  "applicableDocuments": ["invoice"],
  "documentUrl": null,
  "isActive": true
}
```

**Response:** `201 Created`

```json
{
  "id": "TAX-001",
  "code": "PPN_11",
  "name": "PPN 11%",
  "rate": 11,
  "category": "output_tax",
  "description": "Paling sering muncul di Invoice ke klien",
  "regulation": null,
  "applicableDocuments": ["invoice"],
  "documentUrl": null,
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error (invalid field values) |
| 409 | Code already exists |

---

## 4. Update Tax Type

**Request**

```
PUT /api/tax-types/:id
Content-Type: application/json
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Tax type ID |

**Request Body:** Partial update (any subset of fields)

```json
{
  "name": "PPN 11% (Updated)",
  "rate": 11,
  "isActive": true
}
```

**Response:** `200 OK`

```json
{
  "id": "TAX-001",
  "code": "PPN_11",
  "name": "PPN 11% (Updated)",
  "rate": 11,
  "category": "output_tax",
  "description": "Paling sering muncul di Invoice ke klien",
  "regulation": null,
  "applicableDocuments": ["invoice"],
  "documentUrl": null,
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T12:30:00.000Z"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Tax type not found |
| 400 | Validation error |

---

## 5. Delete Tax Type

**Request**

```
DELETE /api/tax-types/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Tax type ID |

**Response:** `200 OK` or `204 No Content`

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Tax type not found |

---

## 6. Get Tax Type PDF

**Request**

```
GET /api/tax-types/:id/pdf
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Tax type ID |

**Response:** `200 OK`

- Returns the PDF document (application/pdf) for the tax type's regulation or certificate.
- If no document is configured (`documentUrl` is null/empty), backend may return:
  - 404 Not Found, or
  - A placeholder/empty PDF, or
  - 204 No Content

The frontend displays this in an iframe via the URL: `${API_BASE_URL}/tax-types/:id/pdf`

---

## Entity Schema (TaxType)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes (response) | Unique identifier (server-generated) |
| code | string | Yes | Code (e.g. PPN_11, PPH_23_2) |
| name | string | Yes | Display name (e.g. "PPN 11%") |
| rate | number | Yes | Tax rate percentage (11, 2, 2.5; 0 for variable) |
| category | TaxCategory | Yes | "output_tax" or "withholding_tax" |
| description | string | Yes | Description |
| regulation | string | No | Regulation reference (e.g. "PPh Pasal 4 Ayat 2") |
| applicableDocuments | string[] | Yes | Document types: ["invoice", "po", "bast"] |
| documentUrl | string | No | URL to regulation/certificate PDF |
| isActive | boolean | Yes | Whether the tax type is active |
| createdAt | string | No | ISO 8601 datetime |
| updatedAt | string | No | ISO 8601 datetime |

### TaxCategory Enum

| Value | Display |
|-------|---------|
| output_tax | Output Tax (charged to clients) |
| withholding_tax | Withholding Tax (withheld by others) |

### ApplicableDocument Enum

| Value | Display |
|-------|---------|
| invoice | Invoice |
| po | Purchase Order |
| bast | BAST |

---

## Error Response Format

Same as Employee module – see Error Response Format section above.

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [{ "field": "code", "message": "Code already exists" }]
}
```

---

## Summary Checklist for Backend

- [ ] `GET /api/tax-types` returns array of TaxType
- [ ] `GET /api/tax-types/:id` returns single TaxType or 404
- [ ] `POST /api/tax-types` accepts body without `id`, returns created TaxType with `id`, `createdAt`, `updatedAt`
- [ ] `PUT /api/tax-types/:id` accepts partial body, returns updated TaxType
- [ ] `DELETE /api/tax-types/:id` returns 200/204 on success, 404 if not found
- [ ] `GET /api/tax-types/:id/pdf` returns PDF content or 404 when no document
- [ ] All JSON responses use `Content-Type: application/json`
- [ ] Error responses include `message` (and optionally `code`, `errors`)

---

# API Mapping Documentation – Proposal Penawaran (Proposal Offer) Module

This document describes the API contract the frontend expects for the Proposal Penawaran (Proposal Offer) module. Backend teams should implement endpoints that match this specification.

---

## Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `VITE_API_BASE_URL` (default: `/api`) |
| Content-Type | `application/json` |
| Accept | `application/json` |

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/proposal-penawaran` | List all proposals (supports ?search=&status=&clientId=) |
| GET | `/api/proposal-penawaran/:id` | Get proposal by ID |
| POST | `/api/proposal-penawaran` | Create proposal |
| PUT | `/api/proposal-penawaran/:id` | Update proposal |
| DELETE | `/api/proposal-penawaran/:id` | Delete proposal |
| GET | `/api/proposal-penawaran/:id/pdf` | Get PDF document for iframe view/export |

---

## 1. List Proposals

**Request**

```
GET /api/proposal-penawaran
GET /api/proposal-penawaran?search=redis&status=draft&clientId=C001
```

**Query Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| search | string | No | Search in jobOffer, proposalNumber, clientName |
| status | string | No | Filter by status: draft, sent, accepted, rejected |
| clientId | string | No | Filter by client ID |

**Response:** `200 OK`

```json
[
  {
    "id": "PP-001",
    "coverInfo": {
      "jobOffer": "INSTALASI & KONFIGURASI REDIS ENTERPRISE",
      "companyName": "PT. Mega Inti Teknologi",
      "proposalMonth": "Januari 2025",
      "address": "Jl. Sudirman No. 123",
      "phone": "+62 21 1234567",
      "email": "info@megainti.co.id"
    },
    "proposalNumber": "PP/MIT/0125/0002",
    "clientInfo": {
      "clientName": "Bapenda Jakarta",
      "contactPerson": "Bapak Pimpinan"
    },
    "items": [
      {
        "number": 1,
        "description": "Installation & Configuration REDIS",
        "quantity": 1,
        "volume": "Packages",
        "unitPrice": 1200000000,
        "totalPrice": 1200000000
      }
    ],
    "totalEstimatedCost": 1200000000,
    "totalEstimatedCostInWords": "Satu Milyar Dua Ratus Juta Rupiah",
    "currency": "IDR",
    "scopeOfWork": ["Preliminary Onsite Work Assessment"],
    "termsAndConditions": ["Harga Dalam Rupiah (Belum Termasuk PPN)"],
    "documentApproval": {
      "place": "Jakarta",
      "date": "2025-01-10",
      "signerName": "Eko Budianto",
      "signerPosition": "Direktur"
    },
    "status": "draft",
    "createdAt": "2025-01-10T10:00:00Z",
    "updatedAt": "2025-01-10T10:00:00Z"
  }
]
```

---

## 2. Get Proposal by ID

**Request**

```
GET /api/proposal-penawaran/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Proposal ID |

**Response:** `200 OK`

Full ProposalPenawaran object (see Entity Schema below).

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Proposal not found |

---

## 3. Create Proposal

**Request**

```
POST /api/proposal-penawaran
Content-Type: application/json
```

**Request Body:** All fields except `id`, `createdAt`, `updatedAt` (server-generated)

See Entity Schema for full structure. Example minimal payload:

```json
{
  "coverInfo": {
    "jobOffer": "INSTALASI REDIS",
    "companyName": "PT. Mega Inti Teknologi",
    "proposalMonth": "Januari 2025",
    "address": "Jl. Sudirman No. 123",
    "phone": "+62 21 1234567"
  },
  "proposalNumber": "PP/MIT/0125/0002",
  "clientInfo": {
    "clientName": "Bapenda Jakarta"
  },
  "items": [
    {
      "number": 1,
      "description": "Installation",
      "quantity": 1,
      "volume": "Packages",
      "unitPrice": 1200000000,
      "totalPrice": 1200000000
    }
  ],
  "totalEstimatedCost": 1200000000,
  "totalEstimatedCostInWords": "Satu Milyar Dua Ratus Juta Rupiah",
  "currency": "IDR",
  "scopeOfWork": [],
  "termsAndConditions": [],
  "documentApproval": {
    "place": "Jakarta",
    "date": "2025-01-10",
    "signerName": "Eko Budianto",
    "signerPosition": "Direktur"
  },
  "status": "draft"
}
```

**Response:** `201 Created`

Returns the created ProposalPenawaran with `id`, `createdAt`, `updatedAt`.

---

## 4. Update Proposal

**Request**

```
PUT /api/proposal-penawaran/:id
Content-Type: application/json
```

**Request Body:** Partial update (any subset of fields)

**Response:** `200 OK`

Returns the updated ProposalPenawaran.

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Proposal not found |

---

## 5. Delete Proposal

**Request**

```
DELETE /api/proposal-penawaran/:id
```

**Response:** `200 OK` or `204 No Content`

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Proposal not found |

---

## 6. Get Proposal PDF

**Request**

```
GET /api/proposal-penawaran/:id/pdf
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Proposal ID |

**Response:** `200 OK`

- Returns the PDF document (application/pdf) for the proposal.
- The frontend displays this in an iframe via the URL: `${API_BASE_URL}/proposal-penawaran/:id/pdf`
- Backend generates PDF from proposal data.

---

## Entity Schema

### ProposalPenawaran

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes (response) | Unique identifier (server-generated) |
| coverInfo | CoverInfo | Yes | Cover section |
| proposalNumber | string | Yes | Nomor proposal (e.g. PP/MIT/0125/0002) |
| clientInfo | ClientInfo | Yes | Target client |
| clientBackground | string | No | Latar belakang kebutuhan klien |
| offeredSolution | string | No | Solusi yang ditawarkan |
| workingMethod | string | No | Metode kerja |
| timeline | string | No | Timeline |
| portfolio | string | No | Portofolio |
| items | ProposalItem[] | Yes | Detail penawaran pekerjaan/jasa |
| totalEstimatedCost | number | Yes | Total harga |
| totalEstimatedCostInWords | string | Yes | Harga dalam kata |
| currency | string | Yes | IDR |
| scopeOfWork | string[] | Yes | Lingkup Pekerjaan |
| termsAndConditions | string[] | Yes | Syarat dan Kondisi |
| notes | string | No | Catatan |
| documentApproval | DocumentApproval | Yes | Pengesahan dokumen |
| status | ProposalStatus | Yes | draft, sent, accepted, rejected |
| createdAt | string | No | ISO 8601 datetime |
| updatedAt | string | No | ISO 8601 datetime |

### CoverInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| jobOffer | string | Yes | Penawaran pekerjaan/jasa |
| companyName | string | Yes | Nama Perusahaan |
| proposalMonth | string | Yes | Bulan proposal |
| address | string | Yes | Alamat |
| phone | string | Yes | No. telepon |
| email | string | No | Email |
| logoUrl | string | No | Logo URL |

### ClientInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clientId | string | No | FK to clients table |
| clientName | string | Yes | Nama client |
| contactPerson | string | No | Contact person |
| email | string | No | Email |
| phone | string | No | Telepon |
| address | string | No | Alamat |

### ProposalItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| number | number | Yes | Nomor urut |
| description | string | Yes | Deskripsi |
| quantity | number | Yes | Quantity |
| volume | string | Yes | Volume (e.g. Packages, Unit) |
| unitPrice | number | Yes | Harga per unit |
| totalPrice | number | Yes | quantity * unitPrice |

### DocumentApproval

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| place | string | Yes | Tempat dokumen dibuat |
| date | string | Yes | Tanggal (YYYY-MM-DD) |
| signerName | string | Yes | Nama penandatangan |
| signerPosition | string | Yes | Jabatan (e.g. Direktur) |
| signatureUrl | string | No | URL TTD/signature image |

### ProposalStatus Enum

| Value | Display |
|-------|---------|
| draft | Draft |
| sent | Sent |
| accepted | Accepted |
| rejected | Rejected |

---

## Error Response Format

Same as Employee module – see Error Response Format section above.

---

## Summary Checklist for Backend

- [ ] `GET /api/proposal-penawaran` returns array of ProposalPenawaran (supports search, status, clientId filters)
- [ ] `GET /api/proposal-penawaran/:id` returns single ProposalPenawaran or 404
- [ ] `POST /api/proposal-penawaran` accepts body without `id`, returns created ProposalPenawaran with `id`, `createdAt`, `updatedAt`
- [ ] `PUT /api/proposal-penawaran/:id` accepts partial body, returns updated ProposalPenawaran
- [ ] `DELETE /api/proposal-penawaran/:id` returns 200/204 on success, 404 if not found
- [ ] `GET /api/proposal-penawaran/:id/pdf` returns PDF content (application/pdf) for iframe display
- [ ] All JSON responses use `Content-Type: application/json`
- [ ] Error responses include `message` (and optionally `code`, `errors`)

---

# API Mapping Documentation – Dashboard Module

This document describes the API contract the frontend expects for the Dashboard module. The dashboard aggregates data from multiple modules to provide an overview of ERP performance.

---

## Current Implementation

The dashboard **aggregates data from existing module APIs** in parallel on the frontend:

- `GET /api/projects`
- `GET /api/invoices`
- `GET /api/purchase-orders`
- `GET /api/proposal-penawaran`
- `GET /api/basts`
- `GET /api/employees`
- `GET /api/tax-types`

The frontend uses `Promise.all` to fetch these in parallel and computes metrics, recent activities, and active projects client-side.

---

## Preferred Approach: Consolidated Dashboard Endpoint

For better performance and a single round-trip, the backend may implement a consolidated endpoint. This is **optional** but recommended for production.

---

## Endpoint Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard summary (metrics, activities, active projects, revenue trend) |

---

## 1. Get Dashboard Summary

**Request**

```
GET /api/dashboard
```

**Response:** `200 OK`

```json
{
  "metrics": {
    "projects": {
      "total": 12,
      "onProgress": 8,
      "completed": 4,
      "cancelled": 0
    },
    "invoices": {
      "count": 24,
      "totalRevenue": 1500000000
    },
    "purchaseOrders": {
      "count": 18
    },
    "proposals": {
      "total": 10,
      "draft": 3,
      "sent": 5,
      "accepted": 2,
      "rejected": 0
    },
    "basts": {
      "count": 15
    },
    "employees": {
      "count": 84
    },
    "taxTypes": {
      "count": 4
    }
  },
  "recentActivities": [
    {
      "id": "inv-INV-001",
      "type": "Invoice Created",
      "details": "INV-2025-001 for PT Bank Mandiri",
      "timestamp": "2025-02-12T10:00:00.000Z",
      "entityType": "invoice"
    },
    {
      "id": "po-PO-001",
      "type": "PO Added",
      "details": "PO-2025-001 - PT Supplier Teknologi",
      "timestamp": "2025-02-11T14:30:00.000Z",
      "entityType": "purchase_order"
    }
  ],
  "activeProjects": [
    {
      "id": "PRJ-001",
      "identity": {
        "projectId": "PRJ-001",
        "namaProject": "ERP Implementation",
        "clientId": "C001",
        "clientName": "PT Bank Mandiri",
        "scopeProject": "Full ERP",
        "startDate": "2025-01-15",
        "endDate": "2025-06-30",
        "projectManagerName": "John Doe",
        "status": "on_progress"
      },
      "finance": {
        "income": 500000000,
        "expense": 200000000,
        "profitLoss": 300000000
      }
    }
  ],
  "revenueByProject": [
    {
      "projectId": "PRJ-001",
      "projectName": "ERP Implementation",
      "income": 500000000
    }
  ]
}
```

---

## Entity Schema

### DashboardMetrics

| Field | Type | Description |
|-------|------|-------------|
| projects | ProjectMetrics | Project counts by status |
| invoices | InvoiceMetrics | Invoice count and total revenue |
| purchaseOrders | PurchaseOrderMetrics | PO count |
| proposals | ProposalMetrics | Proposal counts by status |
| basts | BastMetrics | BAST count |
| employees | EmployeeMetrics | Employee count |
| taxTypes | TaxTypeMetrics | Tax type count |

### ProjectMetrics

| Field | Type | Description |
|-------|------|-------------|
| total | number | Total projects |
| onProgress | number | Projects with status on_progress |
| completed | number | Projects with status completed |
| cancelled | number | Projects with status cancelled |

### InvoiceMetrics

| Field | Type | Description |
|-------|------|-------------|
| count | number | Total invoice count |
| totalRevenue | number | Sum of invoice totals (priceAfterTax or subtotal) |

### ProposalMetrics

| Field | Type | Description |
|-------|------|-------------|
| total | number | Total proposals |
| draft | number | Draft proposals |
| sent | number | Sent proposals |
| accepted | number | Accepted proposals |
| rejected | number | Rejected proposals |

### DashboardActivity

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique activity ID |
| type | string | Display label (e.g. "Invoice Created", "PO Added") |
| details | string | Activity description |
| timestamp | string | ISO 8601 datetime |
| entityType | string | "invoice", "purchase_order", "proposal", "bast", "project" |

### RevenueByProject

| Field | Type | Description |
|-------|------|-------------|
| projectId | string | Project ID |
| projectName | string | Project name |
| income | number | Project finance.income |

---

## Error Response Format

Same as Employee module – see Error Response Format section above.

---

## Summary Checklist for Backend

- [ ] `GET /api/dashboard` returns DashboardSummary with metrics, recentActivities, activeProjects, revenueByProject
- [ ] metrics.projects includes total, onProgress, completed, cancelled
- [ ] metrics.invoices includes count and totalRevenue (sum of invoice line item totals)
- [ ] recentActivities sorted by timestamp descending, top 15
- [ ] activeProjects filtered by identity.status === "on_progress"
- [ ] revenueByProject from projects with finance.income > 0, sorted by income descending
- [ ] All JSON responses use `Content-Type: application/json`

---

# API Mapping Documentation – Inventory / Asset Management Module

This document describes the API contract the frontend expects for the Inventory (Asset Management) module. Backend teams should implement endpoints that match this specification.

---

## Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `VITE_API_BASE_URL` (default: `/api`) |
| Content-Type | `application/json` |
| Accept | `application/json` |

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List all inventory items |
| GET | `/api/inventory/:id` | Get item by ID |
| POST | `/api/inventory` | Create item |
| PUT | `/api/inventory/:id` | Update item |
| DELETE | `/api/inventory/:id` | Delete item |

---

## 1. List Inventory Items

**Request**

```
GET /api/inventory
```

**Response:** `200 OK`

```json
[
  {
    "id": "INV-001",
    "code": "ASSET-1021",
    "name": "MacBook Pro 14\" M3 Max",
    "quantity": 12,
    "price": 2499,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  },
  {
    "id": "INV-002",
    "code": "ASSET-4052",
    "name": "Dell PowerEdge R760",
    "quantity": 2,
    "price": 8500,
    "createdAt": "2025-01-16T10:00:00.000Z",
    "updatedAt": "2025-01-16T10:00:00.000Z"
  }
]
```

- Returns an array of InventoryItem objects.
- Empty array `[]` if no items.

---

## 2. Get Inventory Item by ID

**Request**

```
GET /api/inventory/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID (e.g. INV-001) |

**Response:** `200 OK`

```json
{
  "id": "INV-001",
  "code": "ASSET-1021",
  "name": "MacBook Pro 14\" M3 Max",
  "quantity": 12,
  "price": 2499,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Item not found |

---

## 3. Create Inventory Item

**Request**

```
POST /api/inventory
Content-Type: application/json
```

**Request Body:** All fields except `id`, `createdAt`, `updatedAt` (server-generated)

```json
{
  "code": "ASSET-1021",
  "name": "MacBook Pro 14\" M3 Max",
  "quantity": 12,
  "price": 2499
}
```

**Response:** `201 Created`

```json
{
  "id": "INV-001",
  "code": "ASSET-1021",
  "name": "MacBook Pro 14\" M3 Max",
  "quantity": 12,
  "price": 2499,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Validation error (invalid field values) |
| 409 | Code already exists (if code is unique) |

---

## 4. Update Inventory Item

**Request**

```
PUT /api/inventory/:id
Content-Type: application/json
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID |

**Request Body:** Partial update (any subset of fields)

```json
{
  "quantity": 15,
  "price": 2399
}
```

**Response:** `200 OK`

```json
{
  "id": "INV-001",
  "code": "ASSET-1021",
  "name": "MacBook Pro 14\" M3 Max",
  "quantity": 15,
  "price": 2399,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-02-12T14:30:00.000Z"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Item not found |
| 400 | Validation error |

---

## 5. Delete Inventory Item

**Request**

```
DELETE /api/inventory/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID |

**Response:** `200 OK` or `204 No Content`

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Item not found |

---

## Entity Schema (InventoryItem)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes (response) | Unique identifier (server-generated) |
| code | string | Yes | Asset code (e.g. ASSET-1021) |
| name | string | Yes | Asset name |
| quantity | number | Yes | Stock quantity (>= 0) |
| price | number | Yes | Unit price (>= 0) |
| createdAt | string | No | ISO 8601 datetime |
| updatedAt | string | No | ISO 8601 datetime |

---

## Error Response Format

Same as Employee module – see Error Response Format section above.

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [{ "field": "code", "message": "Code already exists" }]
}
```

---

## Summary Checklist for Backend

- [ ] `GET /api/inventory` returns array of InventoryItem
- [ ] `GET /api/inventory/:id` returns single InventoryItem or 404
- [ ] `POST /api/inventory` accepts body without `id`, returns created InventoryItem with `id`, `createdAt`, `updatedAt`
- [ ] `PUT /api/inventory/:id` accepts partial body, returns updated InventoryItem
- [ ] `DELETE /api/inventory/:id` returns 200/204 on success, 404 if not found
- [ ] All JSON responses use `Content-Type: application/json`
- [ ] Error responses include `message` (and optionally `code`, `errors`)

---

# API Mapping Documentation – Roles (Access Control)

This section describes the API contract for the Master Role module used in RBAC.

---

## Endpoints Overview (Roles)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roles` | List all roles |
| GET | `/api/roles/:id` | Get role by ID |
| POST | `/api/roles` | Create role |
| PUT | `/api/roles/:id` | Update role |
| DELETE | `/api/roles/:id` | Delete role |

---

## 1. List Roles

**Request**

```
GET /api/roles
```

**Response:** `200 OK`

```json
[
  {
    "id": "role-admin",
    "code": "ADMIN",
    "name": "Administrator",
    "description": "Full access to all modules",
    "permissionKeys": ["dashboard", "finance", "finance.accounting", "finance.invoice", "access_control", "access_control.roles", "access_control.users"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

- Returns an array of Role objects.
- `permissionKeys` is a list of menu permission keys (e.g. `dashboard`, `finance.invoice`, `access_control.roles`).

---

## 2. Get Role by ID

**Request**

```
GET /api/roles/:id
```

**Path Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Role ID |

**Response:** `200 OK`

```json
{
  "id": "role-admin",
  "code": "ADMIN",
  "name": "Administrator",
  "description": "Full access to all modules",
  "permissionKeys": ["dashboard", "finance", "finance.invoice", "access_control.roles", "access_control.users"],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Role not found |

---

## 3. Create Role

**Request**

```
POST /api/roles
Content-Type: application/json
```

**Request Body**

```json
{
  "code": "FINANCE_USER",
  "name": "Finance User",
  "description": "Access to finance modules",
  "permissionKeys": ["dashboard", "finance", "finance.invoice", "finance.payment"],
  "isActive": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | Role code (e.g. ADMIN, FINANCE_USER) |
| name | string | Yes | Display name |
| description | string | No | Description |
| permissionKeys | string[] | Yes | List of menu permission keys |
| isActive | boolean | Yes | Active flag |

**Response:** `201 Created`

```json
{
  "id": "role-1234567890-abc12",
  "code": "FINANCE_USER",
  "name": "Finance User",
  "description": "Access to finance modules",
  "permissionKeys": ["dashboard", "finance", "finance.invoice", "finance.payment"],
  "isActive": true,
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

---

## 4. Update Role

**Request**

```
PUT /api/roles/:id
Content-Type: application/json
```

**Request Body:** Same shape as create (all fields optional for partial update).

**Response:** `200 OK` – returns updated Role object.

---

## 5. Delete Role

**Request**

```
DELETE /api/roles/:id
```

**Response:** `200 OK` or `204 No Content`

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Role not found |

---

## Entity Schema (Role)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes (response) | Unique identifier (server-generated) |
| code | string | Yes | Role code |
| name | string | Yes | Display name |
| description | string | No | Description |
| permissionKeys | string[] | Yes | Menu permission keys for RBAC |
| isActive | boolean | Yes | Active flag |
| createdAt | string | No | ISO 8601 datetime |
| updatedAt | string | No | ISO 8601 datetime |

---

# API Mapping Documentation – Users (Access Control)

This section describes the API contract for the Master User module. **Password must never be returned in any response.**

---

## Endpoints Overview (Users)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/auth/me` | Get current user (with role and permissions) |

---

## 1. List Users

**Request**

```
GET /api/users
```

**Response:** `200 OK`

```json
[
  {
    "id": "user-admin-1",
    "username": "admin",
    "email": "admin@example.com",
    "fullName": "Administrator",
    "roleId": "role-admin",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

- Returns an array of User objects.
- **No `password` or `passwordHash` in response.**

---

## 2. Get User by ID

**Request**

```
GET /api/users/:id
```

**Response:** `200 OK`

```json
{
  "id": "user-admin-1",
  "username": "admin",
  "email": "admin@example.com",
  "fullName": "Administrator",
  "roleId": "role-admin",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

- **No `password` or `passwordHash` in response.**

---

## 3. Get Current User (Auth)

**Request**

```
GET /api/auth/me
```

- Typically sent with session cookie or `Authorization: Bearer <token>`.

**Response:** `200 OK`

```json
{
  "id": "user-admin-1",
  "username": "admin",
  "email": "admin@example.com",
  "fullName": "Administrator",
  "roleId": "role-admin",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "role": {
    "id": "role-admin",
    "code": "ADMIN",
    "name": "Administrator",
    "permissionKeys": ["dashboard", "finance", "finance.invoice", "access_control.roles", "access_control.users"]
  }
}
```

- Same User fields as above, plus embedded `role` with `id`, `code`, `name`, and `permissionKeys`.
- Frontend uses `role.permissionKeys` for RBAC menu filtering.
- **No `password` or `passwordHash` in response.**

**Error Responses**

| Status | Description |
|--------|-------------|
| 401 | Unauthorized (not logged in) |

---

## 4. Create User

**Request**

```
POST /api/users
Content-Type: application/json
```

**Request Body**

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Login username |
| email | string | Yes | Email |
| fullName | string | Yes | Display name |
| roleId | string | Yes | FK to Role |
| password | string | No | Plain password (create only); backend hashes and never returns it |
| isActive | boolean | Yes | Active flag |

**Response:** `201 Created`

```json
{
  "id": "user-1234567890-abc12",
  "username": "finance_user",
  "email": "finance@example.com",
  "fullName": "Finance User",
  "roleId": "role-finance",
  "isActive": true,
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

- **No `password` or `passwordHash` in response.**

---

## 5. Update User

**Request**

```
PUT /api/users/:id
Content-Type: application/json
```

**Request Body:** Same as create; all fields optional for partial update. Include `password` only when changing password.

**Response:** `200 OK` – returns updated User object (no password).

---

## 6. Delete User

**Request**

```
DELETE /api/users/:id
```

**Response:** `200 OK` or `204 No Content`

---

## Entity Schema (User)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes (response) | Unique identifier (server-generated) |
| username | string | Yes | Login username |
| email | string | Yes | Email |
| fullName | string | Yes | Display name |
| roleId | string | Yes | FK to Role |
| isActive | boolean | Yes | Active flag |
| createdAt | string | No | ISO 8601 datetime |
| updatedAt | string | No | ISO 8601 datetime |

- **Never include `password` or `passwordHash` in any API response.**

---

## Summary Checklist for Backend (Roles)

- [ ] `GET /api/roles` returns array of Role with `permissionKeys`
- [ ] `GET /api/roles/:id` returns single Role or 404
- [ ] `POST /api/roles` accepts body without `id`, returns created Role with `id`, `createdAt`, `updatedAt`
- [ ] `PUT /api/roles/:id` accepts partial body, returns updated Role
- [ ] `DELETE /api/roles/:id` returns 200/204 on success, 404 if not found

---

## Summary Checklist for Backend (Users & Auth)

- [ ] `GET /api/users` returns array of User; **no password in response**
- [ ] `GET /api/users/:id` returns single User or 404; **no password in response**
- [ ] `GET /api/auth/me` returns current user with embedded `role` (id, code, name, permissionKeys); **no password in response**
- [ ] `POST /api/users` accepts username, email, fullName, roleId, optional password, isActive; returns created User without password
- [ ] `PUT /api/users/:id` accepts partial body (optional password for change); returns updated User without password
- [ ] `DELETE /api/users/:id` returns 200/204 on success, 404 if not found
