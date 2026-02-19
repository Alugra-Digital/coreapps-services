CREATE TYPE "public"."gender_enum" AS ENUM('L', 'P');--> statement-breakpoint
CREATE TYPE "public"."marital_status_enum" AS ENUM('Kawin', 'Belum Kawin');--> statement-breakpoint
CREATE TYPE "public"."position" AS ENUM('DIREKTUR', 'Manajemen Operation', 'Project Manager', 'SA', 'Secretary Office', 'HR GA', 'Finance Accounting', 'Technical Writer', 'Tenaga Ahli', 'EOS Oracle', 'EOS Ticketing', 'EOS Unsoed');--> statement-breakpoint
CREATE TYPE "public"."report_frequency" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('financial', 'inventory', 'hr', 'sales', 'custom');--> statement-breakpoint
CREATE TYPE "public"."tax_status" AS ENUM('TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3');--> statement-breakpoint
CREATE TABLE "custom_kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"formula" text NOT NULL,
	"data_source" jsonb NOT NULL,
	"threshold" jsonb,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dashboard_layouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"layout" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dashboard_layouts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard_widgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"config" jsonb NOT NULL,
	"data_source" varchar(100) NOT NULL,
	"refresh_interval" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generated_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer,
	"data" jsonb NOT NULL,
	"filters" jsonb,
	"generated_by" integer,
	"generated_at" timestamp DEFAULT now(),
	"file_url" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "report_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"frequency" "report_frequency" NOT NULL,
	"recipients" jsonb NOT NULL,
	"last_run" timestamp,
	"next_run" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"type" "report_type" NOT NULL,
	"query" jsonb NOT NULL,
	"filters" jsonb,
	"columns" jsonb NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "ktp" SET DATA TYPE varchar(16);--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "npwp" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "position" SET DATA TYPE "public"."position" USING "position"::"public"."position";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "bank_name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "bank_name" SET DEFAULT 'Mandiri';--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "type" text DEFAULT 'CUSTOMER';--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "payment_terms" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "tax_id" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "tmk" date NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "termination_date" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "phone_number" varchar(20);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "place_of_birth" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "gender" "gender_enum";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "religion" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "marital_status" "marital_status_enum";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "number_of_children" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "tax_status" "tax_status" DEFAULT 'TK/0' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "education_level" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "ktp_address" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "ktp_city" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "ktp_province" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_account_number" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bpjs_kesehatan" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bpjs_ketenagakerjaan" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "jkn_number" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "jms_number" varchar(50);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "revision_number" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "locked_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "locked_by" integer;--> statement-breakpoint
ALTER TABLE "custom_kpis" ADD CONSTRAINT "custom_kpis_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_layouts" ADD CONSTRAINT "dashboard_layouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_template_id_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."report_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_template_id_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."report_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;