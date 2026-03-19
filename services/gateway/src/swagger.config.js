export default {
    openapi: '3.0.0',
    info: {
        title: 'CoreApps ERP API Documentation',
        version: '1.0.0',
        description: 'Unified API documentation for all CoreApps ERP microservices - Authentication, Users & Roles (Access Control), CRM, HR, Finance, Inventory, Accounting, Manufacturing, Assets, Analytics, and Notifications',
        contact: {
            name: 'PT Alugra Indonesia',
            email: 'dev@alugra.co.id'
        },
        license: {
            name: 'Proprietary',
            url: 'https://alugra.co.id'
        }
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Development Server'
        },
        {
            url: 'https://api.alugra.co.id',
            description: 'Production Server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT token obtained from /api/auth/login'
            }
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Human-readable error message' },
                    code: { type: 'string', example: 'ERROR_CODE' },
                    errors: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                field: { type: 'string' },
                                message: { type: 'string' }
                            }
                        }
                    }
                }
            },
            // Auth Schemas
            LoginRequest: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                    username: { type: 'string', example: 'admin' },
                    password: { type: 'string', example: 'admin123' }
                }
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    token: { type: 'string' },
                    user: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            username: { type: 'string' },
                            role: { type: 'string' }
                        }
                    }
                }
            },
            // User (Access Control) Schemas
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'user-1', description: 'User ID (format: user-{id})' },
                    username: { type: 'string', example: 'admin' },
                    email: { type: 'string', nullable: true, example: 'admin@example.com' },
                    fullName: { type: 'string', nullable: true, example: 'Admin User' },
                    roleId: { type: 'string', nullable: true, example: 'role-1', description: 'Assigned role ID (format: role-{id})' },
                    isActive: { type: 'boolean', default: true },
                    createdAt: { type: 'string', format: 'date-time', nullable: true },
                    updatedAt: { type: 'string', format: 'date-time', nullable: true }
                }
            },
            UserCreateInput: {
                type: 'object',
                required: ['username', 'email', 'fullName', 'roleId'],
                properties: {
                    username: { type: 'string', example: 'newuser' },
                    email: { type: 'string', example: 'user@example.com' },
                    fullName: { type: 'string', example: 'New User' },
                    roleId: { type: 'string', example: 'role-1', description: 'Required. Role ID (format: role-{id})' },
                    password: { type: 'string', example: 'changeme', description: 'Optional. Defaults to "changeme" if omitted' },
                    isActive: { type: 'boolean', default: true }
                }
            },
            UserUpdateInput: {
                type: 'object',
                properties: {
                    username: { type: 'string' },
                    email: { type: 'string' },
                    fullName: { type: 'string' },
                    roleId: { type: 'string', nullable: true },
                    password: { type: 'string', description: 'Optional. Only include to change password' },
                    isActive: { type: 'boolean' }
                }
            },
            Role: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'role-1', description: 'Role ID (format: role-{id})' },
                    code: { type: 'string', example: 'ADMIN' },
                    name: { type: 'string', example: 'Administrator' },
                    description: { type: 'string', nullable: true },
                    permissionKeys: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['access_control.users', 'access_control.roles']
                    },
                    isActive: { type: 'boolean', default: true },
                    createdAt: { type: 'string', format: 'date-time', nullable: true },
                    updatedAt: { type: 'string', format: 'date-time', nullable: true }
                }
            },
            RoleCreateInput: {
                type: 'object',
                required: ['code', 'name'],
                properties: {
                    code: { type: 'string', example: 'MANAGER' },
                    name: { type: 'string', example: 'Manager' },
                    description: { type: 'string', example: 'Department manager role' },
                    permissionKeys: {
                        type: 'array',
                        items: { type: 'string' },
                        default: []
                    },
                    isActive: { type: 'boolean', default: true }
                }
            },
            RoleUpdateInput: {
                type: 'object',
                properties: {
                    code: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    permissionKeys: { type: 'array', items: { type: 'string' } },
                    isActive: { type: 'boolean' }
                }
            },
            PaginatedResponse: {
                type: 'object',
                properties: {
                    data: { type: 'array', items: {} },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' }
                }
            },
            // CRM Schemas
            Lead: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    source: { type: 'string' },
                    status: { type: 'string' }
                }
            },
            // HR Schemas
            Employee: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    nik: { type: 'string' },
                    name: { type: 'string' },
                    ktp: { type: 'string' },
                    department: { type: 'string' },
                    position: { type: 'string' },
                    joinDate: { type: 'string', format: 'date' },
                    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'TERMINATED'] }
                }
            },
            LeaveApplication: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    employeeId: { type: 'integer' },
                    leaveTypeId: { type: 'integer' },
                    fromDate: { type: 'string', format: 'date' },
                    toDate: { type: 'string', format: 'date' },
                    totalDays: { type: 'integer' },
                    reason: { type: 'string' },
                    status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] }
                }
            },
            // Finance Schemas
            Invoice: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    invoiceNumber: { type: 'string' },
                    clientId: { type: 'integer' },
                    issueDate: { type: 'string', format: 'date' },
                    dueDate: { type: 'string', format: 'date' },
                    grandTotal: { type: 'number' },
                    status: { type: 'string', enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE'] }
                }
            },
            FinanceMetric: {
                type: 'object',
                properties: {
                    key: { type: 'string', example: 'totalRevenue' },
                    title: { type: 'string', example: 'Total Revenue' },
                    value: { type: 'number' },
                    formattedValue: { type: 'string', example: 'Rp 6,64 M' },
                    changePercent: { type: 'number', example: 12.4 },
                    trend: { type: 'string', enum: ['up', 'down'] }
                }
            },
            RevenueGrowthItem: {
                type: 'object',
                properties: {
                    month: { type: 'string', example: 'Nov' },
                    value: { type: 'number' },
                    active: { type: 'boolean', nullable: true }
                }
            },
            AccountBalance: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string', example: 'Main Operations' },
                    number: { type: 'string', example: 'Bank Central • 1290' },
                    balance: { type: 'number' },
                    formattedBalance: { type: 'string', example: 'Rp 5,31 M' }
                }
            },
            ExpenseBreakdownItem: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'Operational' },
                    value: { type: 'number', example: 45 },
                    color: { type: 'string', example: '#3b82f6' }
                }
            },
            RecentTransaction: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'TX-9012' },
                    date: { type: 'string' },
                    entity: { type: 'string' },
                    category: { type: 'string' },
                    amount: { type: 'number' },
                    formattedAmount: { type: 'string' },
                    type: { type: 'string', enum: ['inbound', 'outbound'] },
                    status: { type: 'string', example: 'Completed' }
                }
            },
            FinanceOverview: {
                type: 'object',
                properties: {
                    metrics: { type: 'array', items: { $ref: '#/components/schemas/FinanceMetric' } },
                    revenueGrowth: { type: 'array', items: { $ref: '#/components/schemas/RevenueGrowthItem' } },
                    accountBalances: { type: 'array', items: { $ref: '#/components/schemas/AccountBalance' } },
                    expenseBreakdown: { type: 'array', items: { $ref: '#/components/schemas/ExpenseBreakdownItem' } },
                    recentTransactions: { type: 'array', items: { $ref: '#/components/schemas/RecentTransaction' } }
                }
            },
            FinanceOverviewResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/FinanceOverview' },
                    meta: {
                        type: 'object',
                        properties: { generatedAt: { type: 'string', format: 'date-time' } }
                    }
                }
            },
            // Accounting Schemas
            Account: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    code: { type: 'string' },
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] },
                    balance: { type: 'string' }
                }
            },
            JournalEntry: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    reference: { type: 'string' },
                    description: { type: 'string' },
                    date: { type: 'string', format: 'date' },
                    status: { type: 'string', enum: ['DRAFT', 'POSTED'] },
                    lines: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                accountId: { type: 'integer' },
                                debit: { type: 'number' },
                                credit: { type: 'number' },
                                description: { type: 'string' }
                            }
                        }
                    }
                }
            },
            // Manufacturing Schemas
            BOM: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    itemId: { type: 'integer' },
                    name: { type: 'string' },
                    totalCost: { type: 'string' },
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                itemId: { type: 'integer' },
                                quantity: { type: 'string' }
                            }
                        }
                    }
                }
            },
            WorkOrder: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    woNumber: { type: 'string' },
                    bomId: { type: 'integer' },
                    itemId: { type: 'integer' },
                    qtyToProduce: { type: 'integer' },
                    warehouseId: { type: 'integer' },
                    status: { type: 'string', enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] }
                }
            },
            // Asset Schemas
            Asset: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    category: { type: 'string', enum: ['BUILDING', 'MACHINERY', 'VEHICLES', 'FURNITURE', 'ELECTRONICS'] },
                    purchaseDate: { type: 'string', format: 'date' },
                    purchaseAmount: { type: 'string' },
                    depreciationMethod: { type: 'string', enum: ['SLM', 'WDV', 'MANUAL'] },
                    location: { type: 'string' }
                }
            },
            // Analytics Schemas
            DashboardKPIs: {
                type: 'object',
                properties: {
                    finance: {
                        type: 'object',
                        properties: {
                            totalRevenue: { type: 'number' },
                            outstandingInvoices: { type: 'number' },
                            totalInvoices: { type: 'integer' },
                            period: { type: 'string' }
                        }
                    },
                    hr: {
                        type: 'object',
                        properties: {
                            employeeCount: { type: 'integer' },
                            activeEmployees: { type: 'integer' },
                            attendanceRate: { type: 'number' },
                            leaveUtilization: { type: 'number' }
                        }
                    },
                    manufacturing: {
                        type: 'object',
                        properties: {
                            inProgressWorkOrders: { type: 'integer' },
                            completedWorkOrders: { type: 'integer' },
                            totalWorkOrders: { type: 'integer' },
                            productionEfficiency: { type: 'string' }
                        }
                    },
                    inventory: {
                        type: 'object',
                        properties: {
                            stockValue: { type: 'number' },
                            lowStockAlerts: { type: 'integer' },
                            totalProducts: { type: 'integer' }
                        }
                    },
                    timestamp: { type: 'string', format: 'date-time' }
                }
            },
            BalanceSheet: {
                type: 'object',
                properties: {
                    reportName: { type: 'string' },
                    asOfDate: { type: 'string', format: 'date' },
                    assets: {
                        type: 'object',
                        properties: {
                            accounts: { type: 'array', items: { $ref: '#/components/schemas/Account' } },
                            total: { type: 'number' }
                        }
                    },
                    liabilities: {
                        type: 'object',
                        properties: {
                            accounts: { type: 'array', items: { $ref: '#/components/schemas/Account' } },
                            total: { type: 'number' }
                        }
                    },
                    equity: {
                        type: 'object',
                        properties: {
                            accounts: { type: 'array', items: { $ref: '#/components/schemas/Account' } },
                            total: { type: 'number' }
                        }
                    },
                    totalLiabilitiesAndEquity: { type: 'number' },
                    balanced: { type: 'boolean' }
                }
            },
            // ─── Catatan Pengeluaran Schemas ─────────────────────────────────────────
            AccountingPeriod: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    year: { type: 'integer', example: 2026 },
                    month: { type: 'integer', example: 3 },
                    status: { type: 'string', enum: ['OPEN', 'CLOSED', 'LOCKED'], example: 'OPEN' },
                    closedAt: { type: 'string', format: 'date-time', nullable: true },
                    closedBy: { type: 'integer', nullable: true },
                    reopenedAt: { type: 'string', format: 'date-time', nullable: true },
                    reopenedReason: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            KasKecilTransaction: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    periodId: { type: 'integer', example: 1 },
                    transNumber: { type: 'string', example: 'KK/2026/03/001' },
                    date: { type: 'string', format: 'date', example: '2026-03-01' },
                    description: { type: 'string', example: 'Pembelian alat tulis' },
                    debit: { type: 'string', example: '500000' },
                    credit: { type: 'string', example: '0' },
                    runningBalance: { type: 'string', example: '500000' },
                    attachmentUrl: { type: 'string', nullable: true },
                    createdBy: { type: 'integer', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            KasBankTransaction: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    periodId: { type: 'integer', example: 1 },
                    transNumber: { type: 'string', example: 'KB/2026/03/001' },
                    date: { type: 'string', format: 'date', example: '2026-03-01' },
                    coaAccount: { type: 'string', example: '1-1100' },
                    description: { type: 'string', example: 'Transfer gaji' },
                    inflow: { type: 'string', example: '10000000' },
                    outflow: { type: 'string', example: '0' },
                    runningBalance: { type: 'string', example: '10000000' },
                    reference: { type: 'string', nullable: true, example: 'TF-20260301' },
                    createdBy: { type: 'integer', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            JurnalMemorialLine: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    jurnalMemorialId: { type: 'integer' },
                    accountNumber: { type: 'string', example: '1-1100' },
                    accountName: { type: 'string', example: 'Kas' },
                    debit: { type: 'string', example: '1000000' },
                    credit: { type: 'string', example: '0' },
                    lineDescription: { type: 'string', nullable: true }
                }
            },
            JurnalMemorial: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    periodId: { type: 'integer', example: 1 },
                    journalCode: { type: 'string', example: 'JM/2026/03/001' },
                    date: { type: 'string', format: 'date', example: '2026-03-31' },
                    description: { type: 'string', example: 'Penyesuaian penyusutan aset' },
                    status: { type: 'string', enum: ['DRAFT', 'POSTED'], example: 'DRAFT' },
                    lines: { type: 'array', items: { $ref: '#/components/schemas/JurnalMemorialLine' } },
                    createdBy: { type: 'integer', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            // ─── Asset Schemas ───────────────────────────────────────────────────────────
            Asset: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    assetCode: { type: 'string', example: 'AST-2026-001', nullable: true },
                    name: { type: 'string', example: 'Laptop Dell XPS 15' },
                    category: { type: 'string', enum: ['BUILDING', 'MACHINERY', 'VEHICLES', 'FURNITURE', 'ELECTRONICS'] },
                    purchaseDate: { type: 'string', format: 'date-time', example: '2026-01-15T00:00:00.000Z' },
                    purchaseAmount: { type: 'string', example: '25000000' },
                    salvageValue: { type: 'string', example: '2500000', nullable: true },
                    usefulLifeMonths: { type: 'integer', example: 60, nullable: true },
                    location: { type: 'string', nullable: true },
                    department: { type: 'string', nullable: true },
                    vendor: { type: 'string', nullable: true },
                    depreciationMethod: { type: 'string', enum: ['SLM', 'WDV', 'MANUAL'], example: 'SLM' },
                    coaAssetAccount: { type: 'string', example: '1-2100', nullable: true },
                    coaDepreciationExpenseAccount: { type: 'string', example: '5-1100', nullable: true },
                    coaAccumulatedDepreciationAccount: { type: 'string', example: '1-2200', nullable: true },
                    totalDepreciation: { type: 'string', example: '5000000', nullable: true },
                    valueAfterDepreciation: { type: 'string', example: '20000000', nullable: true },
                    status: { type: 'string', enum: ['ACTIVE', 'SOLD', 'SCRAPPED'], example: 'ACTIVE' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            AssetAcquisitionJournal: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    periodId: { type: 'integer', example: 1 },
                    assetId: { type: 'integer', example: 1 },
                    journalCode: { type: 'string', example: 'JAA/2026/03/001' },
                    date: { type: 'string', format: 'date', example: '2026-03-01' },
                    description: { type: 'string', example: 'Perolehan Laptop Dell XPS 15' },
                    debitAccount: { type: 'string', example: '1-2100' },
                    debitAccountName: { type: 'string', example: 'Aset Tetap - Elektronik' },
                    creditAccount: { type: 'string', example: '1-1100' },
                    creditAccountName: { type: 'string', example: 'Kas' },
                    amount: { type: 'string', example: '25000000' },
                    notes: { type: 'string', nullable: true },
                    status: { type: 'string', enum: ['DRAFT', 'POSTED'], example: 'DRAFT' },
                    journalEntryId: { type: 'integer', nullable: true },
                    assetName: { type: 'string', nullable: true },
                    assetCode: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            AssetDepreciationJournal: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    assetId: { type: 'integer', example: 1 },
                    periodId: { type: 'integer', example: 1, nullable: true },
                    date: { type: 'string', format: 'date-time', example: '2026-03-01T00:00:00.000Z' },
                    amount: { type: 'string', example: '375000' },
                    description: { type: 'string', nullable: true },
                    status: { type: 'string', enum: ['DRAFT', 'POSTED'], example: 'DRAFT' },
                    journalEntryId: { type: 'integer', nullable: true },
                    assetName: { type: 'string', nullable: true },
                    assetCode: { type: 'string', nullable: true },
                    coaDepreciationExpense: { type: 'string', nullable: true },
                    coaAccumulatedDepreciation: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            // ─── Voucher Schemas ─────────────────────────────────────────────────────────
            VoucherLine: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    voucherId: { type: 'integer' },
                    accountNumber: { type: 'string', example: '1-1100' },
                    accountName: { type: 'string', example: 'Kas' },
                    description: { type: 'string', nullable: true },
                    debit: { type: 'string', example: '500000' },
                    credit: { type: 'string', example: '0' }
                }
            },
            Voucher: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    periodId: { type: 'integer', example: 1 },
                    voucherNumber: { type: 'string', example: 'VKK/2026/03/001' },
                    voucherType: { type: 'string', enum: ['KAS_KECIL', 'KAS_BANK'], example: 'KAS_KECIL' },
                    date: { type: 'string', format: 'date', example: '2026-03-09' },
                    payee: { type: 'string', example: 'PT. Contoh Supplier' },
                    description: { type: 'string', example: 'Pembelian ATK' },
                    totalAmount: { type: 'string', example: '500000' },
                    paymentMethod: { type: 'string', nullable: true, example: 'Tunai' },
                    preparedBy: { type: 'integer', nullable: true },
                    reviewedBy: { type: 'integer', nullable: true },
                    approvedBy: { type: 'integer', nullable: true },
                    receivedBy: { type: 'string', nullable: true },
                    status: {
                        type: 'string',
                        enum: ['DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'],
                        example: 'DRAFT'
                    },
                    reviewedAt: { type: 'string', format: 'date-time', nullable: true },
                    approvedAt: { type: 'string', format: 'date-time', nullable: true },
                    paidAt: { type: 'string', format: 'date-time', nullable: true },
                    rejectionReason: { type: 'string', nullable: true },
                    attachmentUrl: { type: 'string', nullable: true },
                    createdBy: { type: 'integer', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    lines: { type: 'array', items: { $ref: '#/components/schemas/VoucherLine' } }
                }
            }
        }
    },
    tags: [
        { name: 'Auth', description: 'Authentication and authorization' },
        { name: 'Users', description: 'User management and access control' },
        { name: 'Roles', description: 'Role management and RBAC permissions' },
        { name: 'CRM', description: 'Customer Relationship Management - Leads, Opportunities, Customers' },
        { name: 'HR', description: 'Human Resources - Employees, Attendance, Leave, Payroll' },
        { name: 'Finance', description: 'Finance & Invoicing - Invoices, Payments, Quotations' },
        { name: 'Inventory', description: 'Stock & Warehouse Management' },
        { name: 'Accounting', description: 'General Ledger, Journal Entries, Chart of Accounts' },
        { name: 'Accounting Reports', description: 'Financial Reports - Balance Sheet, P&L, Trial Balance, GL' },
        { name: 'Manufacturing', description: 'Production Management - BOMs, Work Orders, Job Cards' },
        { name: 'Assets', description: 'Fixed Asset Management - Assets, Depreciation, Maintenance' },
        { name: 'Analytics', description: 'Business Intelligence - Dashboard KPIs, Revenue Analytics, Metrics' },
        { name: 'Notifications', description: 'Notification Management' },
        { name: 'Catatan Pengeluaran', description: 'Accounting Periods, Kas Kecil, Kas Bank, and Jurnal Memorial' },
        { name: 'Voucher', description: 'Voucher Kas Kecil & Voucher Kas Bank with approval workflow' },
        { name: 'Laporan dan Jurnal Aset', description: 'Asset register, Jurnal Memori Aset, and Jurnal Penyusutan Aset' },
        { name: 'Integration', description: 'Third-party Integrations - Email (SendGrid), Payment (Xendit)' }
    ],
    paths: {
        // ==================== AUTH SERVICE ====================
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'User login',
                description: 'Authenticate user and receive JWT token',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Login successful',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginResponse' }
                            }
                        }
                    },
                    401: {
                        description: 'Invalid credentials',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },

        // ==================== USERS (Access Control) ====================
        '/api/users': {
            get: {
                tags: ['Users'],
                summary: 'List all users',
                description: 'Get paginated list of users. Add ?page=1&limit=10 for pagination.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Items per page' }
                ],
                responses: {
                    200: {
                        description: 'List of users (array when no pagination, or paginated object with data, total, page, limit, totalPages)',
                        content: {
                            'application/json': {
                                schema: {
                                    oneOf: [
                                        { type: 'array', items: { $ref: '#/components/schemas/User' } },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                                                total: { type: 'integer' },
                                                page: { type: 'integer' },
                                                limit: { type: 'integer' },
                                                totalPages: { type: 'integer' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Users'],
                summary: 'Create new user',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserCreateInput' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'User created successfully',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
                    },
                    400: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    409: { description: 'Username already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/users/{id}': {
            get: {
                tags: ['Users'],
                summary: 'Get user by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID (e.g. user-1)' }
                ],
                responses: {
                    200: {
                        description: 'User details',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
                    },
                    404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            },
            put: {
                tags: ['Users'],
                summary: 'Update user',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID (e.g. user-1)' }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserUpdateInput' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'User updated successfully',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
                    },
                    404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            },
            delete: {
                tags: ['Users'],
                summary: 'Delete user',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID (e.g. user-1)' }
                ],
                responses: {
                    204: { description: 'User deleted successfully' },
                    404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },

        // ==================== ROLES (Access Control) ====================
        '/api/roles': {
            get: {
                tags: ['Roles'],
                summary: 'List all roles',
                description: 'Get paginated list of roles. Add ?page=1&limit=10 for pagination.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Items per page' }
                ],
                responses: {
                    200: {
                        description: 'List of roles (array when no pagination, or paginated object with data, total, page, limit, totalPages)',
                        content: {
                            'application/json': {
                                schema: {
                                    oneOf: [
                                        { type: 'array', items: { $ref: '#/components/schemas/Role' } },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { type: 'array', items: { $ref: '#/components/schemas/Role' } },
                                                total: { type: 'integer' },
                                                page: { type: 'integer' },
                                                limit: { type: 'integer' },
                                                totalPages: { type: 'integer' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Roles'],
                summary: 'Create new role',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RoleCreateInput' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Role created successfully',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } }
                    },
                    400: { description: 'Validation failed (e.g. code already exists)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/roles/{id}': {
            get: {
                tags: ['Roles'],
                summary: 'Get role by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Role ID (e.g. role-1)' }
                ],
                responses: {
                    200: {
                        description: 'Role details',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } }
                    },
                    404: { description: 'Role not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            },
            put: {
                tags: ['Roles'],
                summary: 'Update role',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Role ID (e.g. role-1)' }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RoleUpdateInput' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Role updated successfully',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } }
                    },
                    404: { description: 'Role not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            },
            delete: {
                tags: ['Roles'],
                summary: 'Delete role',
                description: 'Cannot delete a role that has users assigned. Reassign or remove users first.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Role ID (e.g. role-1)' }
                ],
                responses: {
                    204: { description: 'Role deleted successfully' },
                    404: { description: 'Role not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    409: { description: 'Role in use - users are assigned to this role', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },

        // ==================== CRM SERVICE ====================
        '/api/crm/leads': {
            get: {
                tags: ['CRM'],
                summary: 'List all leads',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of leads',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Lead' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['CRM'],
                summary: 'Create new lead',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Lead' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Lead created successfully' }
                }
            }
        },

        // ==================== HR SERVICE ====================
        '/api/hr/employees': {
            get: {
                tags: ['HR'],
                summary: 'List all employees',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of employees',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Employee' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['HR'],
                summary: 'Create new employee',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Employee' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Employee created successfully' }
                }
            }
        },
        '/api/hr/leave/apply': {
            post: {
                tags: ['HR'],
                summary: 'Apply for leave',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LeaveApplication' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Leave application submitted' }
                }
            }
        },

        // ==================== FINANCE SERVICE ====================
        '/api/finance/invoices': {
            get: {
                tags: ['Finance'],
                summary: 'List all invoices',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of invoices',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Invoice' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Finance'],
                summary: 'Create new invoice',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Invoice' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Invoice created successfully' }
                }
            }
        },

        // ==================== ACCOUNTING SERVICE ====================
        '/api/accounting/accounts': {
            get: {
                tags: ['Accounting'],
                summary: 'List all accounts (Chart of Accounts)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Chart of accounts',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Account' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Accounting'],
                summary: 'Create new account',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Account' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Account created successfully' }
                }
            }
        },
        '/api/accounting/journal-entries': {
            get: {
                tags: ['Accounting'],
                summary: 'List all journal entries',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of journal entries',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/JournalEntry' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Accounting'],
                summary: 'Create new journal entry',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/JournalEntry' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Journal entry created successfully' }
                }
            }
        },

        // ==================== ACCOUNTING REPORTS ====================
        '/api/accounting/reports/balance-sheet': {
            get: {
                tags: ['Accounting Reports'],
                summary: 'Generate Balance Sheet',
                description: 'Get balance sheet report showing assets, liabilities, and equity',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'asOfDate',
                        in: 'query',
                        description: 'Report date (YYYY-MM-DD)',
                        schema: { type: 'string', format: 'date' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Balance sheet report',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/BalanceSheet' }
                            }
                        }
                    }
                }
            }
        },
        '/api/accounting/reports/income-statement': {
            get: {
                tags: ['Accounting Reports'],
                summary: 'Generate Income Statement (P&L)',
                description: 'Get profit and loss statement for a period',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'startDate',
                        in: 'query',
                        description: 'Period start date (YYYY-MM-DD)',
                        schema: { type: 'string', format: 'date' }
                    },
                    {
                        name: 'endDate',
                        in: 'query',
                        description: 'Period end date (YYYY-MM-DD)',
                        schema: { type: 'string', format: 'date' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Income statement report',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        reportName: { type: 'string' },
                                        period: {
                                            type: 'object',
                                            properties: {
                                                startDate: { type: 'string' },
                                                endDate: { type: 'string' }
                                            }
                                        },
                                        revenue: { type: 'object' },
                                        expenses: { type: 'object' },
                                        netIncome: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/accounting/reports/trial-balance': {
            get: {
                tags: ['Accounting Reports'],
                summary: 'Generate Trial Balance',
                description: 'Get trial balance showing all account balances',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'asOfDate',
                        in: 'query',
                        description: 'Report date (YYYY-MM-DD)',
                        schema: { type: 'string', format: 'date' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Trial balance report',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        reportName: { type: 'string' },
                                        asOfDate: { type: 'string' },
                                        accounts: { type: 'array' },
                                        totals: {
                                            type: 'object',
                                            properties: {
                                                debit: { type: 'number' },
                                                credit: { type: 'number' },
                                                balanced: { type: 'boolean' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/accounting/reports/general-ledger': {
            get: {
                tags: ['Accounting Reports'],
                summary: 'Generate General Ledger',
                description: 'Get detailed general ledger with transaction history',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'startDate',
                        in: 'query',
                        description: 'Period start date (YYYY-MM-DD)',
                        schema: { type: 'string', format: 'date' }
                    },
                    {
                        name: 'endDate',
                        in: 'query',
                        description: 'Period end date (YYYY-MM-DD)',
                        schema: { type: 'string', format: 'date' }
                    },
                    {
                        name: 'accountId',
                        in: 'query',
                        description: 'Filter by specific account ID',
                        schema: { type: 'integer' }
                    }
                ],
                responses: {
                    200: {
                        description: 'General ledger report',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        reportName: { type: 'string' },
                                        period: { type: 'object' },
                                        accountId: { type: 'string' },
                                        entries: { type: 'array' },
                                        totalEntries: { type: 'integer' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/accounting/reports/aged-receivables': {
            get: {
                tags: ['Accounting Reports'],
                summary: 'Generate Aged Receivables Report',
                description: 'Get accounts receivable aging report',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'asOfDate',
                        in: 'query',
                        description: 'Report date (YYYY-MM-DD)',
                        schema: { type: 'string', format: 'date' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Aged receivables report',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        reportName: { type: 'string' },
                                        asOfDate: { type: 'string' },
                                        aging: { type: 'object' },
                                        totalOutstanding: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/accounting/reports/aged-payables': {
            get: {
                tags: ['Accounting Reports'],
                summary: 'Generate Aged Payables Report',
                description: 'Get accounts payable aging report',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'asOfDate',
                        in: 'query',
                        description: 'Report date (YYYY-MM-DD)',
                        schema: { type: 'string', format: 'date' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Aged payables report',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        reportName: { type: 'string' },
                                        asOfDate: { type: 'string' },
                                        aging: { type: 'object' },
                                        totalPayables: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        // ==================== MANUFACTURING SERVICE ====================
        '/api/manufacturing/boms': {
            get: {
                tags: ['Manufacturing'],
                summary: 'List all BOMs',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of BOMs',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/BOM' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Manufacturing'],
                summary: 'Create new BOM',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/BOM' }
                        }
                    }
                },
                responses: {
                    201: { description: 'BOM created successfully' }
                }
            }
        },
        '/api/manufacturing/work-orders': {
            get: {
                tags: ['Manufacturing'],
                summary: 'List all work orders',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of work orders',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/WorkOrder' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Manufacturing'],
                summary: 'Create new work order',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/WorkOrder' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Work order created successfully' }
                }
            }
        },

        // ==================== ASSET SERVICE ====================
        '/api/assets': {
            get: {
                tags: ['Assets'],
                summary: 'List all assets',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of assets',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Asset' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Assets'],
                summary: 'Create new asset',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Asset' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Asset created successfully' }
                }
            }
        },

        // ==================== ANALYTICS SERVICE ====================
        '/api/analytics/dashboard': {
            get: {
                tags: ['Analytics'],
                summary: 'Get dashboard KPIs',
                description: 'Get comprehensive dashboard with KPIs from all modules (Finance, HR, Manufacturing, Inventory)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Dashboard KPIs',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/DashboardKPIs' }
                            }
                        }
                    }
                }
            }
        },
        '/api/analytics/revenue': {
            get: {
                tags: ['Analytics'],
                summary: 'Get revenue analytics',
                description: 'Get revenue analytics with period filtering (daily/monthly/yearly)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'period',
                        in: 'query',
                        description: 'Period type',
                        schema: { type: 'string', enum: ['daily', 'monthly', 'yearly'], default: 'monthly' }
                    },
                    {
                        name: 'year',
                        in: 'query',
                        description: 'Year filter',
                        schema: { type: 'integer' }
                    },
                    {
                        name: 'month',
                        in: 'query',
                        description: 'Month filter (1-12)',
                        schema: { type: 'integer', minimum: 1, maximum: 12 }
                    }
                ],
                responses: {
                    200: {
                        description: 'Revenue analytics data',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        period: { type: 'string' },
                                        year: { type: 'integer' },
                                        month: { type: 'integer' },
                                        data: { type: 'array' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/analytics/hr': {
            get: {
                tags: ['Analytics'],
                summary: 'Get HR metrics',
                description: 'Get HR metrics including employee count, attendance, leave, and payroll statistics',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'HR metrics',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        employees: { type: 'object' },
                                        attendance: { type: 'object' },
                                        leave: { type: 'object' },
                                        payroll: { type: 'object' },
                                        timestamp: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/analytics/inventory': {
            get: {
                tags: ['Analytics'],
                summary: 'Get inventory metrics',
                description: 'Get inventory metrics including stock value, alerts, and movement statistics',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Inventory metrics',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        stock: { type: 'object' },
                                        movement: { type: 'object' },
                                        alerts: { type: 'object' },
                                        timestamp: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/analytics/manufacturing': {
            get: {
                tags: ['Analytics'],
                summary: 'Get manufacturing metrics',
                description: 'Get manufacturing metrics including work orders, BOMs, job cards, and production efficiency',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Manufacturing metrics',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        workOrders: { type: 'object' },
                                        boms: { type: 'object' },
                                        jobCards: { type: 'object' },
                                        efficiency: { type: 'object' },
                                        timestamp: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        // ==================== INVENTORY SERVICE (extended) ====================
        '/api/inventory/products': {
            get: {
                tags: ['Inventory'],
                summary: 'List all products',
                description: 'Retrieve a list of all products in the inventory system',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of products',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'integer' },
                                            name: { type: 'string' },
                                            sku: { type: 'string' },
                                            unit: { type: 'string' },
                                            sellingPrice: { type: 'string' },
                                            costPrice: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Inventory'],
                summary: 'Create a new product',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'sku'],
                                properties: {
                                    name: { type: 'string', example: 'Widget A' },
                                    sku: { type: 'string', example: 'WGT-001' },
                                    unit: { type: 'string', example: 'pcs' },
                                    sellingPrice: { type: 'string', example: '50000' },
                                    costPrice: { type: 'string', example: '30000' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Product created successfully' }
                }
            }
        },
        '/api/inventory/products/{id}': {
            get: {
                tags: ['Inventory'],
                summary: 'Get product by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Product details' },
                    404: { description: 'Product not found' }
                }
            },
            put: {
                tags: ['Inventory'],
                summary: 'Update a product',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Product updated' }
                }
            },
            delete: {
                tags: ['Inventory'],
                summary: 'Delete a product',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Product deleted' }
                }
            }
        },
        '/api/inventory/stock/entry': {
            post: {
                tags: ['Inventory'],
                summary: 'Create a stock entry',
                description: 'Record stock receipt or stock issue for a product/warehouse',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['productId', 'warehouseId', 'quantity', 'type'],
                                properties: {
                                    productId: { type: 'integer' },
                                    warehouseId: { type: 'integer' },
                                    quantity: { type: 'number' },
                                    type: { type: 'string', enum: ['RECEIPT', 'ISSUE', 'TRANSFER'] },
                                    reference: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Stock entry created' }
                }
            }
        },
        '/api/inventory/stock/balance': {
            get: {
                tags: ['Inventory'],
                summary: 'Get stock balance',
                description: 'Get current stock balance for all products across warehouses',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Stock balance report' }
                }
            }
        },
        '/api/inventory/warehouses': {
            get: {
                tags: ['Inventory'],
                summary: 'List all warehouses',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of warehouses' }
                }
            },
            post: {
                tags: ['Inventory'],
                summary: 'Create a new warehouse',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name'],
                                properties: {
                                    name: { type: 'string', example: 'Warehouse Jakarta' },
                                    location: { type: 'string', example: 'Jakarta Utara' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Warehouse created' }
                }
            }
        },

        // ==================== FINANCE SERVICE (extended) ====================
        '/api/finance/overview': {
            get: {
                tags: ['Finance'],
                summary: 'Get finance overview',
                description: 'Retrieve financial overview including metrics (total revenue, operational expenses, net profit), revenue growth chart data, account balances, expense breakdown, and recent transactions. Requires FINANCE_ADMIN or SUPER_ADMIN role.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'from', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Start date (YYYY-MM-DD)' },
                    { name: 'to', in: 'query', schema: { type: 'string', format: 'date' }, description: 'End date (YYYY-MM-DD)' },
                    { name: 'period', in: 'query', schema: { type: 'string' }, description: 'Period filter' },
                    { name: 'currency', in: 'query', schema: { type: 'string' }, description: 'Currency code' }
                ],
                responses: {
                    200: {
                        description: 'Finance overview data',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/FinanceOverviewResponse' }
                            }
                        }
                    },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    403: { description: 'Forbidden - requires FINANCE_ADMIN or SUPER_ADMIN', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/clients': {
            get: {
                tags: ['Finance'],
                summary: 'List all clients',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of clients' }
                }
            },
            post: {
                tags: ['Finance'],
                summary: 'Create a new client',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name'],
                                properties: {
                                    name: { type: 'string', example: 'PT ABC Indonesia' },
                                    email: { type: 'string', example: 'finance@abc.co.id' },
                                    phone: { type: 'string' },
                                    address: { type: 'string' },
                                    npwp: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Client created successfully' }
                }
            }
        },
        '/api/finance/clients/{id}': {
            get: {
                tags: ['Finance'],
                summary: 'Get client by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Client details' },
                    404: { description: 'Client not found' }
                }
            },
            put: {
                tags: ['Finance'],
                summary: 'Update a client',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Client updated' }
                }
            },
            patch: {
                tags: ['Finance'],
                summary: 'Partially update a client',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Client updated' }
                }
            },
            delete: {
                tags: ['Finance'],
                summary: 'Delete a client',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Client deleted' }
                }
            }
        },
        '/api/finance/quotations': {
            get: {
                tags: ['Finance'],
                summary: 'List all quotations',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of quotations' }
                }
            },
            post: {
                tags: ['Finance'],
                summary: 'Create a new quotation',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    201: { description: 'Quotation created' }
                }
            }
        },
        '/api/finance/quotations/{id}': {
            get: {
                tags: ['Finance'],
                summary: 'Get quotation by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Quotation details' },
                    404: { description: 'Quotation not found' }
                }
            },
            put: {
                tags: ['Finance'],
                summary: 'Update a quotation',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Quotation updated' }
                }
            },
            patch: {
                tags: ['Finance'],
                summary: 'Partially update a quotation',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Quotation updated' }
                }
            },
            delete: {
                tags: ['Finance'],
                summary: 'Delete a quotation',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Quotation deleted' }
                }
            }
        },
        '/api/finance/quotations/{id}/pdf': {
            get: {
                tags: ['Finance'],
                summary: 'Download quotation as PDF',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'PDF file', content: { 'application/pdf': {} } }
                }
            }
        },
        '/api/finance/invoices/{id}': {
            get: {
                tags: ['Finance'],
                summary: 'Get invoice by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Invoice details' },
                    404: { description: 'Invoice not found' }
                }
            },
            put: {
                tags: ['Finance'],
                summary: 'Update an invoice',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Invoice updated' }
                }
            },
            delete: {
                tags: ['Finance'],
                summary: 'Delete an invoice',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Invoice deleted' }
                }
            }
        },
        '/api/finance/invoices/{id}/pdf': {
            get: {
                tags: ['Finance'],
                summary: 'Download invoice as PDF',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'PDF file', content: { 'application/pdf': {} } }
                }
            }
        },
        '/api/finance/invoices/{invoiceId}/payments': {
            get: {
                tags: ['Finance'],
                summary: 'List payments for an invoice',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'invoiceId', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'List of payments for the invoice' }
                }
            }
        },
        '/api/finance/invoices/{id}/lock': {
            post: {
                tags: ['Finance'],
                summary: 'Lock invoice PDF',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Invoice PDF locked' }
                }
            }
        },
        '/api/finance/invoices/{id}/revise': {
            post: {
                tags: ['Finance'],
                summary: 'Create invoice revision',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Invoice revision created' }
                }
            }
        },
        '/api/finance/invoices/{id}/status': {
            patch: {
                tags: ['Finance'],
                summary: 'Update invoice status',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Invoice status updated' }
                }
            }
        },
        '/api/finance/payments': {
            get: {
                tags: ['Finance'],
                summary: 'List all payments',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of payments' }
                }
            },
            post: {
                tags: ['Finance'],
                summary: 'Record a payment',
                description: 'Record a payment against an invoice',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['invoiceId', 'amount'],
                                properties: {
                                    invoiceId: { type: 'integer' },
                                    amount: { type: 'number' },
                                    paymentMethod: { type: 'string', enum: ['BANK_TRANSFER', 'CASH', 'CREDIT_CARD', 'E_WALLET'] },
                                    reference: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Payment recorded' }
                }
            }
        },
        '/api/finance/payments/{id}': {
            get: {
                tags: ['Finance'],
                summary: 'Get payment by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Payment details' },
                    404: { description: 'Payment not found' }
                }
            }
        },
        '/api/finance/payments/overview': {
            get: {
                tags: ['Finance'],
                summary: 'Get payments overview',
                description: 'Retrieve payment summary and statistics',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Payments overview data' }
                }
            }
        },
        '/api/finance/transactions': {
            get: {
                tags: ['Finance'],
                summary: 'List all finance transactions',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by entity or category' },
                    { name: 'type', in: 'query', schema: { type: 'string', enum: ['inbound', 'outbound'] } },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['Completed', 'Pending', 'Processing'] } }
                ],
                responses: {
                    200: { description: 'List of finance transactions' }
                }
            },
            post: {
                tags: ['Finance'],
                summary: 'Create a finance transaction',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    201: { description: 'Transaction created' }
                }
            }
        },
        '/api/finance/transactions/{transactionId}': {
            get: {
                tags: ['Finance'],
                summary: 'Get transaction by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'transactionId', in: 'path', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: { description: 'Transaction details' },
                    404: { description: 'Transaction not found' }
                }
            },
            put: {
                tags: ['Finance'],
                summary: 'Update a finance transaction',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'transactionId', in: 'path', required: true, schema: { type: 'string' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Transaction updated' }
                }
            },
            delete: {
                tags: ['Finance'],
                summary: 'Delete a finance transaction',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'transactionId', in: 'path', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: { description: 'Transaction deleted' }
                }
            }
        },
        '/api/finance/purchase-orders': {
            get: {
                tags: ['Finance'],
                summary: 'List all purchase orders',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of purchase orders' }
                }
            },
            post: {
                tags: ['Finance'],
                summary: 'Create a purchase order',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    201: { description: 'Purchase order created' }
                }
            }
        },
        '/api/finance/purchase-orders/{id}': {
            get: {
                tags: ['Finance'],
                summary: 'Get purchase order by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Purchase order details' },
                    404: { description: 'Purchase order not found' }
                }
            },
            put: {
                tags: ['Finance'],
                summary: 'Update a purchase order',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Purchase order updated' }
                }
            },
            patch: {
                tags: ['Finance'],
                summary: 'Partially update a purchase order',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Purchase order updated' }
                }
            },
            delete: {
                tags: ['Finance'],
                summary: 'Delete a purchase order',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Purchase order deleted' }
                }
            }
        },
        '/api/finance/purchase-orders/{id}/pdf': {
            get: {
                tags: ['Finance'],
                summary: 'Download purchase order as PDF',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'PDF file', content: { 'application/pdf': {} } }
                }
            }
        },
        '/api/finance/expenses': {
            get: {
                tags: ['Finance'],
                summary: 'List all expenses',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of expenses' }
                }
            },
            post: {
                tags: ['Finance'],
                summary: 'Create an expense',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    201: { description: 'Expense created' }
                }
            }
        },
        '/api/finance/expenses/{id}/status': {
            patch: {
                tags: ['Finance'],
                summary: 'Update expense status',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Expense status updated' }
                }
            }
        },
        '/api/finance/expenses/{id}/post': {
            post: {
                tags: ['Finance'],
                summary: 'Post expense to accounting',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Expense posted' }
                }
            }
        },
        '/api/finance/basts': {
            get: {
                tags: ['Finance'],
                summary: 'List all BASTs (Berita Acara Serah Terima)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of BASTs' }
                }
            },
            post: {
                tags: ['Finance'],
                summary: 'Create a BAST',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    201: { description: 'BAST created' }
                }
            }
        },
        '/api/finance/basts/{id}': {
            get: {
                tags: ['Finance'],
                summary: 'Get BAST by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'BAST details' },
                    404: { description: 'BAST not found' }
                }
            },
            put: {
                tags: ['Finance'],
                summary: 'Update a BAST',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'BAST updated' }
                }
            },
            delete: {
                tags: ['Finance'],
                summary: 'Delete a BAST',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'BAST deleted' }
                }
            }
        },
        '/api/finance/basts/{id}/pdf': {
            get: {
                tags: ['Finance'],
                summary: 'Download BAST as PDF',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'PDF file', content: { 'application/pdf': {} } }
                }
            }
        },
        '/api/finance/projects': {
            get: {
                tags: ['Finance'],
                summary: 'List all projects',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of projects' }
                }
            },
            post: {
                tags: ['Finance'],
                summary: 'Create a project',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    201: { description: 'Project created' }
                }
            }
        },
        '/api/finance/projects/{id}': {
            get: {
                tags: ['Finance'],
                summary: 'Get project by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Project details' },
                    404: { description: 'Project not found' }
                }
            },
            put: {
                tags: ['Finance'],
                summary: 'Update a project',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Project updated' }
                }
            },
            delete: {
                tags: ['Finance'],
                summary: 'Delete a project',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Project deleted' }
                }
            }
        },
        '/api/finance/tax-types': {
            get: {
                tags: ['Finance'],
                summary: 'List all tax types',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of tax types' }
                }
            },
            post: {
                tags: ['Finance'],
                summary: 'Create a tax type',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    201: { description: 'Tax type created' }
                }
            }
        },
        '/api/finance/tax-types/{id}': {
            get: {
                tags: ['Finance'],
                summary: 'Get tax type by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Tax type details' },
                    404: { description: 'Tax type not found' }
                }
            },
            put: {
                tags: ['Finance'],
                summary: 'Update a tax type',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Tax type updated' }
                }
            },
            delete: {
                tags: ['Finance'],
                summary: 'Delete a tax type',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Tax type deleted' }
                }
            }
        },
        '/api/finance/tax-types/{id}/pdf': {
            get: {
                tags: ['Finance'],
                summary: 'Download tax type PDF',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'PDF file', content: { 'application/pdf': {} } }
                }
            }
        },
        '/api/finance/proposal-penawaran': {
            get: {
                tags: ['Finance'],
                summary: 'List all proposal penawaran',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of proposal penawaran' }
                }
            },
            post: {
                tags: ['Finance'],
                summary: 'Create a proposal penawaran',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    201: { description: 'Proposal created' }
                }
            }
        },
        '/api/finance/proposal-penawaran/{id}': {
            get: {
                tags: ['Finance'],
                summary: 'Get proposal penawaran by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Proposal details' },
                    404: { description: 'Proposal not found' }
                }
            },
            put: {
                tags: ['Finance'],
                summary: 'Update a proposal penawaran',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    200: { description: 'Proposal updated' }
                }
            },
            delete: {
                tags: ['Finance'],
                summary: 'Delete a proposal penawaran',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Proposal deleted' }
                }
            }
        },
        '/api/finance/proposal-penawaran/{id}/pdf': {
            get: {
                tags: ['Finance'],
                summary: 'Download proposal penawaran as PDF',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'PDF file', content: { 'application/pdf': {} } }
                }
            }
        },

        // ==================== HR SERVICE (extended) ====================
        '/api/hr/employees/{nik}': {
            get: {
                tags: ['HR'],
                summary: 'Get employee by NIK',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'nik', in: 'path', required: true, schema: { type: 'string' }, description: 'Employee NIK (unique identifier)' }
                ],
                responses: {
                    200: {
                        description: 'Employee details',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } }
                    },
                    404: { description: 'Employee not found' }
                }
            },
            patch: {
                tags: ['HR'],
                summary: 'Update employee',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'nik', in: 'path', required: true, schema: { type: 'string' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } }
                },
                responses: {
                    200: { description: 'Employee updated' }
                }
            },
            delete: {
                tags: ['HR'],
                summary: 'Delete employee',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'nik', in: 'path', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: { description: 'Employee deleted' }
                }
            }
        },
        '/api/hr/employees/import': {
            post: {
                tags: ['HR'],
                summary: 'Import employees from CSV',
                description: 'Bulk import employees from a CSV file upload',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary', description: 'CSV file with employee data' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Import completed' },
                    400: { description: 'Invalid CSV format' }
                }
            }
        },
        '/api/hr/attendance/log': {
            post: {
                tags: ['HR'],
                summary: 'Log attendance',
                description: 'Record clock-in or clock-out for an employee',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['employeeId', 'type'],
                                properties: {
                                    employeeId: { type: 'integer' },
                                    type: { type: 'string', enum: ['CLOCK_IN', 'CLOCK_OUT'] },
                                    timestamp: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Attendance logged' }
                }
            }
        },
        '/api/hr/attendance/{employeeId}': {
            get: {
                tags: ['HR'],
                summary: 'Get employee attendance records',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'employeeId', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Attendance records' }
                }
            }
        },
        '/api/hr/leave/balance/{employeeId}': {
            get: {
                tags: ['HR'],
                summary: 'Get leave balance',
                description: 'Get remaining leave balance for an employee by type',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'employeeId', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Leave balance details' }
                }
            }
        },
        '/api/hr/leave/applications/{id}/approve': {
            post: {
                tags: ['HR'],
                summary: 'Approve or reject leave application',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Leave application updated' }
                }
            }
        },
        '/api/hr/payroll/salary-structures': {
            get: {
                tags: ['HR'],
                summary: 'List salary structures',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of salary structures' }
                }
            }
        },
        '/api/hr/payroll/salary-slips': {
            get: {
                tags: ['HR'],
                summary: 'List salary slips',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of salary slips' }
                }
            },
            post: {
                tags: ['HR'],
                summary: 'Create a salary slip',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    201: { description: 'Salary slip created' }
                }
            }
        },
        '/api/hr/loans/apply': {
            post: {
                tags: ['HR'],
                summary: 'Apply for employee loan',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['employeeId', 'amount', 'purpose'],
                                properties: {
                                    employeeId: { type: 'integer' },
                                    amount: { type: 'number' },
                                    purpose: { type: 'string' },
                                    tenureMonths: { type: 'integer' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Loan application submitted' }
                }
            }
        },
        '/api/hr/shifts': {
            get: {
                tags: ['HR'],
                summary: 'List all shifts',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of shifts' }
                }
            },
            post: {
                tags: ['HR'],
                summary: 'Create a new shift',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'startTime', 'endTime'],
                                properties: {
                                    name: { type: 'string', example: 'Morning Shift' },
                                    startTime: { type: 'string', example: '08:00' },
                                    endTime: { type: 'string', example: '17:00' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Shift created' }
                }
            }
        },

        // ==================== CRM SERVICE (extended) ====================
        '/api/crm/leads/{id}': {
            patch: {
                tags: ['CRM'],
                summary: 'Update a lead',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Lead' } } }
                },
                responses: {
                    200: { description: 'Lead updated' }
                }
            },
            delete: {
                tags: ['CRM'],
                summary: 'Delete a lead',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Lead deleted' }
                }
            }
        },
        '/api/crm/opportunities': {
            get: {
                tags: ['CRM'],
                summary: 'List all opportunities',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of opportunities' }
                }
            },
            post: {
                tags: ['CRM'],
                summary: 'Create a new opportunity',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object' } } }
                },
                responses: {
                    201: { description: 'Opportunity created' }
                }
            }
        },

        // ==================== INTEGRATION SERVICE ====================
        '/api/integration/email/send': {
            post: {
                tags: ['Integration'],
                summary: 'Send an email via SendGrid',
                description: 'Send an email using the SendGrid API. If the API key is not configured, the email is queued for later delivery.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['to', 'subject', 'body'],
                                properties: {
                                    to: { type: 'string', example: 'client@example.com' },
                                    subject: { type: 'string', example: 'Invoice #INV-2026-001' },
                                    body: { type: 'string', description: 'HTML email body' },
                                    attachments: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                content: { type: 'string', description: 'Base64-encoded content' },
                                                filename: { type: 'string' },
                                                type: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Email sent successfully' },
                    202: { description: 'Email queued for later delivery' },
                    400: { description: 'Missing required fields' }
                }
            }
        },
        '/api/integration/payment/create-link': {
            post: {
                tags: ['Integration'],
                summary: 'Create Xendit payment link',
                description: 'Create a Xendit payment link for an internal invoice',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['invoiceId', 'amount'],
                                properties: {
                                    invoiceId: { type: 'integer' },
                                    invoiceNumber: { type: 'string', example: 'INV-2026-001' },
                                    amount: { type: 'number', example: 15000000 },
                                    currency: { type: 'string', default: 'IDR' },
                                    description: { type: 'string' },
                                    customerEmail: { type: 'string' },
                                    customerName: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Payment link created' },
                    400: { description: 'Missing required fields' },
                    500: { description: 'Xendit API error' }
                }
            }
        },
        '/api/integration/payment/webhook/xendit': {
            post: {
                tags: ['Integration'],
                summary: 'Xendit payment webhook',
                description: 'Receives Xendit payment callback. Verifies callback token and updates invoice status.',
                parameters: [
                    { name: 'x-callback-token', in: 'header', schema: { type: 'string' }, description: 'Xendit verification token' }
                ],
                responses: {
                    200: { description: 'Webhook acknowledged' },
                    401: { description: 'Invalid callback token' }
                }
            }
        },

        // ─── Accounting Periods ────────────────────────────────────────────────────
        '/api/finance/accounting-periods': {
            get: {
                tags: ['Catatan Pengeluaran'],
                summary: 'List all accounting periods',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of periods', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AccountingPeriod' } } } } },
                    401: { description: 'Unauthorized' }
                }
            },
            post: {
                tags: ['Catatan Pengeluaran'],
                summary: 'Create an accounting period',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { type: 'object', required: ['year', 'month'], properties: { year: { type: 'integer', example: 2026 }, month: { type: 'integer', example: 3 } } }
                        }
                    }
                },
                responses: {
                    201: { description: 'Period created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountingPeriod' } } } },
                    400: { description: 'Validation error or duplicate period', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/accounting-periods/{id}': {
            get: {
                tags: ['Catatan Pengeluaran'],
                summary: 'Get accounting period by ID',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Period details', content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountingPeriod' } } } },
                    404: { description: 'Period not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/accounting-periods/{id}/close': {
            post: {
                tags: ['Catatan Pengeluaran'],
                summary: 'Close an accounting period',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Period closed', content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountingPeriod' } } } },
                    400: { description: 'Period is not open', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/accounting-periods/{id}/reopen': {
            post: {
                tags: ['Catatan Pengeluaran'],
                summary: 'Reopen a closed accounting period',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', example: 'Data entry correction' } } }
                        }
                    }
                },
                responses: {
                    200: { description: 'Period reopened', content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountingPeriod' } } } },
                    400: { description: 'Period cannot be reopened', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/accounting-periods/{id}/lock': {
            post: {
                tags: ['Catatan Pengeluaran'],
                summary: 'Lock a closed accounting period',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Period locked', content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountingPeriod' } } } },
                    400: { description: 'Period must be closed before locking', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },

        // ─── Kas Kecil ─────────────────────────────────────────────────────────────
        '/api/finance/kas-kecil': {
            get: {
                tags: ['Catatan Pengeluaran'],
                summary: 'List kas kecil transactions for a period',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'periodId', in: 'query', schema: { type: 'integer' }, description: 'Period ID' },
                    { name: 'month', in: 'query', schema: { type: 'integer' }, description: 'Month (1-12)' },
                    { name: 'year', in: 'query', schema: { type: 'integer' }, description: 'Year (e.g. 2026)' }
                ],
                responses: {
                    200: {
                        description: 'Transactions with summary',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        periodId: { type: 'integer' },
                                        summary: { type: 'object', properties: { totalDebit: { type: 'number' }, totalCredit: { type: 'number' }, closingBalance: { type: 'number' } } },
                                        transactions: { type: 'array', items: { $ref: '#/components/schemas/KasKecilTransaction' } }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Missing period params', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            },
            post: {
                tags: ['Catatan Pengeluaran'],
                summary: 'Create a kas kecil transaction',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object', required: ['periodId', 'date', 'description'],
                                properties: {
                                    periodId: { type: 'integer' }, date: { type: 'string', format: 'date' },
                                    description: { type: 'string' }, debit: { type: 'number', default: 0 },
                                    credit: { type: 'number', default: 0 }, attachmentUrl: { type: 'string', nullable: true }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Transaction created', content: { 'application/json': { schema: { $ref: '#/components/schemas/KasKecilTransaction' } } } },
                    400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/kas-kecil/{id}': {
            get: {
                tags: ['Catatan Pengeluaran'], summary: 'Get kas kecil transaction by ID', security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Transaction', content: { 'application/json': { schema: { $ref: '#/components/schemas/KasKecilTransaction' } } } }, 404: { description: 'Not found' } }
            },
            put: {
                tags: ['Catatan Pengeluaran'], summary: 'Update kas kecil transaction', security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { date: { type: 'string', format: 'date' }, description: { type: 'string' }, debit: { type: 'number' }, credit: { type: 'number' } } } } } },
                responses: { 200: { description: 'Updated transaction', content: { 'application/json': { schema: { $ref: '#/components/schemas/KasKecilTransaction' } } } } }
            },
            delete: {
                tags: ['Catatan Pengeluaran'], summary: 'Delete kas kecil transaction', security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 204: { description: 'Deleted' }, 400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } }
            }
        },

        // ─── Kas Bank ──────────────────────────────────────────────────────────────
        '/api/finance/kas-bank': {
            get: {
                tags: ['Catatan Pengeluaran'],
                summary: 'List kas bank transactions for a period',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'periodId', in: 'query', schema: { type: 'integer' } },
                    { name: 'month', in: 'query', schema: { type: 'integer' } },
                    { name: 'year', in: 'query', schema: { type: 'integer' } },
                    { name: 'coaAccount', in: 'query', schema: { type: 'string' }, description: 'Filter by COA account code' }
                ],
                responses: {
                    200: {
                        description: 'Transactions with summary',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        periodId: { type: 'integer' },
                                        summary: { type: 'object', properties: { totalInflow: { type: 'number' }, totalOutflow: { type: 'number' }, closingBalance: { type: 'number' } } },
                                        transactions: { type: 'array', items: { $ref: '#/components/schemas/KasBankTransaction' } }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Catatan Pengeluaran'],
                summary: 'Create a kas bank transaction',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object', required: ['periodId', 'date', 'coaAccount', 'description'],
                                properties: {
                                    periodId: { type: 'integer' }, date: { type: 'string', format: 'date' },
                                    coaAccount: { type: 'string' }, description: { type: 'string' },
                                    inflow: { type: 'number', default: 0 }, outflow: { type: 'number', default: 0 },
                                    reference: { type: 'string', nullable: true }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Transaction created', content: { 'application/json': { schema: { $ref: '#/components/schemas/KasBankTransaction' } } } },
                    400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/kas-bank/{id}': {
            get: {
                tags: ['Catatan Pengeluaran'], summary: 'Get kas bank transaction by ID', security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Transaction', content: { 'application/json': { schema: { $ref: '#/components/schemas/KasBankTransaction' } } } }, 404: { description: 'Not found' } }
            },
            put: {
                tags: ['Catatan Pengeluaran'], summary: 'Update kas bank transaction', security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { date: { type: 'string', format: 'date' }, coaAccount: { type: 'string' }, description: { type: 'string' }, inflow: { type: 'number' }, outflow: { type: 'number' }, reference: { type: 'string' } } } } } },
                responses: { 200: { description: 'Updated transaction', content: { 'application/json': { schema: { $ref: '#/components/schemas/KasBankTransaction' } } } } }
            },
            delete: {
                tags: ['Catatan Pengeluaran'], summary: 'Delete kas bank transaction', security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 204: { description: 'Deleted' }, 400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } }
            }
        },

        // ─── Jurnal Memorial ───────────────────────────────────────────────────────
        '/api/finance/jurnal-memorial': {
            get: {
                tags: ['Catatan Pengeluaran'],
                summary: 'List jurnal memorial for a period',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'periodId', in: 'query', schema: { type: 'integer' } },
                    { name: 'month', in: 'query', schema: { type: 'integer' } },
                    { name: 'year', in: 'query', schema: { type: 'integer' } }
                ],
                responses: {
                    200: {
                        description: 'Journals list',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        periodId: { type: 'integer' },
                                        journals: { type: 'array', items: { $ref: '#/components/schemas/JurnalMemorial' } }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Catatan Pengeluaran'],
                summary: 'Create a jurnal memorial entry',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object', required: ['periodId', 'date', 'description', 'lines'],
                                properties: {
                                    periodId: { type: 'integer' }, date: { type: 'string', format: 'date' },
                                    description: { type: 'string' },
                                    lines: {
                                        type: 'array', minItems: 2,
                                        items: { type: 'object', required: ['accountNumber', 'accountName'], properties: { accountNumber: { type: 'string' }, accountName: { type: 'string' }, debit: { type: 'number' }, credit: { type: 'number' }, lineDescription: { type: 'string', nullable: true } } }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Journal created', content: { 'application/json': { schema: { $ref: '#/components/schemas/JurnalMemorial' } } } },
                    400: { description: 'Validation error or unbalanced journal', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/jurnal-memorial/{id}': {
            get: {
                tags: ['Catatan Pengeluaran'], summary: 'Get jurnal memorial by ID', security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Journal with lines', content: { 'application/json': { schema: { $ref: '#/components/schemas/JurnalMemorial' } } } }, 404: { description: 'Not found' } }
            },
            put: {
                tags: ['Catatan Pengeluaran'], summary: 'Update jurnal memorial (DRAFT only)', security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { date: { type: 'string', format: 'date' }, description: { type: 'string' }, lines: { type: 'array', items: { $ref: '#/components/schemas/JurnalMemorialLine' } } } } } } },
                responses: { 200: { description: 'Updated journal', content: { 'application/json': { schema: { $ref: '#/components/schemas/JurnalMemorial' } } } }, 400: { description: 'Cannot edit posted journal', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } }
            },
            delete: {
                tags: ['Catatan Pengeluaran'], summary: 'Delete jurnal memorial (DRAFT only)', security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 204: { description: 'Deleted' }, 400: { description: 'Cannot delete posted journal', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } }
            }
        },
        '/api/finance/jurnal-memorial/{id}/post': {
            post: {
                tags: ['Catatan Pengeluaran'],
                summary: 'Post a jurnal memorial (DRAFT → POSTED)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Journal posted', content: { 'application/json': { schema: { $ref: '#/components/schemas/JurnalMemorial' } } } },
                    400: { description: 'Journal already posted or not balanced', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },

        // ─── Voucher ─────────────────────────────────────────────────────────────────
        '/api/finance/vouchers': {
            get: {
                tags: ['Voucher'],
                summary: 'List vouchers by period',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'periodId', in: 'query', schema: { type: 'integer' }, description: 'Period ID (or use month+year)' },
                    { name: 'month', in: 'query', schema: { type: 'integer' } },
                    { name: 'year', in: 'query', schema: { type: 'integer' } },
                    { name: 'type', in: 'query', schema: { type: 'string', enum: ['KAS_KECIL', 'KAS_BANK'] } }
                ],
                responses: {
                    200: {
                        description: 'Voucher list for period',
                        content: { 'application/json': { schema: { type: 'object', properties: {
                            periodId: { type: 'integer' },
                            vouchers: { type: 'array', items: { $ref: '#/components/schemas/Voucher' } }
                        }}}}
                    }
                }
            },
            post: {
                tags: ['Voucher'],
                summary: 'Create a new voucher',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['periodId', 'voucherType', 'date', 'payee', 'description', 'lines'],
                                properties: {
                                    periodId: { type: 'integer', example: 1 },
                                    voucherType: { type: 'string', enum: ['KAS_KECIL', 'KAS_BANK'], example: 'KAS_KECIL' },
                                    date: { type: 'string', format: 'date', example: '2026-03-09' },
                                    payee: { type: 'string', example: 'PT. ATK Supplier' },
                                    description: { type: 'string', example: 'Pembelian perlengkapan kantor' },
                                    paymentMethod: { type: 'string', nullable: true, example: 'Tunai' },
                                    receivedBy: { type: 'string', nullable: true },
                                    attachmentUrl: { type: 'string', nullable: true },
                                    lines: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            required: ['accountNumber', 'accountName'],
                                            properties: {
                                                accountNumber: { type: 'string', example: '5-1100' },
                                                accountName: { type: 'string', example: 'Beban ATK' },
                                                description: { type: 'string', nullable: true },
                                                debit: { type: 'number', example: 500000 },
                                                credit: { type: 'number', example: 0 }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Voucher created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Voucher' } } } },
                    400: { description: 'Validation error or unbalanced lines', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/vouchers/{id}': {
            get: {
                tags: ['Voucher'],
                summary: 'Get voucher by ID',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Voucher with lines', content: { 'application/json': { schema: { $ref: '#/components/schemas/Voucher' } } } },
                    404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            },
            put: {
                tags: ['Voucher'],
                summary: 'Update voucher (DRAFT only)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
                responses: {
                    200: { description: 'Voucher updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Voucher' } } } },
                    400: { description: 'Not in DRAFT status or validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            },
            delete: {
                tags: ['Voucher'],
                summary: 'Delete voucher (DRAFT/CANCELLED only)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    204: { description: 'Deleted' },
                    400: { description: 'Cannot delete', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/vouchers/{id}/submit': {
            post: {
                tags: ['Voucher'],
                summary: 'Submit voucher (DRAFT → SUBMITTED)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Voucher submitted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Voucher' } } } },
                    400: { description: 'Not in DRAFT status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/vouchers/{id}/review': {
            post: {
                tags: ['Voucher'],
                summary: 'Review voucher (SUBMITTED → REVIEWED)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Voucher reviewed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Voucher' } } } },
                    400: { description: 'Not in SUBMITTED status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/vouchers/{id}/approve': {
            post: {
                tags: ['Voucher'],
                summary: 'Approve voucher (REVIEWED → APPROVED)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Voucher approved', content: { 'application/json': { schema: { $ref: '#/components/schemas/Voucher' } } } },
                    400: { description: 'Not in REVIEWED status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/vouchers/{id}/pay': {
            post: {
                tags: ['Voucher'],
                summary: 'Mark voucher as paid (APPROVED → PAID)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Voucher paid', content: { 'application/json': { schema: { $ref: '#/components/schemas/Voucher' } } } },
                    400: { description: 'Not in APPROVED status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/vouchers/{id}/reject': {
            post: {
                tags: ['Voucher'],
                summary: 'Reject voucher',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', example: 'Tidak sesuai anggaran' } } } } }
                },
                responses: {
                    200: { description: 'Voucher rejected', content: { 'application/json': { schema: { $ref: '#/components/schemas/Voucher' } } } },
                    400: { description: 'Already in final status or missing reason', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/vouchers/{id}/cancel': {
            post: {
                tags: ['Voucher'],
                summary: 'Cancel voucher (DRAFT/SUBMITTED → CANCELLED)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Voucher cancelled', content: { 'application/json': { schema: { $ref: '#/components/schemas/Voucher' } } } },
                    400: { description: 'Cannot cancel in current status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },

        // ─── Asset Service ────────────────────────────────────────────────────────────
        '/api/assets': {
            get: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'List all active assets',
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: 'Asset list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Asset' } } } } } }
            },
            post: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Create a new asset',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'category', 'purchaseDate', 'purchaseAmount'],
                                properties: {
                                    name: { type: 'string', example: 'Laptop Dell XPS 15' },
                                    category: { type: 'string', enum: ['BUILDING', 'MACHINERY', 'VEHICLES', 'FURNITURE', 'ELECTRONICS'] },
                                    purchaseDate: { type: 'string', example: '2026-01-15' },
                                    purchaseAmount: { type: 'number', example: 25000000 },
                                    salvageValue: { type: 'number', example: 2500000 },
                                    usefulLifeMonths: { type: 'integer', example: 60 },
                                    depreciationMethod: { type: 'string', enum: ['SLM', 'WDV', 'MANUAL'], example: 'SLM' },
                                    coaAssetAccount: { type: 'string', example: '1-2100' },
                                    coaDepreciationExpenseAccount: { type: 'string', example: '5-1100' },
                                    coaAccumulatedDepreciationAccount: { type: 'string', example: '1-2200' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Asset created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Asset' } } } },
                    400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/assets/{id}': {
            get: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Get asset by ID',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Asset', content: { 'application/json': { schema: { $ref: '#/components/schemas/Asset' } } } },
                    404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            },
            put: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Update asset',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
                responses: { 200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Asset' } } } } }
            },
            delete: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Soft-delete asset (status → SCRAPPED)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 204: { description: 'Deleted' } }
            }
        },

        // ─── Asset Acquisition Journals ───────────────────────────────────────────────
        '/api/finance/asset-acquisition-journals': {
            get: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'List asset acquisition journals by period',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'periodId', in: 'query', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Journal list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AssetAcquisitionJournal' } } } } } }
            },
            post: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Create asset acquisition journal (Jurnal Memori Aset)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['periodId', 'assetId', 'date', 'description', 'debitAccount', 'debitAccountName', 'creditAccount', 'creditAccountName', 'amount'],
                                properties: {
                                    periodId: { type: 'integer' },
                                    assetId: { type: 'integer' },
                                    date: { type: 'string', format: 'date' },
                                    description: { type: 'string' },
                                    debitAccount: { type: 'string', example: '1-2100' },
                                    debitAccountName: { type: 'string', example: 'Aset Tetap' },
                                    creditAccount: { type: 'string', example: '1-1100' },
                                    creditAccountName: { type: 'string', example: 'Kas' },
                                    amount: { type: 'number', example: 25000000 },
                                    notes: { type: 'string', nullable: true }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Journal created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetAcquisitionJournal' } } } },
                    400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/asset-acquisition-journals/{id}': {
            get: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Get asset acquisition journal by ID',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Journal', content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetAcquisitionJournal' } } } } }
            },
            put: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Update asset acquisition journal (DRAFT only)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
                responses: { 200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetAcquisitionJournal' } } } } }
            },
            delete: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Delete asset acquisition journal (DRAFT only)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 204: { description: 'Deleted' } }
            }
        },
        '/api/finance/asset-acquisition-journals/{id}/post': {
            post: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Post acquisition journal to general ledger (DRAFT → POSTED)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Journal posted', content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetAcquisitionJournal' } } } },
                    400: { description: 'Already posted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },

        // ─── Asset Depreciation Journals ─────────────────────────────────────────────
        '/api/finance/asset-depreciation-journals': {
            get: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'List asset depreciation journal entries by period',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'periodId', in: 'query', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Depreciation list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AssetDepreciationJournal' } } } } } }
            }
        },
        '/api/finance/asset-depreciation-journals/generate': {
            post: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Batch generate monthly depreciation for all active assets in a period',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object', required: ['periodId'], properties: { periodId: { type: 'integer', example: 1 } } } } }
                },
                responses: {
                    201: { description: 'Generation result', content: { 'application/json': { schema: { type: 'object', properties: { generated: { type: 'integer' }, skipped: { type: 'integer' }, message: { type: 'string' } } } } } },
                    400: { description: 'Period not open or not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/api/finance/asset-depreciation-journals/post-all': {
            post: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Post all DRAFT depreciation records for a period to general ledger',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object', required: ['periodId'], properties: { periodId: { type: 'integer', example: 1 } } } } }
                },
                responses: {
                    200: { description: 'Post result', content: { 'application/json': { schema: { type: 'object', properties: { posted: { type: 'integer' }, message: { type: 'string' } } } } } }
                }
            }
        },
        '/api/finance/asset-depreciation-journals/{id}': {
            delete: {
                tags: ['Laporan dan Jurnal Aset'],
                summary: 'Delete DRAFT depreciation entry (restores asset book value)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    204: { description: 'Deleted' },
                    400: { description: 'Cannot delete posted entry', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        }
    }
};
