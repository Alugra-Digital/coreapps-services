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
        }
    }
};
