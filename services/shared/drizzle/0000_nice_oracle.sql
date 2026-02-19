CREATE TYPE "public"."account_type" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "public"."asset_category" AS ENUM('BUILDING', 'MACHINERY', 'VEHICLES', 'FURNITURE', 'ELECTRONICS');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('ACTIVE', 'SOLD', 'SCRAPPED');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY');--> statement-breakpoint
CREATE TYPE "public"."depreciation_method" AS ENUM('SLM', 'WDV', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."expense_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'ISSUED', 'PARTIAL', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."job_card_status" AS ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."journal_entry_status" AS ENUM('DRAFT', 'POSTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED');--> statement-breakpoint
CREATE TYPE "public"."leave_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('DRAFT', 'APPROVED', 'ACTIVE', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('PREVENTIVE', 'CORRECTIVE', 'BREAKDOWN');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'MENTION');--> statement-breakpoint
CREATE TYPE "public"."opportunity_stage" AS ENUM('PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('DRAFT', 'APPROVED', 'SENT', 'RECEIVED');--> statement-breakpoint
CREATE TYPE "public"."quality_inspection_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."salary_slip_status" AS ENUM('DRAFT', 'POSTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"description" text,
	"balance" numeric DEFAULT '0',
	"is_group" boolean DEFAULT false,
	"parent_account_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "activity_timeline" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" text NOT NULL,
	"document_id" integer NOT NULL,
	"user_id" integer,
	"action_type" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "asset_depreciations" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"journal_entry_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "asset_maintenances" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"type" "maintenance_type" NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"completion_date" timestamp,
	"cost" numeric(15, 2) DEFAULT '0',
	"performed_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" "asset_category" NOT NULL,
	"purchase_date" timestamp NOT NULL,
	"purchase_amount" numeric(15, 2) NOT NULL,
	"owner_id" integer,
	"location" text,
	"depreciation_method" "depreciation_method" DEFAULT 'SLM',
	"total_depreciation" numeric(15, 2) DEFAULT '0',
	"value_after_depreciation" numeric(15, 2),
	"status" "asset_status" DEFAULT 'ACTIVE',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"status" "attendance_status" NOT NULL,
	"check_in" text,
	"check_out" text,
	"working_hours" numeric(5, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action_type" text NOT NULL,
	"target_table" text NOT NULL,
	"target_id" integer NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bom_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bom_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" numeric NOT NULL,
	"scrap_rate" numeric DEFAULT '0',
	"cost" numeric DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "boms" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric DEFAULT '1',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"total_cost" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"email" text,
	"phone" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" text NOT NULL,
	"document_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"mentions" jsonb DEFAULT '[]',
	"parent_comment_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"to_email" text NOT NULL,
	"cc_email" jsonb DEFAULT '[]',
	"subject" text,
	"body_html" text,
	"template_id" integer,
	"template_data" jsonb,
	"status" "email_status" DEFAULT 'PENDING',
	"retry_count" integer DEFAULT 0,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" text NOT NULL,
	"subject" text,
	"body_html" text,
	"body_text" text,
	"variables" jsonb,
	CONSTRAINT "email_templates_template_name_unique" UNIQUE("template_name")
);
--> statement-breakpoint
CREATE TABLE "employee_loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"loan_amount" numeric(15, 2) NOT NULL,
	"repayment_amount" numeric(15, 2) NOT NULL,
	"remaining_amount" numeric(15, 2) NOT NULL,
	"repayment_periods" integer NOT NULL,
	"status" "loan_status" DEFAULT 'DRAFT',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"nik" text NOT NULL,
	"name" text NOT NULL,
	"ktp" text NOT NULL,
	"npwp" text,
	"ptkp" text,
	"department" text,
	"position" text,
	"join_date" timestamp,
	"status" text DEFAULT 'ACTIVE',
	"bank_name" text,
	"bank_account" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "employees_nik_unique" UNIQUE("nik")
);
--> statement-breakpoint
CREATE TABLE "expense_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" timestamp DEFAULT now(),
	"category" text,
	"description" text,
	"amount" numeric DEFAULT '0' NOT NULL,
	"status" "expense_status" DEFAULT 'DRAFT',
	"debit_account_id" integer NOT NULL,
	"credit_account_id" integer NOT NULL,
	"journal_entry_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"posted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"quotation_id" integer,
	"client_id" integer,
	"date" timestamp DEFAULT now(),
	"due_date" timestamp,
	"items" jsonb NOT NULL,
	"subtotal" numeric NOT NULL,
	"ppn" numeric NOT NULL,
	"pph" numeric DEFAULT '0',
	"grand_total" numeric NOT NULL,
	"paid_amount" numeric DEFAULT '0',
	"status" "invoice_status" DEFAULT 'DRAFT',
	"journal_entry_id" integer,
	"pdf_locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "job_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"wo_id" integer NOT NULL,
	"operation_id" integer,
	"workstation_id" integer,
	"employee_id" integer,
	"status" "job_card_status" DEFAULT 'OPEN',
	"planned_start_date" timestamp,
	"actual_start_date" timestamp,
	"actual_finish_date" timestamp,
	"total_time_minutes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now(),
	"description" text,
	"reference" text,
	"status" "journal_entry_status" DEFAULT 'DRAFT',
	"total_debit" numeric DEFAULT '0',
	"total_credit" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"posted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "journal_entry_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_entry_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"debit" numeric DEFAULT '0',
	"credit" numeric DEFAULT '0',
	"description" text,
	"reference" text
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"email" text,
	"phone" text,
	"status" "lead_status" DEFAULT 'NEW',
	"source" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type_id" integer NOT NULL,
	"fiscal_year" integer NOT NULL,
	"total_days" numeric(5, 2) NOT NULL,
	"used_days" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type_id" integer NOT NULL,
	"from_date" timestamp NOT NULL,
	"to_date" timestamp NOT NULL,
	"total_days" numeric(5, 2) NOT NULL,
	"reason" text,
	"status" "leave_status" DEFAULT 'PENDING',
	"approved_by" integer,
	"workflow_instance_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"max_days_per_year" integer NOT NULL,
	"carry_forward" boolean DEFAULT false,
	"is_paid" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "leave_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" DEFAULT 'INFO',
	"title" text,
	"message" text,
	"link" text,
	"icon" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "operations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"workstation_id" integer,
	"default_duration" numeric,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lead_id" integer,
	"client_id" integer,
	"amount" numeric DEFAULT '0' NOT NULL,
	"probability" integer DEFAULT 0,
	"stage" "opportunity_stage" DEFAULT 'PROSPECTING',
	"expected_close_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"journal_entry_id" integer,
	"date" timestamp DEFAULT now(),
	"amount" numeric DEFAULT '0' NOT NULL,
	"payment_mode" text NOT NULL,
	"reference_no" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"description" text,
	"price" numeric DEFAULT '0' NOT NULL,
	"cost" numeric DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'Unit',
	"category" text,
	"stock_quantity" numeric DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"weight" numeric DEFAULT '0',
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"supplier_id" integer,
	"supplier_name" text NOT NULL,
	"date" timestamp DEFAULT now(),
	"items" jsonb NOT NULL,
	"subtotal" numeric NOT NULL,
	"tax" numeric NOT NULL,
	"grand_total" numeric NOT NULL,
	"status" "po_status" DEFAULT 'DRAFT',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "purchase_orders_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "quality_inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"inspected_by" integer,
	"status" "quality_inspection_status" DEFAULT 'PENDING',
	"findings" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"client_id" integer,
	"date" timestamp DEFAULT now(),
	"items" jsonb NOT NULL,
	"subtotal" numeric NOT NULL,
	"ppn" numeric NOT NULL,
	"grand_total" numeric NOT NULL,
	"scope_of_work" text,
	"status" text DEFAULT 'DRAFT',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quotations_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" "role" NOT NULL,
	"permission_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_slips" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"gross" numeric DEFAULT '0' NOT NULL,
	"total_deductions" numeric DEFAULT '0' NOT NULL,
	"pph21" numeric DEFAULT '0',
	"loan_repayment" numeric DEFAULT '0',
	"net_pay" numeric DEFAULT '0' NOT NULL,
	"status" "salary_slip_status" DEFAULT 'DRAFT',
	"journal_entry_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"posted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "salary_structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"base_salary" numeric DEFAULT '0' NOT NULL,
	"allowances" numeric DEFAULT '0' NOT NULL,
	"deductions" numeric DEFAULT '0' NOT NULL,
	"tax_rate" numeric DEFAULT '0',
	"salary_expense_account_id" integer,
	"payroll_payable_account_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "salary_structures_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"warehouse_id" integer NOT NULL,
	"qty_change" numeric NOT NULL,
	"voucher_type" text NOT NULL,
	"voucher_no" text NOT NULL,
	"valuation_rate" numeric,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"parent_warehouse_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "warehouses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"wo_number" text NOT NULL,
	"bom_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"qty_to_produce" numeric NOT NULL,
	"warehouse_id" integer,
	"status" "work_order_status" DEFAULT 'DRAFT',
	"planned_start_date" timestamp,
	"actual_start_date" timestamp,
	"actual_finish_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "work_orders_wo_number_unique" UNIQUE("wo_number")
);
--> statement-breakpoint
CREATE TABLE "workflow_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"resource_type" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "workflow_instances" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"resource_id" integer NOT NULL,
	"current_step_id" integer,
	"status" "workflow_status" DEFAULT 'PENDING',
	"requester_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"instance_id" integer NOT NULL,
	"step_id" integer,
	"user_id" integer,
	"action" text NOT NULL,
	"comment" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"state_name" text NOT NULL,
	"is_initial" boolean DEFAULT false,
	"is_final" boolean DEFAULT false,
	"color" text,
	"icon" text
);
--> statement-breakpoint
CREATE TABLE "workflow_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"step_order" integer NOT NULL,
	"name" text NOT NULL,
	"approver_role" "role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_transitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"from_state" text,
	"to_state" text,
	"action_name" text,
	"allowed_roles" jsonb DEFAULT '[]',
	"allowed_users" jsonb DEFAULT '[]',
	"conditions" jsonb,
	"auto_actions" jsonb
);
--> statement-breakpoint
CREATE TABLE "workstations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"hour_rate" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "workstations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "activity_timeline" ADD CONSTRAINT "activity_timeline_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenances" ADD CONSTRAINT "asset_maintenances_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."boms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boms" ADD CONSTRAINT "boms_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_loans" ADD CONSTRAINT "employee_loans_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_debit_account_id_accounts_id_fk" FOREIGN KEY ("debit_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_credit_account_id_accounts_id_fk" FOREIGN KEY ("credit_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_wo_id_work_orders_id_fk" FOREIGN KEY ("wo_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_operation_id_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_workstation_id_workstations_id_fk" FOREIGN KEY ("workstation_id") REFERENCES "public"."workstations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_allocations" ADD CONSTRAINT "leave_allocations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_allocations" ADD CONSTRAINT "leave_allocations_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_workstation_id_workstations_id_fk" FOREIGN KEY ("workstation_id") REFERENCES "public"."workstations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_entries" ADD CONSTRAINT "payment_entries_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_entries" ADD CONSTRAINT "payment_entries_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_inspected_by_employees_id_fk" FOREIGN KEY ("inspected_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_slips" ADD CONSTRAINT "salary_slips_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_slips" ADD CONSTRAINT "salary_slips_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_salary_expense_account_id_accounts_id_fk" FOREIGN KEY ("salary_expense_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_payroll_payable_account_id_accounts_id_fk" FOREIGN KEY ("payroll_payable_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."boms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_id_workflow_definitions_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_current_step_id_workflow_steps_id_fk" FOREIGN KEY ("current_step_id") REFERENCES "public"."workflow_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_logs" ADD CONSTRAINT "workflow_logs_instance_id_workflow_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_logs" ADD CONSTRAINT "workflow_logs_step_id_workflow_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."workflow_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_logs" ADD CONSTRAINT "workflow_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_states" ADD CONSTRAINT "workflow_states_workflow_id_workflow_definitions_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflow_id_workflow_definitions_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_workflow_id_workflow_definitions_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_definitions"("id") ON DELETE no action ON UPDATE no action;