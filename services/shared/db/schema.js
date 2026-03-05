import { pgTable, serial, text, timestamp, boolean, integer, jsonb, decimal, pgEnum, varchar, date } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID']);
export const poStatusEnum = pgEnum('po_status', ['DRAFT', 'APPROVED', 'SENT', 'RECEIVED']);
export const workflowStatusEnum = pgEnum('workflow_status', ['PENDING', 'APPROVED', 'REJECTED']);

// Employee-related enums
export const positionEnum = pgEnum('position', [
  'DIREKTUR',
  'Manajemen Operation',
  'Project Manager',
  'SA',
  'Secretary Office',
  'HR GA',
  'Finance Accounting',
  'Technical Writer',
  'Tenaga Ahli',
  'EOS Oracle',
  'EOS Ticketing',
  'EOS Unsoed'
]);

export const taxStatusEnum = pgEnum('tax_status', [
  'TK/0', 'TK/1', 'TK/2', 'TK/3',
  'K/0', 'K/1', 'K/2', 'K/3'
]);

export const maritalStatusEnum = pgEnum('marital_status_enum', ['Kawin', 'Belum Kawin']);
export const genderEnum = pgEnum('gender_enum', ['L', 'P']);

// Report-related enums
export const reportTypeEnum = pgEnum('report_type', ['financial', 'inventory', 'hr', 'sales', 'custom']);
export const reportFrequencyEnum = pgEnum('report_frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);

export const leadStatusEnum = pgEnum('lead_status', ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED']);
export const opportunityStageEnum = pgEnum('opportunity_stage', ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']);

export const accountTypeEnum = pgEnum('account_type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
export const journalEntryStatusEnum = pgEnum('journal_entry_status', ['DRAFT', 'POSTED', 'CANCELLED']);
export const salarySlipStatusEnum = pgEnum('salary_slip_status', ['DRAFT', 'POSTED', 'CANCELLED']);
export const expenseStatusEnum = pgEnum('expense_status', ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'REJECTED', 'CANCELLED']);
export const notificationTypeEnum = pgEnum('notification_type', ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'MENTION']);
export const emailStatusEnum = pgEnum('email_status', ['PENDING', 'SENT', 'FAILED']);
export const woStatusEnum = pgEnum('work_order_status', ['DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const jobCardStatusEnum = pgEnum('job_card_status', ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const qiStatusEnum = pgEnum('quality_inspection_status', ['PENDING', 'ACCEPTED', 'REJECTED']);

export const attendanceStatusEnum = pgEnum('attendance_status', ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY']);
export const loanStatusEnum = pgEnum('loan_status', ['DRAFT', 'APPROVED', 'ACTIVE', 'CLOSED', 'CANCELLED']);
export const leaveStatusEnum = pgEnum('leave_status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);

export const assetCategoryEnum = pgEnum('asset_category', ['BUILDING', 'MACHINERY', 'VEHICLES', 'FURNITURE', 'ELECTRONICS']);
export const depreciationMethodEnum = pgEnum('depreciation_method', ['SLM', 'WDV', 'MANUAL']);
export const assetStatusEnum = pgEnum('asset_status', ['ACTIVE', 'SOLD', 'SCRAPPED']);
export const maintenanceTypeEnum = pgEnum('maintenance_type', ['PREVENTIVE', 'CORRECTIVE', 'BREAKDOWN']);

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g., '1001'
  name: text('name').notNull(), // e.g., 'Cash on Hand'
  type: accountTypeEnum('type').notNull(),
  description: text('description'),
  balance: decimal('balance').default('0'),
  isGroup: boolean('is_group').default(false), // For hierarchy
  parentAccountId: integer('parent_account_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const journalEntries = pgTable('journal_entries', {
  id: serial('id').primaryKey(),
  date: timestamp('date').defaultNow(),
  description: text('description'),
  reference: text('reference'), // e.g., 'INV-001'
  status: journalEntryStatusEnum('status').default('DRAFT'),
  totalDebit: decimal('total_debit').default('0'),
  totalCredit: decimal('total_credit').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  postedAt: timestamp('posted_at'),
});

export const journalEntryLines = pgTable('journal_entry_lines', {
  id: serial('id').primaryKey(),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id).notNull(),
  accountId: integer('account_id').references(() => accounts.id).notNull(),
  debit: decimal('debit').default('0'),
  credit: decimal('credit').default('0'),
  description: text('description'),
  reference: text('reference'), // Optional line reference
});

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  status: leadStatusEnum('status').default('NEW'),
  source: text('source'), // e.g., 'Website', 'Referral'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const opportunities = pgTable('opportunities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g., "Big Deal with Acme"
  leadId: integer('lead_id').references(() => leads.id), // Optional, can be direct
  clientId: integer('client_id').references(() => clients.id), // If converted
  amount: decimal('amount').notNull().default('0'),
  probability: integer('probability').default(0), // 0-100%
  stage: opportunityStageEnum('stage').default('PROSPECTING'),
  expectedCloseDate: timestamp('expected_close_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  permissionKeys: jsonb('permission_keys').default('[]'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email'),
  fullName: text('full_name'),
  phone: text('phone'),
  bio: text('bio'),
  role: roleEnum('role').notNull(),
  roleId: integer('role_id').references(() => roles.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const organizationSettings = pgTable('organization_settings', {
  id: serial('id').primaryKey(),
  companyName: text('company_name'),
  companyEmail: text('company_email'),
  companyPhone: text('company_phone'),
  companyWebsite: text('company_website'),
  timezone: text('timezone').default('Asia/Jakarta'),
  currency: text('currency').default('IDR'),
  dateFormat: text('date_format').default('dd-mm-yyyy'),
  theme: text('theme').default('system'),
  emailNotifications: boolean('email_notifications').default(true),
  pushNotifications: boolean('push_notifications').default(false),
  securityAlerts: boolean('security_alerts').default(true),
  twoFactorAuth: boolean('two_factor_auth').default(false),
  sessionTimeout: text('session_timeout').default('30m'),
  autoAssignApprover: boolean('auto_assign_approver').default(true),
  dailyBackup: boolean('daily_backup').default(true),
  softDelete: boolean('soft_delete').default(true),
  compactMode: boolean('compact_mode').default(false),
  defaultApprovalFlow: text('default_approval_flow').default('sequential'),
  escalationSla: text('escalation_sla').default('24h'),
  retentionPeriod: text('retention_period').default('365d'),
  billingEmail: text('billing_email'),
  currentPlan: text('current_plan').default('enterprise'),
  config: jsonb('config').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const positions = pgTable('positions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  nik: text('nik').notNull().unique(),
  name: text('name').notNull(),
  ktp: varchar('ktp', { length: 20 }), // No. KTP (noKtp in API)
  noKk: text('no_kk'), // No. KK (Kartu Keluarga)
  npwp: varchar('npwp', { length: 20 }),
  ptkp: text('ptkp'),
  department: text('department'),
  position: positionEnum('position'),
  employmentType: text('employment_type'),

  // Employment details
  tmk: date('tmk').notNull(), // Tanggal Mulai Kerja (Employment Start Date)
  joinDate: timestamp('join_date'), // Keep for backward compatibility
  terminationDate: date('termination_date'), // Tanggal Keluar
  status: text('status').default('ACTIVE'),

  // Personal information
  email: varchar('email', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  placeOfBirth: varchar('place_of_birth', { length: 100 }),
  dateOfBirth: date('date_of_birth'),
  gender: genderEnum('gender'),
  religion: text('religion'),

  // Family & Tax
  maritalStatus: maritalStatusEnum('marital_status'),
  numberOfChildren: integer('number_of_children').default(0),
  taxStatus: taxStatusEnum('tax_status').notNull().default('TK/0'),
  educationLevel: varchar('education_level', { length: 100 }), // S1, S2, SMA, etc.

  // Address
  ktpAddress: text('ktp_address'),
  ktpCity: varchar('ktp_city', { length: 100 }),
  ktpProvince: varchar('ktp_province', { length: 100 }),

  // Banking
  bankName: varchar('bank_name', { length: 100 }).default('Mandiri'),
  bankAccountNumber: varchar('bank_account_number', { length: 50 }),
  bankAccount: text('bank_account'), // Keep for backward compatibility

  // Insurance
  bpjsKesehatan: text('bpjs_kesehatan'),
  bpjsKetenagakerjaan: text('bpjs_ketenagakerjaan'),
  jknNumber: varchar('jkn_number', { length: 50 }), // JKN/KIS Number
  jmsNumber: varchar('jms_number', { length: 50 }), // JMS Social Security Number

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const salaryStructures = pgTable('salary_structures', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull().unique(),
  baseSalary: decimal('base_salary').notNull().default('0'),
  allowances: decimal('allowances').notNull().default('0'),
  deductions: decimal('deductions').notNull().default('0'),
  taxRate: decimal('tax_rate').default('0'), // Percentage for custom cases
  salaryExpenseAccountId: integer('salary_expense_account_id').references(() => accounts.id),
  payrollPayableAccountId: integer('payroll_payable_account_id').references(() => accounts.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const salarySlips = pgTable('salary_slips', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  periodYear: integer('period_year').notNull(),
  periodMonth: integer('period_month').notNull(),
  gross: decimal('gross').notNull().default('0'),
  totalDeductions: decimal('total_deductions').notNull().default('0'),
  pph21: decimal('pph21').default('0'),
  loanRepayment: decimal('loan_repayment').default('0'),
  netPay: decimal('net_pay').notNull().default('0'),
  status: salarySlipStatusEnum('status').default('DRAFT'),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  postedAt: timestamp('posted_at'),
});

export const expenseClaims = pgTable('expense_claims', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  date: timestamp('date').defaultNow(),
  category: text('category'),
  description: text('description'),
  amount: decimal('amount').notNull().default('0'),
  status: expenseStatusEnum('status').default('DRAFT'),
  debitAccountId: integer('debit_account_id').references(() => accounts.id).notNull(),
  creditAccountId: integer('credit_account_id').references(() => accounts.id).notNull(),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  postedAt: timestamp('posted_at'),
});

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  companyName: text('company_name'),
  address: text('address'),
  email: text('email'),
  phone: text('phone'),
  npwp: text('npwp'),
  pic: jsonb('pic'),
  type: text('type').default('CUSTOMER'),
  paymentTerms: integer('payment_terms').default(30),
  taxId: text('tax_id'),
  isActive: boolean('is_active').default(true),
  contactType: text('contact_type').default('CUSTOMER'), // CUSTOMER | SUPPLIER | BOTH (CoreApps 2.0)
  bankName: text('bank_name'),
  bankAccount: text('bank_account'),
  bankBranch: text('bank_branch'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const quotations = pgTable('quotations', {
  id: serial('id').primaryKey(),
  number: text('number').notNull().unique(),
  clientId: integer('client_id').references(() => clients.id),
  projectId: integer('project_id').references(() => projects.id),
  date: timestamp('date').defaultNow(),
  items: jsonb('items').notNull(),
  subtotal: decimal('subtotal').notNull(),
  ppn: decimal('ppn').notNull(),
  grandTotal: decimal('grand_total').notNull(),
  scopeOfWork: text('scope_of_work'),
  status: text('status').default('DRAFT'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  number: text('number').notNull().unique(),
  quotationId: integer('quotation_id').references(() => quotations.id),
  clientId: integer('client_id').references(() => clients.id),
  projectId: integer('project_id').references(() => projects.id),
  terminId: integer('termin_id'),
  clientPurchaseOrderId: integer('client_purchase_order_id'),
  date: timestamp('date').defaultNow(),
  dueDate: timestamp('due_date'),
  items: jsonb('items').notNull(),
  subtotal: decimal('subtotal').notNull(),
  ppn: decimal('ppn').notNull(),
  pph: decimal('pph').default('0'),
  grandTotal: decimal('grand_total').notNull(),
  paidAmount: decimal('paid_amount').default('0'),
  status: invoiceStatusEnum('status').default('DRAFT'),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id),
  pdfLocked: boolean('pdf_locked').default(false),
  revisionNumber: integer('revision_number').default(0),
  lockedAt: timestamp('locked_at'),
  lockedBy: integer('locked_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const paymentEntries = pgTable('payment_entries', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id),
  date: timestamp('date').defaultNow(),
  amount: decimal('amount').notNull().default('0'),
  paymentMode: text('payment_mode').notNull(), // 'CASH', 'BANK'
  referenceNo: text('reference_no'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const transactionTypeEnum = pgEnum('finance_transaction_type', ['inbound', 'outbound']);
export const transactionStatusEnum = pgEnum('finance_transaction_status', ['Completed', 'Pending', 'Processing']);

export const financeTransactions = pgTable('finance_transactions', {
  id: serial('id').primaryKey(),
  transactionId: text('transaction_id').notNull().unique(), // e.g. TX-9012
  date: date('date').notNull(),
  entity: text('entity').notNull(),
  category: text('category').notNull(),
  amount: decimal('amount').notNull(),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const basts = pgTable('basts', {
  id: serial('id').primaryKey(),
  coverInfo: jsonb('cover_info').notNull(),
  documentInfo: jsonb('document_info').notNull(),
  deliveringParty: jsonb('delivering_party').notNull(),
  receivingParty: jsonb('receiving_party').notNull(),
  projectId: integer('project_id').references(() => projects.id),
  status: text('status').default('DRAFT'),
  linkedInvoiceIds: jsonb('linked_invoice_ids').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  identity: jsonb('identity').notNull(),
  documentRelations: jsonb('document_relations').default('{}'),
  finance: jsonb('finance').default('{}'),
  documents: jsonb('documents').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// CoreApps 2.0: Project module tables
export const projectTermins = pgTable('project_termins', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  terminNumber: integer('termin_number').notNull(),
  description: text('description'),
  percentage: decimal('percentage').notNull(),
  amount: decimal('amount').notNull().default('0'),
  dueDate: date('due_date'),
  status: text('status').default('SCHEDULED'),
  invoiceId: integer('invoice_id').references(() => invoices.id),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const projectExpenses = pgTable('project_expenses', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  category: text('category').notNull(),
  description: text('description'),
  amount: decimal('amount').notNull().default('0'),
  currency: text('currency').default('IDR'),
  date: date('date').notNull(),
  clientId: integer('client_id').references(() => clients.id),
  vendorPoId: text('vendor_po_id'),
  invoiceVendorNumber: text('invoice_vendor_number'),
  phase: text('phase').default('ON_GOING'), // PRE_COST | ON_GOING
  status: text('status').default('DRAFT'),
  submittedBy: integer('submitted_by').references(() => employees.id),
  approvedBy: integer('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
  rejectedReason: text('rejected_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const expenseAttachments = pgTable('expense_attachments', {
  id: serial('id').primaryKey(),
  expenseId: integer('expense_id').references(() => projectExpenses.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  size: integer('size'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  uploadedBy: integer('uploaded_by').references(() => employees.id),
});

export const projectMilestones = pgTable('project_milestones', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  targetDate: date('target_date'),
  completedDate: date('completed_date'),
  status: text('status').default('PENDING'),
  linkedTerminId: integer('linked_termin_id').references(() => projectTermins.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const projectStatusHistory = pgTable('project_status_history', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  fromStatus: text('from_status').notNull(),
  toStatus: text('to_status').notNull(),
  changedAt: timestamp('changed_at').defaultNow(),
  changedBy: integer('changed_by').references(() => employees.id),
  notes: text('notes'),
});

export const projectDocuments = pgTable('project_documents', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  url: text('url').notNull(),
  size: integer('size'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  uploadedBy: integer('uploaded_by').references(() => employees.id),
});

export const projectTeamMembers = pgTable('project_team_members', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  role: text('role').notNull(),
  assignedAt: date('assigned_at').defaultNow(),
  removedAt: date('removed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const clientPurchaseOrders = pgTable('client_purchase_orders', {
  id: serial('id').primaryKey(),
  cpoNumber: text('cpo_number').notNull(),
  internalReference: text('internal_reference'),
  projectId: integer('project_id').references(() => projects.id),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  linkedProposalId: integer('linked_proposal_id').references(() => proposalPenawaran.id),
  linkedProposalVersion: text('linked_proposal_version'),
  amount: decimal('amount').notNull().default('0'),
  currency: text('currency').default('IDR'),
  ppnIncluded: boolean('ppn_included').default(true),
  issuedDate: date('issued_date'),
  receivedDate: date('received_date'),
  validUntil: date('valid_until'),
  description: text('description'),
  paymentTerms: text('payment_terms'),
  status: text('status').default('RECEIVED'),
  attachmentUrl: text('attachment_url'),
  attachmentName: text('attachment_name'),
  verifiedBy: integer('verified_by').references(() => employees.id),
  verifiedAt: timestamp('verified_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: integer('created_by').references(() => employees.id),
});

export const projectDocumentRelations = pgTable('project_document_relations', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  documentType: text('document_type').notNull(),
  documentId: text('document_id').notNull(),
  linkedAt: timestamp('linked_at').defaultNow(),
  linkedBy: integer('linked_by').references(() => employees.id),
});

export const erpNotifications = pgTable('erp_notifications', {
  id: serial('id').primaryKey(),
  recipientId: integer('recipient_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  priority: text('priority').default('MEDIUM'),
  title: text('title').notNull(),
  message: text('message'),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  projectId: integer('project_id').references(() => projects.id),
  actionUrl: text('action_url'),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const salesTargets = pgTable('sales_targets', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull(),
  quarter: integer('quarter').notNull(),
  targetAmount: decimal('target_amount').notNull().default('0'),
  currency: text('currency').default('IDR'),
  setBy: integer('set_by').references(() => employees.id),
  setAt: timestamp('set_at').defaultNow(),
  notes: text('notes'),
});

export const taxTypes = pgTable('tax_types', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  rate: decimal('rate').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  regulation: text('regulation'),
  applicableDocuments: jsonb('applicable_documents').default('[]'),
  documentUrl: text('document_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const proposalPenawaran = pgTable('proposal_penawaran', {
  id: serial('id').primaryKey(),
  coverInfo: jsonb('cover_info').notNull(),
  proposalNumber: text('proposal_number').notNull(),
  clientInfo: jsonb('client_info').notNull(),
  clientBackground: text('client_background'),
  offeredSolution: text('offered_solution'),
  workingMethod: text('working_method'),
  timeline: text('timeline'),
  portfolio: text('portfolio'),
  items: jsonb('items').notNull(),
  totalEstimatedCost: decimal('total_estimated_cost').notNull(),
  totalEstimatedCostInWords: text('total_estimated_cost_in_words').notNull(),
  currency: text('currency').default('IDR'),
  scopeOfWork: jsonb('scope_of_work').default('[]'),
  termsAndConditions: jsonb('terms_and_conditions').default('[]'),
  notes: text('notes'),
  documentApproval: jsonb('document_approval').notNull(),
  status: text('status').default('draft'),
  projectId: integer('project_id').references(() => projects.id),
  version: text('version').default('v1'),
  versionNumber: integer('version_number').default(1),
  parentProposalId: integer('parent_proposal_id').references(() => proposalPenawaran.id),
  isActive: boolean('is_active').default(true),
  validUntil: date('valid_until'),
  preparedById: integer('prepared_by_id').references(() => employees.id),
  revisionNotes: text('revision_notes'),
  sentAt: timestamp('sent_at'),
  sentTo: text('sent_to'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  number: text('number').notNull().unique(),
  clientId: integer('client_id').references(() => clients.id),
  projectId: integer('project_id').references(() => projects.id),
  supplierName: text('supplier_name'),
  date: timestamp('date').defaultNow(),
  items: jsonb('items').notNull(),
  subtotal: decimal('subtotal').notNull(),
  tax: decimal('tax').notNull(),
  grandTotal: decimal('grand_total').notNull(),
  status: poStatusEnum('status').default('DRAFT'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  actionType: text('action_type').notNull(),
  targetTable: text('target_table').notNull(),
  targetId: integer('target_id').notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// RBAC
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g., 'invoice.create'
  description: text('description'),
});

export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  role: roleEnum('role').notNull(),
  permissionId: integer('permission_id').references(() => permissions.id).notNull(),
});

// Workflows
export const workflowDefinitions = pgTable('workflow_definitions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g., 'Invoice Approval'
  resourceType: text('resource_type').notNull(), // e.g., 'invoices'
  description: text('description'),
});

export const workflowSteps = pgTable('workflow_steps', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => workflowDefinitions.id).notNull(),
  stepOrder: integer('step_order').notNull(),
  name: text('name').notNull(), // e.g., 'Manager Approval'
  approverRole: roleEnum('approver_role').notNull(),
});

export const workflowInstances = pgTable('workflow_instances', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => workflowDefinitions.id).notNull(),
  resourceId: integer('resource_id').notNull(), // ID of the invoice/po
  currentStepId: integer('current_step_id').references(() => workflowSteps.id),
  status: workflowStatusEnum('status').default('PENDING'),
  requesterId: integer('requester_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const workflowLogs = pgTable('workflow_logs', {
  id: serial('id').primaryKey(),
  instanceId: integer('instance_id').references(() => workflowInstances.id).notNull(),
  stepId: integer('step_id').references(() => workflowSteps.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(), // 'APPROVE', 'REJECT', 'INITIATE'
  comment: text('comment'),
  timestamp: timestamp('timestamp').defaultNow(),
});
// Enhanced Workflows
export const workflowTransitions = pgTable('workflow_transitions', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => workflowDefinitions.id).notNull(),
  fromState: text('from_state'),
  toState: text('to_state'),
  actionName: text('action_name'), // e.g., 'Approve', 'Reject', 'Submit'
  allowedRoles: jsonb('allowed_roles').default('[]'), // Array of roles
  allowedUsers: jsonb('allowed_users').default('[]'), // Array of user IDs
  conditions: jsonb('conditions'), // Logic for transition
  autoActions: jsonb('auto_actions'), // Actions to trigger
});

export const workflowStates = pgTable('workflow_states', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => workflowDefinitions.id).notNull(),
  stateName: text('state_name').notNull(),
  isInitial: boolean('is_initial').default(false),
  isFinal: boolean('is_final').default(false),
  color: text('color'),
  icon: text('icon'),
});

// Notifications & Communication
export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  templateName: text('template_name').notNull().unique(),
  subject: text('subject'),
  bodyHtml: text('body_html'),
  bodyText: text('body_text'),
  variables: jsonb('variables'),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: notificationTypeEnum('type').default('INFO'),
  title: text('title'),
  message: text('message'),
  link: text('link'),
  icon: text('icon'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const emailQueue = pgTable('email_queue', {
  id: serial('id').primaryKey(),
  toEmail: text('to_email').notNull(),
  ccEmail: jsonb('cc_email').default('[]'),
  subject: text('subject'),
  bodyHtml: text('body_html'),
  templateId: integer('template_id').references(() => emailTemplates.id),
  templateData: jsonb('template_data'),
  status: emailStatusEnum('status').default('PENDING'),
  retryCount: integer('retry_count').default(0),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
  sentAt: timestamp('sent_at'),
});

export const activityTimeline = pgTable('activity_timeline', {
  id: serial('id').primaryKey(),
  documentType: text('document_type').notNull(), // 'Invoice', 'PurchaseOrder', etc.
  documentId: integer('document_id').notNull(),
  userId: integer('user_id').references(() => users.id),
  actionType: text('action_type').notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  documentType: text('document_type').notNull(),
  documentId: integer('document_id').notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  mentions: jsonb('mentions').default('[]'), // Array of user IDs
  parentCommentId: integer('parent_comment_id').references(() => comments.id), // For threading
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Inventory Module
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  description: text('description'),
  price: decimal('price').notNull().default('0'),
  cost: decimal('cost').notNull().default('0'),
  unit: text('unit').default('Unit'), // UOM
  category: text('category'),
  stockQuantity: decimal('stock_quantity').default('0'),
  isActive: boolean('is_active').default(true),
  weight: decimal('weight').default('0'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const warehouses = pgTable('warehouses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  location: text('location'),
  parentWarehouseId: integer('parent_warehouse_id'), // Self-reference for hierarchy
  createdAt: timestamp('created_at').defaultNow(),
});

export const stockLedger = pgTable('stock_ledger', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  warehouseId: integer('warehouse_id').references(() => warehouses.id).notNull(),
  qtyChange: decimal('qty_change').notNull(),
  voucherType: text('voucher_type').notNull(), // 'RECEIPT', 'DELIVERY', 'ADJUSTMENT', 'SALES_INVOICE', 'PURCHASE_RECEIPT'
  voucherNo: text('voucher_no').notNull(),
  valuationRate: decimal('valuation_rate'), // For FIFO/Moving Average
  createdAt: timestamp('created_at').defaultNow(),
});

// Manufacturing Module
export const workstations = pgTable('workstations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  hourRate: decimal('hour_rate').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const operations = pgTable('operations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  workstationId: integer('workstation_id').references(() => workstations.id),
  defaultDuration: decimal('default_duration'), // in minutes
  createdAt: timestamp('created_at').defaultNow(),
});

export const boms = pgTable('boms', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').references(() => products.id).notNull(),
  name: text('name').notNull(),
  quantity: decimal('quantity').default('1'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  totalCost: decimal('total_cost').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const bomItems = pgTable('bom_items', {
  id: serial('id').primaryKey(),
  bomId: integer('bom_id').references(() => boms.id).notNull(),
  itemId: integer('item_id').references(() => products.id).notNull(),
  quantity: decimal('quantity').notNull(),
  scrapRate: decimal('scrap_rate').default('0'),
  cost: decimal('cost').default('0'),
});

export const workOrders = pgTable('work_orders', {
  id: serial('id').primaryKey(),
  woNumber: text('wo_number').notNull().unique(),
  bomId: integer('bom_id').references(() => boms.id).notNull(),
  itemId: integer('item_id').references(() => products.id).notNull(),
  qtyToProduce: decimal('qty_to_produce').notNull(),
  warehouseId: integer('warehouse_id').references(() => warehouses.id),
  status: woStatusEnum('status').default('DRAFT'),
  plannedStartDate: timestamp('planned_start_date'),
  actualStartDate: timestamp('actual_start_date'),
  actualFinishDate: timestamp('actual_finish_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const jobCards = pgTable('job_cards', {
  id: serial('id').primaryKey(),
  woId: integer('wo_id').references(() => workOrders.id).notNull(),
  operationId: integer('operation_id').references(() => operations.id),
  workstationId: integer('workstation_id').references(() => workstations.id),
  employeeId: integer('employee_id').references(() => employees.id),
  status: jobCardStatusEnum('status').default('OPEN'),
  plannedStartDate: timestamp('planned_start_date'),
  actualStartDate: timestamp('actual_start_date'),
  actualFinishDate: timestamp('actual_finish_date'),
  totalTimeMinutes: integer('total_time_minutes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const qualityInspections = pgTable('quality_inspections', {
  id: serial('id').primaryKey(),
  referenceType: text('reference_type').notNull(), // 'Purchase Receipt', 'Work Order'
  referenceId: integer('reference_id').notNull(),
  itemId: integer('item_id').references(() => products.id).notNull(),
  inspectedBy: integer('inspected_by').references(() => employees.id),
  status: qiStatusEnum('status').default('PENDING'),
  findings: jsonb('findings'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Advanced HR Module
export const leaveTypes = pgTable('leave_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  maxDaysPerYear: integer('max_days_per_year').notNull(),
  carryForward: boolean('carry_forward').default(false),
  isPaid: boolean('is_paid').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const leaveAllocations = pgTable('leave_allocations', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  leaveTypeId: integer('leave_type_id').references(() => leaveTypes.id).notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  totalDays: decimal('total_days', { precision: 5, scale: 2 }).notNull(),
  usedDays: decimal('used_days', { precision: 5, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const leaveApplications = pgTable('leave_applications', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  leaveTypeId: integer('leave_type_id').references(() => leaveTypes.id).notNull(),
  fromDate: timestamp('from_date').notNull(),
  toDate: timestamp('to_date').notNull(),
  totalDays: decimal('total_days', { precision: 5, scale: 2 }).notNull(),
  reason: text('reason'),
  status: leaveStatusEnum('status').default('PENDING'),
  approvedBy: integer('approved_by').references(() => users.id),
  workflowInstanceId: integer('workflow_instance_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  date: timestamp('date').notNull(),
  status: attendanceStatusEnum('status').notNull(),
  checkIn: text('check_in'), // Store as string e.g. "08:30"
  checkOut: text('check_out'),
  workingHours: decimal('working_hours', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const shifts = pgTable('shifts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const employeeLoans = pgTable('employee_loans', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  loanAmount: decimal('loan_amount', { precision: 15, scale: 2 }).notNull(),
  repaymentAmount: decimal('repayment_amount', { precision: 15, scale: 2 }).notNull(),
  remainingAmount: decimal('remaining_amount', { precision: 15, scale: 2 }).notNull(),
  repaymentPeriods: integer('repayment_periods').notNull(),
  status: loanStatusEnum('status').default('DRAFT'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: assetCategoryEnum('category').notNull(),
  purchaseDate: timestamp('purchase_date').notNull(),
  purchaseAmount: decimal('purchase_amount', { precision: 15, scale: 2 }).notNull(),
  ownerId: integer('owner_id').references(() => employees.id),
  location: text('location'),
  depreciationMethod: depreciationMethodEnum('depreciation_method').default('SLM'),
  totalDepreciation: decimal('total_depreciation', { precision: 15, scale: 2 }).default('0'),
  valueAfterDepreciation: decimal('value_after_depreciation', { precision: 15, scale: 2 }),
  status: assetStatusEnum('status').default('ACTIVE'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const assetDepreciations = pgTable('asset_depreciations', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id).notNull(),
  date: timestamp('date').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const assetMaintenances = pgTable('asset_maintenances', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id).notNull(),
  type: maintenanceTypeEnum('type').notNull(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  completionDate: timestamp('completion_date'),
  cost: decimal('cost', { precision: 15, scale: 2 }).default('0'),
  performedBy: text('performed_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Reports Module Tables
export const reportTemplates = pgTable('report_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  type: reportTypeEnum('type').notNull(),
  query: jsonb('query').notNull(), // Report query definition
  filters: jsonb('filters'), // Available filters
  columns: jsonb('columns').notNull(), // Column definitions
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const reportSchedules = pgTable('report_schedules', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').references(() => reportTemplates.id).notNull(),
  frequency: reportFrequencyEnum('frequency').notNull(),
  recipients: jsonb('recipients').notNull(), // Email addresses array
  lastRun: timestamp('last_run'),
  nextRun: timestamp('next_run').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const generatedReports = pgTable('generated_reports', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').references(() => reportTemplates.id),
  data: jsonb('data').notNull(),
  filters: jsonb('filters'),
  generatedBy: integer('generated_by').references(() => users.id),
  generatedAt: timestamp('generated_at').defaultNow(),
  fileUrl: varchar('file_url', { length: 500 }), // MinIO URL if exported
});

// Analytics & Dashboard Customization Tables
export const dashboardWidgets = pgTable('dashboard_widgets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // chart, metric, table, etc.
  title: varchar('title', { length: 200 }).notNull(),
  config: jsonb('config').notNull(), // Widget configuration
  dataSource: varchar('data_source', { length: 100 }).notNull(),
  refreshInterval: integer('refresh_interval'), // seconds
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const dashboardLayouts = pgTable('dashboard_layouts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  layout: jsonb('layout').notNull(), // Grid layout configuration
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const customKpis = pgTable('custom_kpis', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  formula: text('formula').notNull(), // Calculation formula
  dataSource: jsonb('data_source').notNull(),
  threshold: jsonb('threshold'), // Warning/danger thresholds
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
