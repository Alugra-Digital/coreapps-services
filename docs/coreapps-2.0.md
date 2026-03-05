# CoreApps ERP – Production-Class Flow Specification
**Version:** 2.0  
**Owner:** PT. Alugra Digital Indonesia  
**Last Updated:** February 2026  
**Status:** Production Design Reference

---

## Table of Contents

1. [Business Flow Overview](#1-business-flow-overview)
2. [Project Module – Production Design](#2-project-module--production-design)
3. [Project Status Lifecycle](#3-project-status-lifecycle)
4. [PIC & Sales Attribution](#4-pic--sales-attribution)
5. [Financial Structure per Project](#5-financial-structure-per-project)
6. [Termin (Payment Schedule)](#6-termin-payment-schedule)
7. [Expense Management per Project](#7-expense-management-per-project)
8. [Document Flow & Linking](#8-document-flow--linking)
9. [Proposal Penawaran – Production Design](#9-proposal-penawaran--production-design)
10. [Purchase Order dari Client](#10-purchase-order-dari-client)
11. [Invoice – Termin Based](#11-invoice--termin-based)
12. [BAST – Production Design](#12-bast--production-design)
13. [Quotation – Redefine sebagai Vendor Quotation](#13-quotation--redefine-sebagai-vendor-quotation)
14. [Sales Analytics – Multi-Role](#14-sales-analytics--multi-role)
15. [Notification & Reminder System](#15-notification--reminder-system)
16. [RBAC – Updated Permission Keys](#16-rbac--updated-permission-keys)
17. [API Structure – Updated](#17-api-structure--updated)
18. [Frontend Routes – Updated](#18-frontend-routes--updated)
19. [Data Schema – Full Reference](#19-data-schema--full-reference)
20. [Business Rules & Validations](#20-business-rules--validations)

---

## 1. Business Flow Overview

### 1.1 Flow Utama (Anda sebagai Seller)

```
[PIPELINE]
  └─ Buat Proposal Penawaran → kirim ke Client
        │
        ▼
[NEGOTIATION]
  └─ Revisi Proposal (versioning v1, v2, dst)
        │
        ├── Client menolak → [LOST]
        │
        ▼
[WON]
  └─ Client kirim PO → attach PO Client ke Project
        │
        ▼
[ON_PROGRESS]
  └─ Project berjalan
  └─ Expenses dicatat per kategori
  └─ Invoice diterbitkan per termin
  └─ Margin dihitung otomatis
        │
        ├── Dibatalkan → [CANCELLED]
        ├── Ditunda → [ON_HOLD]
        │
        ▼
[READY_TO_CLOSE]
  └─ Semua termin selesai, BAST siap ditandatangani
        │
        ▼
[COMPLETED]
  └─ BAST ditandatangani
  └─ Semua invoice lunas
  └─ Project ditutup
```

### 1.2 Flow Anda sebagai Buyer (dari Vendor)

```
Vendor kirim Quotation → Anda simpan sebagai Vendor Quotation
  └─ Anda terbitkan PO ke Vendor → expense masuk ke project
```

### 1.3 Perbedaan PO Client vs PO Vendor

| Jenis | Arah | Fungsi | Di Sistem |
|---|---|---|---|
| **PO dari Client** | Client → Kita | Bukti client setuju, dasar nilai kontrak | Disimpan di `clientPurchaseOrders` |
| **PO ke Vendor** | Kita → Vendor | Pembelian barang/jasa untuk project | Disimpan di `vendorPurchaseOrders` |

---

## 2. Project Module – Production Design

### 2.1 Full Data Structure

```jsonc
{
  // === IDENTITY ===
  "identity": {
    "projectId": "PRJ-2026-001",
    "namaProject": "Implementasi ERP Phase 1",
    "projectCode": "ADI-2026-001",           // kode internal singkat
    "clientId": "CLT-001",
    "clientName": "PT. Contoh Maju",
    "scopeProject": "Implementasi sistem ERP modul Finance & HR",
    "description": "Deskripsi detail project...",
    "startDate": "2026-03-01",
    "endDate": "2026-08-31",
    "estimatedDuration": 180,                // dalam hari, auto-kalkulasi
    "status": "ON_PROGRESS",
    "priority": "HIGH",                      // LOW | MEDIUM | HIGH | CRITICAL

    // Project Manager (yang mengelola)
    "projectManagerId": "EMP-001",
    "projectManagerName": "Budi Santoso",

    // PIC Pitching (yang mendapatkan / pitching project)
    "picId": "EMP-005",
    "picName": "Rina Wulandari",
    "picPosition": "Project Manager",
    "picDepartment": "Operations",

    // Support Team (opsional, multi-member)
    "teamMembers": [
      {
        "employeeId": "EMP-010",
        "employeeName": "Dedi Kurniawan",
        "role": "Technical Lead",
        "assignedAt": "2026-03-01"
      }
    ],

    "tags": ["ERP", "Finance", "HR"],
    "notes": "Project prioritas Q1 2026"
  },

  // === FINANCE ===
  "finance": {
    // Nilai Kontrak
    "contractValue": 500000000,              // dari PO client (IDR)
    "currency": "IDR",
    "ppnIncluded": true,                     // apakah nilai kontrak sudah include PPN

    // Kalkulasi Otomatis
    "totalInvoiced": 200000000,              // auto: sum dari invoice yang diterbitkan
    "totalPaid": 150000000,                  // auto: sum dari payment yang masuk
    "outstandingAmount": 50000000,           // auto: totalInvoiced - totalPaid
    "totalExpense": 180000000,               // auto: sum dari semua expense
    "grossProfit": 320000000,                // auto: contractValue - totalExpense
    "marginPercent": 64.0,                   // auto: (grossProfit / contractValue) * 100
    "remainingToBill": 300000000,            // auto: contractValue - totalInvoiced

    // Status Finansial
    "financialStatus": "ON_TRACK",          // ON_TRACK | AT_RISK | OVER_BUDGET | COMPLETED
    "budgetAlert": false,                    // true jika expense > 80% contractValue
    "budgetAlertThreshold": 80              // persen, configurable
  },

  // === DOCUMENT RELATIONS ===
  "documentRelations": {
    // Dokumen dari kita ke client
    "proposalIds": ["PROP-2026-001", "PROP-2026-001-v2"],
    "invoiceIds": ["INV-2026-001", "INV-2026-002"],
    "bastIds": ["BAST-2026-001"],

    // Dokumen dari/ke external
    "clientPurchaseOrderIds": ["CPO-2026-001"],  // PO dari client
    "vendorQuotationIds": ["VQ-2026-001"],        // Quotation dari vendor
    "vendorPurchaseOrderIds": ["VPO-2026-001"]    // PO kita ke vendor
  },

  // === TERMIN ===
  "termin": [
    {
      "terminId": "TERM-001",
      "terminNumber": 1,
      "description": "Termin 1 – Kickoff & Design",
      "percentage": 30,
      "amount": 150000000,                   // auto: contractValue * percentage / 100
      "dueDate": "2026-04-01",
      "status": "INVOICED",                  // SCHEDULED | INVOICED | PAID | OVERDUE
      "invoiceId": "INV-2026-001",
      "paidAt": null,
      "notes": ""
    },
    {
      "terminId": "TERM-002",
      "terminNumber": 2,
      "description": "Termin 2 – Development 50%",
      "percentage": 40,
      "amount": 200000000,
      "dueDate": "2026-06-01",
      "status": "SCHEDULED",
      "invoiceId": null,
      "paidAt": null,
      "notes": ""
    },
    {
      "terminId": "TERM-003",
      "terminNumber": 3,
      "description": "Termin 3 – Final & BAST",
      "percentage": 30,
      "amount": 150000000,
      "dueDate": "2026-08-31",
      "status": "SCHEDULED",
      "invoiceId": null,
      "paidAt": null,
      "notes": ""
    }
  ],

  // === EXPENSES ===
  "expenses": [
    {
      "expenseId": "EXP-001",
      "category": "SUBKONTRAKTOR",
      "description": "Jasa implementasi modul Finance",
      "vendorId": "VND-001",
      "vendorName": "PT. Tech Partner",
      "amount": 80000000,
      "date": "2026-03-15",
      "vendorPurchaseOrderId": "VPO-2026-001",
      "invoiceVendorNumber": "INV/VND/2026/001",
      "status": "PAID",                      // PENDING | PAID | CANCELLED
      "attachmentUrl": "https://...",
      "createdBy": "EMP-001",
      "approvedBy": "EMP-002",
      "notes": ""
    }
  ],

  // === MILESTONES ===
  "milestones": [
    {
      "milestoneId": "MS-001",
      "title": "Kickoff Meeting",
      "targetDate": "2026-03-05",
      "completedDate": "2026-03-05",
      "status": "COMPLETED",                 // PENDING | IN_PROGRESS | COMPLETED | DELAYED
      "linkedTerminId": "TERM-001",
      "notes": ""
    }
  ],

  // === DOCUMENTS (File Uploads) ===
  "documents": [
    {
      "documentId": "DOC-001",
      "name": "Kontrak Project ADI-2026-001.pdf",
      "type": "CONTRACT",                    // CONTRACT | PO_CLIENT | NDA | TECHNICAL | OTHER
      "url": "https://minio.alugra.co.id/...",
      "uploadedAt": "2026-03-01T09:00:00Z",
      "uploadedBy": "EMP-001",
      "size": 1024000
    }
  ],

  // === AUDIT ===
  "audit": {
    "createdAt": "2026-02-15T10:00:00Z",
    "createdBy": "EMP-001",
    "updatedAt": "2026-03-20T14:30:00Z",
    "updatedBy": "EMP-002",
    "statusHistory": [
      {
        "fromStatus": "PIPELINE",
        "toStatus": "NEGOTIATION",
        "changedAt": "2026-02-20T09:00:00Z",
        "changedBy": "EMP-001",
        "notes": "Client tertarik, masuk negosiasi"
      },
      {
        "fromStatus": "NEGOTIATION",
        "toStatus": "WON",
        "changedAt": "2026-02-28T15:00:00Z",
        "changedBy": "EMP-001",
        "notes": "PO client diterima"
      }
    ]
  }
}
```

---

## 3. Project Status Lifecycle

### 3.1 Status Definitions

| Status | Label UI | Deskripsi | Warna |
|---|---|---|---|
| `PIPELINE` | 🔵 Pipeline | Proposal sudah dikirim, menunggu keputusan client | Blue |
| `NEGOTIATION` | 🟡 Negosiasi | Client tertarik, sedang negosiasi harga/scope | Yellow |
| `WON` | 🟢 Won | Client setuju, PO diterima, siap kick off | Green |
| `LOST` | 🔴 Lost | Client menolak proposal | Red |
| `ON_PROGRESS` | 🟢 On Progress | Project aktif berjalan | Green |
| `ON_HOLD` | 🟠 On Hold | Project ditunda sementara | Orange |
| `READY_TO_CLOSE` | 🔵 Ready to Close | Semua deliverable selesai, menunggu BAST | Blue |
| `COMPLETED` | ⚫ Completed | BAST ditandatangani, project ditutup | Gray |
| `CANCELLED` | 🔴 Cancelled | Project dibatalkan | Red |

### 3.2 Status Transition Rules

```
PIPELINE      → NEGOTIATION    (manual, saat ada response dari client)
PIPELINE      → LOST           (manual, client langsung menolak)
NEGOTIATION   → WON            (wajib: PO client sudah di-attach)
NEGOTIATION   → LOST           (manual, negosiasi gagal)
WON           → ON_PROGRESS    (manual, saat kickoff)
ON_PROGRESS   → ON_HOLD        (manual, dengan alasan wajib diisi)
ON_PROGRESS   → CANCELLED      (manual, perlu approval Finance/Director)
ON_PROGRESS   → READY_TO_CLOSE (manual, semua termin invoiced)
ON_HOLD       → ON_PROGRESS    (manual, project dilanjutkan)
ON_HOLD       → CANCELLED      (manual)
READY_TO_CLOSE → COMPLETED     (auto, saat BAST ditandatangani & semua invoice PAID)
```

### 3.3 Status Transition Validations

| Dari → Ke | Validasi Wajib |
|---|---|
| `NEGOTIATION` → `WON` | Client PO harus sudah di-attach |
| `WON` → `ON_PROGRESS` | `startDate` harus diisi, PM harus assigned |
| `ON_PROGRESS` → `CANCELLED` | Alasan cancellation wajib, notif ke Finance |
| `ON_PROGRESS` → `READY_TO_CLOSE` | Semua milestone selesai |
| `READY_TO_CLOSE` → `COMPLETED` | BAST sudah ditandatangani (status BAST = `SIGNED`) |

---

## 4. PIC & Sales Attribution

### 4.1 Konsep Dua Peran

| Field | Peran | Keterangan |
|---|---|---|
| `picId` / `picName` | **Pitcher** | Yang mendapatkan / pitching project ke client. Bisa siapa saja (Sales, PM, Direktur). |
| `projectManagerId` / `projectManagerName` | **Manager** | Yang mengelola jalannya project. Bisa orang yang sama atau berbeda. |

### 4.2 Aturan PIC

- PIC adalah employee dari tabel `hr.employees`.
- Satu project = satu PIC utama (pitcher).
- PIC tidak harus dari divisi Sales — siapapun yang pitching tercatat.
- Tidak bisa diubah setelah project berstatus `COMPLETED` atau `CANCELLED` (historical integrity).
- Jika PIC pitching = Project Manager, isi keduanya dengan employee yang sama.

### 4.3 Sales Analytics Attribution

- Semua project yang berhasil (`WON`, `ON_PROGRESS`, `COMPLETED`) akan diatribusikan ke `picId`.
- Karyawan non-Sales yang pitching akan muncul di Sales Analytics dengan label posisinya.
- Filter Sales Analytics: `By Employee` | `By Department` | `By Position`.

---

## 5. Financial Structure per Project

### 5.1 Kalkulasi Otomatis (Semua Computed di Backend)

```
contractValue         = Input manual saat PO client diterima (nilai kontrak bersih/kotor)
totalExpense          = SUM(expenses[].amount WHERE status != 'CANCELLED')
grossProfit           = contractValue - totalExpense
marginPercent         = (grossProfit / contractValue) * 100
totalInvoiced         = SUM(invoices[].grandTotal WHERE projectId = this.id)
totalPaid             = SUM(payments[].amount WHERE invoiceId IN invoiceIds[])
outstandingAmount     = totalInvoiced - totalPaid
remainingToBill       = contractValue - totalInvoiced
```

### 5.2 Financial Status Logic

```
financialStatus:
  COMPLETED   → project status = COMPLETED
  OVER_BUDGET → totalExpense >= contractValue
  AT_RISK     → marginPercent < 20% (threshold configurable)
  ON_TRACK    → default
```

### 5.3 Budget Alert

- Alert dikirimkan ke Project Manager & Finance Admin ketika:
  - `totalExpense > contractValue * budgetAlertThreshold / 100` (default 80%)
- Alert ditampilkan sebagai banner merah di halaman project detail.

### 5.4 Display di Project Card

```
┌────────────────────────────────────────────────────┐
│ Implementasi ERP Phase 1                  🟢 ON PROGRESS │
│ PT. Contoh Maju                    PIC: Rina Wulandari │
│                                                    │
│ Nilai Kontrak: Rp 500.000.000                      │
│ Total Expense: Rp 180.000.000      Margin: 64.0%   │
│ Tertagih:      Rp 200.000.000      Sisa: Rp 300jt  │
│ Terbayar:      Rp 150.000.000      Outstanding: 50jt│
│                                                    │
│ Progress Termin: ██████░░░░ 1/3                    │
└────────────────────────────────────────────────────┘
```

---

## 6. Termin (Payment Schedule)

### 6.1 Struktur Termin

- Setiap project bisa punya N jumlah termin.
- Total persentase semua termin **harus = 100%** (validasi saat save).
- Amount per termin dikalkulasi otomatis: `contractValue * percentage / 100`.
- Jika `contractValue` berubah, semua amount termin **di-recalculate otomatis**.

### 6.2 Termin Status

| Status | Deskripsi | Trigger |
|---|---|---|
| `SCHEDULED` | Termin dibuat, belum waktunya | Default saat dibuat |
| `DUE` | Sudah melewati `dueDate`, belum di-invoice | Auto (cron job harian) |
| `INVOICED` | Invoice sudah diterbitkan untuk termin ini | Auto saat invoice dibuat dengan `terminId` |
| `PAID` | Invoice untuk termin ini sudah lunas | Auto saat payment = full invoice amount |
| `OVERDUE` | Invoice sudah diterbitkan tapi belum dibayar lewat due date | Auto (cron job) |

### 6.3 Termin → Invoice Linking

- Saat membuat Invoice, wajib pilih `terminId` dari project.
- Satu termin = maksimal satu invoice.
- Invoice amount = termin amount (bisa dimodifikasi manual dengan catatan).
- Setelah invoice dibuat, termin status otomatis berubah ke `INVOICED`.

### 6.4 Termin Validation Rules

- Tidak bisa delete termin yang sudah `INVOICED` atau `PAID`.
- Tidak bisa ubah amount termin yang sudah `INVOICED` (harus void invoice dulu).
- Warning jika `dueDate` termin lebih dari `project.endDate`.

---

## 7. Expense Management per Project

### 7.1 Expense Categories

| Kategori | Kode | Keterangan |
|---|---|---|
| Subkontraktor | `SUBKONTRAKTOR` | Jasa pihak ketiga/vendor |
| SDM Internal | `SDM_INTERNAL` | Biaya tenaga internal yang dialokasikan |
| Hardware | `HARDWARE` | Pembelian perangkat keras |
| Software & Lisensi | `SOFTWARE_LICENSE` | Lisensi software, subscription |
| Transport & Akomodasi | `TRANSPORT_AKOMODASI` | Perjalanan dinas, hotel |
| Komunikasi | `KOMUNIKASI` | Telpon, internet, meeting tools |
| Operasional | `OPERASIONAL` | ATK, cetak, dll |
| Lain-lain | `OTHER` | Biaya di luar kategori di atas |

### 7.2 Expense Data Structure

```jsonc
{
  "expenseId": "EXP-2026-001",
  "projectId": "PRJ-2026-001",
  "category": "SUBKONTRAKTOR",
  "description": "Jasa implementasi modul Finance",
  "amount": 80000000,
  "currency": "IDR",
  "date": "2026-03-15",

  // Link ke vendor (opsional jika ada vendor)
  "vendorId": "VND-001",
  "vendorName": "PT. Tech Partner",
  "vendorPurchaseOrderId": "VPO-2026-001",
  "invoiceVendorNumber": "INV/VND/2026/001",

  // Status & Approval
  "status": "APPROVED",                     // DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | PAID | CANCELLED
  "submittedBy": "EMP-005",
  "approvedBy": "EMP-002",
  "approvedAt": "2026-03-16T10:00:00Z",
  "rejectedReason": null,

  // Attachment
  "attachments": [
    {
      "name": "Invoice Vendor.pdf",
      "url": "https://minio.alugra.co.id/...",
      "uploadedAt": "2026-03-15T14:00:00Z"
    }
  ],

  "notes": "Pembayaran pertama dari 3 termin",
  "createdAt": "2026-03-15T09:00:00Z",
  "updatedAt": "2026-03-16T10:00:00Z"
}
```

### 7.3 Expense Approval Flow

```
DRAFT → PENDING_APPROVAL (submit oleh PIC/PM)
PENDING_APPROVAL → APPROVED (oleh Finance Admin / Manager)
PENDING_APPROVAL → REJECTED (dengan alasan)
APPROVED → PAID (setelah payment ke vendor dilakukan)
APPROVED | PAID → CANCELLED (dengan alasan, oleh Finance)
```

### 7.4 Expense Summary per Project

```
Total per Kategori:
  SUBKONTRAKTOR         : Rp  80.000.000  (44.4%)
  TRANSPORT_AKOMODASI   : Rp  20.000.000  (11.1%)
  OPERASIONAL           : Rp  10.000.000  ( 5.6%)
  SDM_INTERNAL          : Rp  70.000.000  (38.9%)
─────────────────────────────────────────────────
TOTAL                   : Rp 180.000.000
```

---

## 8. Document Flow & Linking

### 8.1 Complete Document Map

```
PROJECT
 ├── [PROPOSAL PENAWARAN] (kita → client) — bisa multi-versi
 │     └── versi: v1, v2, v3 (linked ke proposalIds[])
 │
 ├── [CLIENT PO] (client → kita) — dasar nilai kontrak
 │     └── linked ke clientPurchaseOrderIds[]
 │
 ├── [INVOICE] (kita → client) — per termin
 │     └── linked ke invoiceIds[]
 │     └── linked ke terminId
 │
 ├── [BAST] (ditandatangani bersama)
 │     └── linked ke bastIds[]
 │
 ├── [VENDOR QUOTATION] (vendor → kita)
 │     └── linked ke vendorQuotationIds[]
 │
 └── [VENDOR PO] (kita → vendor)
       └── linked ke vendorPurchaseOrderIds[]
       └── menghasilkan EXPENSE di project
```

### 8.2 Document Lifecycle di Project

| Dokumen | Dibuat Saat | Status → Next |
|---|---|---|
| Proposal Penawaran | `PIPELINE` atau `NEGOTIATION` | Sent → Accepted/Rejected |
| Client PO | Diterima saat `NEGOTIATION` → `WON` | Received → Verified |
| Vendor Quotation | Kapan saja setelah `WON` | Received → Accepted/Rejected |
| Vendor PO | Setelah Vendor Quotation diterima | Issued → Fulfilled |
| Invoice | Per termin di `ON_PROGRESS` | Draft → Sent → Paid |
| BAST | Saat `READY_TO_CLOSE` | Draft → Signed |

---

## 9. Proposal Penawaran – Production Design

### 9.1 Proposal Versioning

- Setiap proposal punya `version` (v1, v2, dst).
- Versi baru dibuat dengan action "Revisi Proposal" (bukan edit langsung).
- Versi lama tetap tersimpan (read-only setelah ada versi baru).
- Hanya 1 versi yang `isActive: true` pada satu waktu.
- Semua versi masih terhubung ke satu `projectId`.

### 9.2 Proposal Status

| Status | Deskripsi |
|---|---|
| `DRAFT` | Sedang dibuat, belum dikirim |
| `SENT` | Sudah dikirim ke client |
| `REVISION` | Sedang direvisi berdasarkan feedback client |
| `ACCEPTED` | Client setuju (akan ada PO) |
| `REJECTED` | Client menolak |
| `EXPIRED` | Melewati `validUntil` tanpa keputusan |

### 9.3 Proposal Data Structure

```jsonc
{
  "proposalId": "PROP-2026-001",
  "proposalNumber": "PP/ADI/2026/001",
  "version": "v2",
  "versionNumber": 2,
  "isActive": true,
  "parentProposalId": "PROP-2025-001",       // null jika versi pertama
  "projectId": "PRJ-2026-001",
  "status": "SENT",
  "validUntil": "2026-03-31",

  // PIC yang membuat proposal
  "preparedById": "EMP-005",
  "preparedByName": "Rina Wulandari",
  "preparedByPosition": "Project Manager",

  // Cover Info
  "coverInfo": {
    "title": "Proposal Penawaran Implementasi ERP",
    "companyLogoUrl": "https://...",
    "date": "2026-02-15"
  },

  // Client Info
  "clientInfo": {
    "clientId": "CLT-001",
    "companyName": "PT. Contoh Maju",
    "picName": "Bapak Andi",
    "picPosition": "IT Director",
    "address": "Jl. Sudirman No. 1, Jakarta"
  },

  // Scope of Work
  "scopeOfWork": [
    {
      "order": 1,
      "title": "Analisis Kebutuhan",
      "description": "Workshop analisis kebutuhan sistem selama 2 minggu",
      "deliverables": ["Dokumen BRD", "Dokumen SRS"]
    }
  ],

  // Line Items / Pricing
  "items": [
    {
      "order": 1,
      "description": "Jasa Implementasi ERP Finance Module",
      "quantity": 1,
      "unit": "Paket",
      "unitPrice": 300000000,
      "total": 300000000
    },
    {
      "order": 2,
      "description": "Jasa Implementasi ERP HR Module",
      "quantity": 1,
      "unit": "Paket",
      "unitPrice": 150000000,
      "total": 150000000
    }
  ],

  // Summary Pricing
  "pricing": {
    "subtotal": 450000000,
    "ppnPercent": 11,
    "ppnAmount": 49500000,
    "grandTotal": 499500000,
    "currency": "IDR",
    "priceNotes": "Harga belum termasuk biaya perjalanan dinas"
  },

  // Terms & Conditions
  "termsAndConditions": [
    "Pembayaran dilakukan dalam 3 termin",
    "Validitas penawaran 45 hari sejak tanggal proposal"
  ],

  // Termin Proposal (rencana awal, bisa berubah saat di-project)
  "paymentSchedule": [
    { "terminNumber": 1, "description": "Uang Muka", "percentage": 30 },
    { "terminNumber": 2, "description": "Progress 50%", "percentage": 40 },
    { "terminNumber": 3, "description": "Final", "percentage": 30 }
  ],

  // Document Approval (tanda tangan)
  "documentApproval": {
    "preparedBy": { "name": "Rina Wulandari", "position": "Project Manager", "signatureUrl": null },
    "approvedBy": { "name": "Direktur", "position": "Direktur", "signatureUrl": null }
  },

  // Revision Notes
  "revisionNotes": "Revisi harga modul HR sesuai negosiasi",

  "sentAt": "2026-02-16T09:00:00Z",
  "sentTo": "andi@contoh.co.id",
  "createdAt": "2026-02-15T10:00:00Z",
  "createdBy": "EMP-005"
}
```

---

## 10. Purchase Order dari Client

### 10.1 Konsep

Client Purchase Order (CPO) adalah dokumen yang diterima dari client sebagai konfirmasi persetujuan mereka atas Proposal Penawaran kita. Ini menjadi dasar hukum dan nilai kontrak project.

### 10.2 CPO Data Structure

```jsonc
{
  "clientPurchaseOrderId": "CPO-2026-001",
  "cpoNumber": "PO/CONTOH/2026/0001",        // nomor PO dari client
  "internalReference": "CPO/ADI/2026/001",   // nomor referensi internal kita
  "projectId": "PRJ-2026-001",
  "clientId": "CLT-001",
  "clientName": "PT. Contoh Maju",

  // Link ke proposal yang disetujui
  "linkedProposalId": "PROP-2026-001",
  "linkedProposalVersion": "v2",

  // Nilai
  "amount": 500000000,
  "currency": "IDR",
  "ppnIncluded": true,

  // Detail
  "issuedDate": "2026-02-28",
  "receivedDate": "2026-02-28",
  "validUntil": "2026-12-31",
  "description": "PO untuk Implementasi ERP Phase 1",
  "paymentTerms": "30 hari setelah invoice diterima",

  // Status
  "status": "VERIFIED",                      // RECEIVED | VERIFIED | EXPIRED | CANCELLED

  // Attachment (file PO dari client)
  "attachmentUrl": "https://minio.alugra.co.id/...",
  "attachmentName": "PO-CONTOH-2026-0001.pdf",

  "verifiedBy": "EMP-002",
  "verifiedAt": "2026-03-01T09:00:00Z",
  "notes": "",
  "createdAt": "2026-02-28T15:00:00Z",
  "createdBy": "EMP-005"
}
```

### 10.3 CPO Business Rules

- Status project **tidak bisa** berubah ke `WON` tanpa CPO yang sudah `VERIFIED`.
- `contractValue` di project di-set otomatis dari `amount` CPO saat CPO di-verify.
- CPO yang `EXPIRED` atau `CANCELLED` memberikan warning di project.
- Satu project bisa punya lebih dari satu CPO (misalnya addendum/PO tambahan). Dalam kasus ini, `contractValue` = sum semua CPO yang `VERIFIED`.

---

## 11. Invoice – Termin Based

### 11.1 Invoice Creation Flow

```
User buka Project → pilih Termin → klik "Buat Invoice"
  → Form invoice pre-filled dengan data termin
  → Tambahkan detail item, tax (PPN, PPh)
  → Submit → Invoice DRAFT
  → Review & Approve → Invoice SENT ke client
  → Client bayar → Catat Payment → Invoice PAID
  → Termin status otomatis PAID
```

### 11.2 Invoice Data Structure (Updated)

```jsonc
{
  "invoiceId": "INV-2026-001",
  "invoiceNumber": "INV/ADI/2026/001",
  "projectId": "PRJ-2026-001",              // wajib ada
  "terminId": "TERM-001",                   // termin yang di-invoice
  "clientId": "CLT-001",
  "clientName": "PT. Contoh Maju",
  "clientPurchaseOrderId": "CPO-2026-001",  // referensi PO client
  "status": "SENT",                         // DRAFT | SENT | PAID | OVERDUE | CANCELLED | VOID

  // Tanggal
  "invoiceDate": "2026-03-25",
  "dueDate": "2026-04-24",                  // invoiceDate + paymentTerms
  "paymentTermsDays": 30,

  // Items
  "items": [
    {
      "order": 1,
      "description": "Termin 1 – Kickoff & Design Phase (30%)",
      "quantity": 1,
      "unit": "Paket",
      "unitPrice": 150000000,
      "total": 150000000
    }
  ],

  // Tax Calculation
  "tax": {
    "dpp": 150000000,
    "ppnPercent": 11,
    "ppnAmount": 16500000,
    "pphType": "PPh23",                     // null | PPh23 | PPh4Ayat2
    "pphPercent": 2,
    "pphAmount": 3000000,
    "totalTax": 13500000,                   // ppnAmount - pphAmount
    "grandTotal": 163500000                 // dpp + totalTax
  },

  // Bank Transfer Info
  "bankInfo": {
    "bankName": "BCA",
    "accountNumber": "1234567890",
    "accountName": "PT. Alugra Digital Indonesia"
  },

  "notes": "Mohon transfer sebelum tanggal jatuh tempo",
  "pdfUrl": "https://minio.alugra.co.id/invoices/INV-2026-001.pdf",

  // Payment tracking
  "payments": [
    {
      "paymentId": "PAY-2026-001",
      "amount": 163500000,
      "paymentDate": "2026-04-10",
      "method": "TRANSFER",
      "reference": "TRX123456",
      "notes": ""
    }
  ],

  "createdAt": "2026-03-25T10:00:00Z",
  "createdBy": "EMP-002"
}
```

### 11.3 Invoice Overdue Handling

- Cron job harian: cek semua invoice status `SENT` dengan `dueDate` < today → set `OVERDUE`.
- Notifikasi otomatis dikirim ke Finance Admin & PIC project.
- Invoice overdue ditampilkan dengan badge merah di dashboard.

---

## 12. BAST – Production Design

### 12.1 BAST Status

| Status | Deskripsi |
|---|---|
| `DRAFT` | Sedang dibuat, belum dikirim ke client |
| `SENT` | Sudah dikirim ke client untuk review |
| `REVISION` | Client meminta revisi |
| `SIGNED` | Ditandatangani oleh kedua pihak |
| `CANCELLED` | BAST dibatalkan |

### 12.2 BAST triggers Project Completion

- Ketika BAST status berubah ke `SIGNED`:
  - System cek apakah semua termin `PAID`.
  - Jika ya → project status otomatis berubah ke `COMPLETED`.
  - Jika belum → project status berubah ke `READY_TO_CLOSE` dengan warning "Masih ada invoice belum lunas".

### 12.3 BAST Data Structure (Updated)

```jsonc
{
  "bastId": "BAST-2026-001",
  "bastNumber": "BAST/ADI/2026/001",
  "projectId": "PRJ-2026-001",
  "clientId": "CLT-001",
  "status": "SIGNED",

  // Cover Info
  "coverInfo": {
    "title": "Berita Acara Serah Terima",
    "projectName": "Implementasi ERP Phase 1",
    "date": "2026-08-31",
    "location": "Jakarta"
  },

  // Document Info (scope yang diserahterimakan)
  "documentInfo": {
    "description": "Serah terima hasil implementasi ERP modul Finance dan HR",
    "deliverables": [
      "Sistem ERP Finance Module (Live)",
      "Sistem ERP HR Module (Live)",
      "Dokumentasi teknis sistem",
      "Training user 2 hari",
      "Source code & akses repository"
    ],
    "periodStart": "2026-03-01",
    "periodEnd": "2026-08-31"
  },

  // Delivering Party (kita)
  "deliveringParty": {
    "companyName": "PT. Alugra Digital Indonesia",
    "picName": "Rina Wulandari",
    "picPosition": "Project Manager",
    "signatureUrl": "https://...",
    "signedAt": "2026-08-31T10:00:00Z"
  },

  // Receiving Party (client)
  "receivingParty": {
    "companyName": "PT. Contoh Maju",
    "picName": "Bapak Andi",
    "picPosition": "IT Director",
    "signatureUrl": "https://...",
    "signedAt": "2026-08-31T11:00:00Z"
  },

  // Linked Documents
  "linkedInvoiceIds": ["INV-2026-001", "INV-2026-002", "INV-2026-003"],

  "notes": "",
  "pdfUrl": "https://minio.alugra.co.id/bast/BAST-2026-001.pdf",
  "createdAt": "2026-08-30T10:00:00Z",
  "createdBy": "EMP-002"
}
```

---

## 13. Quotation – Redefine sebagai Vendor Quotation

### 13.1 Konsep Baru

Karena kita **tidak menggunakan Quotation untuk ke client**, modul Quotation di-repurpose menjadi **Vendor Quotation** — yaitu penawaran harga yang kami terima dari vendor sebelum menerbitkan PO ke mereka.

### 13.2 Label di UI

- Menu: **"Vendor Quotation"** (bukan "Quotation")
- Prefix dokumen: `VQ-` (bukan `QT-`)

### 13.3 Vendor Quotation Flow

```
Vendor kirim penawaran → Input sebagai Vendor Quotation
  → Review & perbandingan harga (bisa multi-vendor untuk satu kebutuhan)
  → Accept → Terbitkan Vendor PO → Expense masuk ke project
  → Reject → Cari vendor lain
```

### 13.4 Vendor Quotation Status

| Status | Deskripsi |
|---|---|
| `RECEIVED` | Quotation diterima dari vendor |
| `UNDER_REVIEW` | Sedang dievaluasi |
| `ACCEPTED` | Disetujui, akan diterbitkan PO |
| `REJECTED` | Ditolak |
| `EXPIRED` | Melewati tanggal validitas |

---

## 14. Sales Analytics – Multi-Role

### 14.1 Konsep

Sales Analytics **tidak terbatas pada karyawan Sales**. Semua karyawan yang pernah menjadi PIC pitching project akan muncul di analytics ini, diidentifikasi dari field `picId` di setiap project.

### 14.2 Metrics per Individu

| Metric | Kalkulasi |
|---|---|
| Total Pitching | COUNT(projects WHERE picId = X) |
| Total WON | COUNT(projects WHERE picId = X AND status IN [WON, ON_PROGRESS, COMPLETED]) |
| Win Rate | (Total WON / Total Pitching) * 100 |
| Total Contract Value | SUM(contractValue WHERE picId = X AND status = WON/above) |
| Avg Deal Size | Total Contract Value / Total WON |
| Revenue Realized | SUM(totalPaid) dari project-project PIC ini |
| Pipeline Value | SUM(contractValue WHERE status IN [PIPELINE, NEGOTIATION]) |

### 14.3 Metrics Overview (Company Level)

| Metric | Deskripsi |
|---|---|
| Total Revenue QTD/YTD | Sum semua `totalPaid` project completed periode ini |
| Total Pipeline | Sum `contractValue` semua project PIPELINE + NEGOTIATION |
| Win Rate Company | Total WON / Total Pitching semua employee |
| Best Performer | PIC dengan win rate atau contract value tertinggi |
| Conversion Funnel | PIPELINE → NEGOTIATION → WON → COMPLETED |

### 14.4 Filter & View Options

```
Filter:
  - Periode     : This Month | This Quarter | This Year | Custom Range
  - Employee    : All | By Name
  - Department  : All | Operations | Sales | Finance | dll
  - Position    : All | PM | SA | Tenaga Ahli | dll
  - Status      : All | Active Pipeline | Won | Lost

View:
  - Overview (company-wide metrics)
  - Per Employee (ranking/leaderboard)
  - Funnel Analysis (conversion rate per stage)
  - Revenue Timeline (grafik revenue per bulan)
```

### 14.5 Quarterly Target

- Bisa diset target revenue per quarter di settings.
- Ditampilkan sebagai: `Rp X / Rp Y (Z%)` dengan progress bar.
- Alert jika Q sudah 75% berjalan tapi target baru tercapai < 50%.

---

## 15. Notification & Reminder System

### 15.1 Trigger & Recipients

| Event | Trigger | Penerima |
|---|---|---|
| Termin jatuh tempo H-7 | Cron harian | PIC + Finance Admin |
| Invoice overdue | Cron harian, hari H+1 setelah due date | Finance Admin + PM |
| Invoice overdue H+14 | Cron harian | Finance Admin + Direktur |
| Expense pending approval > 3 hari | Cron harian | Finance Admin |
| Budget alert (expense > 80%) | Real-time saat expense di-save | PM + Finance Admin |
| Project endDate H-14 | Cron harian | PM + PIC |
| BAST belum dibuat, semua termin paid | Real-time | PM + Finance Admin |
| Project status berubah | Real-time | PIC + PM + Finance Admin |
| PO client diterima (status → WON) | Real-time | Semua team member project |

### 15.2 Notification Channels

- **In-app notification** (bell icon di header, badge count)
- **Email** (digest harian untuk reminder, real-time untuk urgent)

### 15.3 Notification Data Structure

```jsonc
{
  "notificationId": "NOTIF-001",
  "recipientId": "EMP-002",
  "type": "INVOICE_OVERDUE",
  "priority": "HIGH",                       // LOW | MEDIUM | HIGH | URGENT
  "title": "Invoice INV-2026-001 Overdue",
  "message": "Invoice untuk PT. Contoh Maju sudah melewati jatuh tempo sejak 3 hari lalu",
  "relatedEntity": {
    "entityType": "INVOICE",
    "entityId": "INV-2026-001",
    "projectId": "PRJ-2026-001"
  },
  "actionUrl": "/finance/invoice/INV-2026-001",
  "isRead": false,
  "createdAt": "2026-04-27T08:00:00Z"
}
```

---

## 16. RBAC – Updated Permission Keys

```
dashboard

projects
projects.view
projects.create
projects.edit
projects.delete
projects.manage_termin
projects.manage_expense
projects.change_status

finance
finance.accounting
finance.invoice
finance.invoice.create
finance.invoice.approve
finance.invoice.void
finance.payment
finance.payment.record
finance.clients
finance.vendors
finance.proposal-penawaran
finance.proposal-penawaran.create
finance.proposal-penawaran.approve
finance.client-purchase-orders        ← NEW
finance.vendor-quotations             ← RENAMED dari quotations
finance.vendor-purchase-orders        ← RENAMED dari purchase-orders
finance.perpajakan
finance.bast
finance.bast.sign
finance.transactions

hr
hr.employees
hr.positions

sales                                 ← analytics only
sales.view_all                        ← lihat semua employee, bukan hanya diri sendiri
sales.manage_targets                  ← set quarterly target

inventory

reports

access_control
access_control.roles
access_control.users

notifications
notifications.manage                  ← manage template & settings
```

### 16.1 Role Presets

| Role | Key Permissions |
|---|---|
| `SUPER_ADMIN` | Semua permissions |
| `DIREKTUR` | View semua, approve semua, sales.view_all |
| `FINANCE_ADMIN` | finance.*, projects.view, projects.manage_expense |
| `PROJECT_MANAGER` | projects.*, finance.invoice (view), finance.proposal-penawaran.create |
| `HR_ADMIN` | hr.* |
| `SALES` | projects.create, projects.view, sales.view_all, finance.proposal-penawaran.create |
| `STAFF` | projects.view (assigned projects only), sales.view (own stats only) |

---

## 17. API Structure – Updated

### 17.1 New & Updated Endpoints

```
# Projects
GET    /api/finance/projects
POST   /api/finance/projects
GET    /api/finance/projects/:id
PUT    /api/finance/projects/:id
DELETE /api/finance/projects/:id
PATCH  /api/finance/projects/:id/status        ← ubah status dengan validasi
POST   /api/finance/projects/:id/termin        ← kelola termin
PUT    /api/finance/projects/:id/termin/:terminId
DELETE /api/finance/projects/:id/termin/:terminId
POST   /api/finance/projects/:id/expenses      ← kelola expense
PUT    /api/finance/projects/:id/expenses/:expenseId
PATCH  /api/finance/projects/:id/expenses/:expenseId/approve
PATCH  /api/finance/projects/:id/expenses/:expenseId/reject
GET    /api/finance/projects/:id/summary       ← financial summary + margin

# Client Purchase Orders (NEW)
GET    /api/finance/client-purchase-orders
POST   /api/finance/client-purchase-orders
GET    /api/finance/client-purchase-orders/:id
PUT    /api/finance/client-purchase-orders/:id
PATCH  /api/finance/client-purchase-orders/:id/verify

# Vendor Quotations (RENAMED from quotations)
GET    /api/finance/vendor-quotations
POST   /api/finance/vendor-quotations
GET    /api/finance/vendor-quotations/:id
PUT    /api/finance/vendor-quotations/:id
PATCH  /api/finance/vendor-quotations/:id/accept
PATCH  /api/finance/vendor-quotations/:id/reject

# Vendor Purchase Orders (RENAMED from purchase-orders)
GET    /api/finance/vendor-purchase-orders
POST   /api/finance/vendor-purchase-orders
GET    /api/finance/vendor-purchase-orders/:id
PUT    /api/finance/vendor-purchase-orders/:id

# Proposal Penawaran (Updated)
GET    /api/finance/proposal-penawaran
POST   /api/finance/proposal-penawaran
GET    /api/finance/proposal-penawaran/:id
PUT    /api/finance/proposal-penawaran/:id
POST   /api/finance/proposal-penawaran/:id/revise    ← buat versi baru
PATCH  /api/finance/proposal-penawaran/:id/send
PATCH  /api/finance/proposal-penawaran/:id/status

# Invoice (Updated)
GET    /api/finance/invoices
POST   /api/finance/invoices
GET    /api/finance/invoices/:id
PUT    /api/finance/invoices/:id
PATCH  /api/finance/invoices/:id/send
PATCH  /api/finance/invoices/:id/void
POST   /api/finance/invoices/:id/payments            ← catat pembayaran

# BAST (Updated)
GET    /api/finance/basts
POST   /api/finance/basts
GET    /api/finance/basts/:id
PUT    /api/finance/basts/:id
PATCH  /api/finance/basts/:id/send
PATCH  /api/finance/basts/:id/sign                   ← trigger project completion

# Sales Analytics (Updated)
GET    /api/analytics/sales                          ← company overview
GET    /api/analytics/sales/employees                ← per employee ranking
GET    /api/analytics/sales/employees/:id            ← individual stats
GET    /api/analytics/sales/funnel                   ← conversion funnel
GET    /api/analytics/sales/targets                  ← quarterly targets
PUT    /api/analytics/sales/targets/:quarter         ← set target

# Notifications
GET    /api/notifications                            ← user's notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
GET    /api/notifications/settings
PUT    /api/notifications/settings

# Dashboard (Updated)
GET    /api/analytics/dashboard
```

### 17.2 Standard Response Format

```jsonc
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Total persentase termin harus 100%",
    "details": [
      { "field": "termin[2].percentage", "message": "Total melebihi 100%" }
    ]
  }
}
```

### 17.3 Query Parameters Standard

```
GET /api/finance/projects?
  status=ON_PROGRESS,WON          # filter by status (comma-separated)
  clientId=CLT-001                # filter by client
  picId=EMP-005                   # filter by PIC
  projectManagerId=EMP-001        # filter by PM
  startDateFrom=2026-01-01        # range filter
  startDateTo=2026-12-31
  search=ERP                      # full-text search
  page=1                          # pagination
  limit=20
  sortBy=createdAt                # sort field
  sortOrder=desc                  # asc | desc
  include=finance,termin          # eager load relations
```

---

## 18. Frontend Routes – Updated

```
/dashboard                              Dashboard utama

/projects                               List semua project
/projects/create                        Buat project baru
/projects/:id                           Detail project (tabs: Overview, Finance, Termin, Expense, Dokumen, Timeline)
/projects/:id/edit                      Edit project
/projects/:id/termin                    Kelola termin project
/projects/:id/expenses                  Kelola expenses project
/projects/:id/expenses/create           Tambah expense
/projects/:id/expenses/:expenseId       Detail expense

/finance/accounting                     Financial Overview
/finance/invoice                        List invoice
/finance/invoice/create                 Buat invoice (pilih project + termin)
/finance/invoice/:id                    Detail invoice
/finance/invoice/:id/edit               Edit invoice (hanya status DRAFT)
/finance/payment                        List payment
/finance/payment/:id                    Detail payment

/finance/client-purchase-orders         List CPO dari client (NEW)
/finance/client-purchase-orders/create  Input CPO baru (NEW)
/finance/client-purchase-orders/:id     Detail CPO (NEW)

/finance/vendor-quotations              List vendor quotations (RENAMED)
/finance/vendor-quotations/create       Buat vendor quotation (RENAMED)
/finance/vendor-quotations/:id          Detail vendor quotation (RENAMED)

/finance/vendor-purchase-orders         List PO ke vendor (RENAMED)
/finance/vendor-purchase-orders/create  Buat PO ke vendor (RENAMED)
/finance/vendor-purchase-orders/:id     Detail PO ke vendor (RENAMED)

/finance/clients                        Master data client
/finance/clients/:id                    Detail client (+ history project)
/finance/vendors                        Master data vendor
/finance/vendors/:id                    Detail vendor (+ history PO + quotation)
/finance/proposal-penawaran             List proposal
/finance/proposal-penawaran/create      Buat proposal baru
/finance/proposal-penawaran/:id         Detail proposal (+ versi history)
/finance/proposal-penawaran/:id/revise  Buat revisi proposal
/finance/perpajakan                     Master pajak
/finance/bast                           List BAST
/finance/bast/create                    Buat BAST
/finance/bast/:id                       Detail BAST
/finance/new-transaction                Input transaksi manual

/sales                                  Sales Analytics Overview
/sales/employees                        Leaderboard per employee
/sales/employees/:id                    Individual sales stats
/sales/funnel                           Conversion funnel analysis

/hr/employees                           List karyawan
/hr/employees/create                    Tambah karyawan
/hr/employees/:id                       Detail karyawan
/hr/positions                           Master posisi

/inventory                              Inventory (existing)
/reports                                Reports (existing)

/notifications                          Semua notifikasi
/settings                               Settings
/settings/targets                       Set quarterly revenue target (Finance/Admin only)

/access-control/roles                   Master role
/access-control/users                   Master user
```

---

## 19. Data Schema – Full Reference

### 19.1 Database Tables

```sql
-- Core project table
projects (
  id, project_code, nama_project, client_id, scope_project, description,
  start_date, end_date, status, priority, tags,
  project_manager_id, pic_id, pic_position, pic_department,
  contract_value, currency, ppn_included,
  budget_alert_threshold, notes,
  created_at, updated_at, created_by, updated_by,
  deleted_at  -- soft delete
)

-- Project team members
project_team_members (
  id, project_id, employee_id, role, assigned_at, removed_at
)

-- Termin
project_termins (
  id, project_id, termin_number, description,
  percentage, amount, due_date, status,
  invoice_id, paid_at, notes,
  created_at, updated_at
)

-- Expenses
project_expenses (
  id, project_id, category, description,
  amount, currency, date,
  vendor_id, vendor_po_id, invoice_vendor_number,
  status, submitted_by, approved_by, approved_at, rejected_reason,
  notes, created_at, updated_at
)

-- Expense attachments
expense_attachments (
  id, expense_id, name, url, size, uploaded_at, uploaded_by
)

-- Project milestones
project_milestones (
  id, project_id, title, target_date, completed_date,
  status, linked_termin_id, notes,
  created_at, updated_at
)

-- Project status history
project_status_history (
  id, project_id, from_status, to_status,
  changed_at, changed_by, notes
)

-- Project documents
project_documents (
  id, project_id, name, type, url, size,
  uploaded_at, uploaded_by
)

-- Client Purchase Orders
client_purchase_orders (
  id, cpo_number, internal_reference, project_id, client_id,
  linked_proposal_id, linked_proposal_version,
  amount, currency, ppn_included,
  issued_date, received_date, valid_until,
  description, payment_terms, status,
  attachment_url, attachment_name,
  verified_by, verified_at, notes,
  created_at, created_by
)

-- Document relations (linking)
project_document_relations (
  id, project_id, document_type, document_id, linked_at, linked_by
)
-- document_type: PROPOSAL | CLIENT_PO | INVOICE | BAST | VENDOR_QUOTATION | VENDOR_PO

-- Proposal versioning
proposal_penawaran (
  id, proposal_number, version, version_number, is_active,
  parent_proposal_id, project_id, status, valid_until,
  prepared_by_id,
  -- JSONB: cover_info, client_info, scope_of_work, items, pricing
  -- JSONB: terms_and_conditions, payment_schedule, document_approval
  revision_notes, sent_at, sent_to,
  created_at, created_by
)

-- Notifications
notifications (
  id, recipient_id, type, priority,
  title, message,
  entity_type, entity_id, project_id,
  action_url, is_read, read_at,
  created_at
)

-- Sales targets
sales_targets (
  id, year, quarter, target_amount, currency,
  set_by, set_at, notes
)
```

### 19.2 JSONB Columns di Projects Table

Pertimbangkan menyimpan data yang tidak sering di-query sebagai JSONB di project table untuk fleksibilitas, atau normalize sepenuhnya untuk performa query yang lebih baik:

| Data | Rekomendasi |
|---|---|
| `identity.*` | Normalize (separate columns) |
| `finance.*` | Computed columns + stored |
| `termin[]` | Separate table (`project_termins`) |
| `expenses[]` | Separate table (`project_expenses`) |
| `milestones[]` | Separate table (`project_milestones`) |
| `documentRelations` | Separate table (`project_document_relations`) |
| `documents[]` | Separate table (`project_documents`) |
| `statusHistory[]` | Separate table (`project_status_history`) |
| `teamMembers[]` | Separate table (`project_team_members`) |

---

## 20. Business Rules & Validations

### 20.1 Project Rules

| Rule | Detail |
|---|---|
| Project wajib punya PIC | `picId` tidak boleh null |
| Termin total = 100% | Validasi saat save termin |
| Tidak bisa `WON` tanpa CPO | `clientPurchaseOrderIds` harus ada minimal 1 yang `VERIFIED` |
| Tidak bisa `COMPLETED` tanpa BAST | `bastIds` harus ada minimal 1 yang `SIGNED` |
| `contractValue` auto dari CPO | Set otomatis saat CPO di-verify, bisa override manual |
| Expense approve flow | Expense > Rp 10jt wajib approval Finance Admin (threshold configurable) |
| Margin alert | Warning jika `marginPercent` < 20% (configurable di settings) |
| Status history immutable | Tidak bisa diedit/dihapus |
| PIC tidak bisa diubah post-completion | Setelah `COMPLETED` atau `CANCELLED`, `picId` locked |

### 20.2 Invoice Rules

| Rule | Detail |
|---|---|
| Invoice wajib ada `projectId` | Setiap invoice harus terhubung ke project |
| Invoice wajib ada `terminId` | Setiap invoice harus dari termin |
| Satu termin = satu invoice | Tidak bisa buat invoice baru untuk termin yang sudah `INVOICED` |
| Invoice VOID | Bisa void invoice status `SENT` jika belum ada payment; termin kembali ke `SCHEDULED` |
| Grand total harus > 0 | Validasi basic |

### 20.3 BAST Rules

| Rule | Detail |
|---|---|
| BAST hanya bisa dibuat jika project `READY_TO_CLOSE` atau `ON_PROGRESS` | Guard di backend |
| Sign BAST = trigger completion check | Otomatis cek termin & payment |
| BAST `SIGNED` tidak bisa dihapus | Historical record |

### 20.4 Expense Rules

| Rule | Detail |
|---|---|
| Expense hanya bisa di project `ON_PROGRESS` atau `ON_HOLD` | Guard di backend |
| Expense tidak bisa delete jika `PAID` | Harus cancel dengan alasan |
| Attachment wajib untuk expense > Rp 5jt | Configurable di settings |

---

*Dokumen ini adalah production design reference untuk CoreApps ERP v2.0.*  
*Semua implementasi harus mengacu pada spesifikasi ini.*  
*Perubahan pada dokumen ini harus didiskusikan dengan tim dan di-versioned.*

---
**PT. Alugra Digital Indonesia** | CoreApps ERP v2.0 | February 2026