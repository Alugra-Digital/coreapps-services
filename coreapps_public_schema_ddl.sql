create type gender as enum ('L', 'P');

alter type gender owner to pgadmin;

create type job_position as enum ('Direktur', 'Project Manager', 'SA', 'Secretary Office', 'HR GA', 'Finance Accounting', 'Technical Writer', 'Tenaga Ahli', 'EOS Oracle');

alter type job_position owner to pgadmin;

create type marital_status as enum ('Kawin', 'Belum Kawin');

alter type marital_status owner to pgadmin;

create type ptkp as enum ('TK/0', 'TK/1', 'K/0', 'K/1', 'K/2', 'K/3');

alter type ptkp owner to pgadmin;

create type status as enum ('PKWT', 'PKWTT');

alter type status owner to pgadmin;

create type quotation_status as enum ('DRAFT', 'SENT', 'FINALIZED');

alter type quotation_status owner to pgadmin;

create type invoice_status as enum ('DRAFT', 'ISSUED', 'PARTIAL', 'PAID');

alter type invoice_status owner to pgadmin;

create type role as enum ('HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN');

alter type role owner to pgadmin;

create type workflow_status as enum ('PENDING', 'APPROVED', 'REJECTED');

alter type workflow_status owner to pgadmin;

create type po_status as enum ('DRAFT', 'APPROVED', 'SENT', 'RECEIVED');

alter type po_status owner to pgadmin;

create type lead_status as enum ('NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED');

alter type lead_status owner to pgadmin;

create type opportunity_stage as enum ('PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');

alter type opportunity_stage owner to pgadmin;

create type account_type as enum ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

alter type account_type owner to pgadmin;

create type journal_entry_status as enum ('DRAFT', 'POSTED', 'CANCELLED');

alter type journal_entry_status owner to pgadmin;

create type expense_status as enum ('DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'REJECTED', 'CANCELLED');

alter type expense_status owner to pgadmin;

create type salary_slip_status as enum ('DRAFT', 'POSTED', 'CANCELLED');

alter type salary_slip_status owner to pgadmin;

create type asset_category as enum ('BUILDING', 'MACHINERY', 'VEHICLES', 'FURNITURE', 'ELECTRONICS');

alter type asset_category owner to pgadmin;

create type asset_status as enum ('ACTIVE', 'SOLD', 'SCRAPPED');

alter type asset_status owner to pgadmin;

create type attendance_status as enum ('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY');

alter type attendance_status owner to pgadmin;

create type depreciation_method as enum ('SLM', 'WDV', 'MANUAL');

alter type depreciation_method owner to pgadmin;

create type email_status as enum ('PENDING', 'SENT', 'FAILED');

alter type email_status owner to pgadmin;

create type job_card_status as enum ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

alter type job_card_status owner to pgadmin;

create type leave_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

alter type leave_status owner to pgadmin;

create type loan_status as enum ('DRAFT', 'APPROVED', 'ACTIVE', 'CLOSED', 'CANCELLED');

alter type loan_status owner to pgadmin;

create type maintenance_type as enum ('PREVENTIVE', 'CORRECTIVE', 'BREAKDOWN');

alter type maintenance_type owner to pgadmin;

create type notification_type as enum ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'MENTION');

alter type notification_type owner to pgadmin;

create type quality_inspection_status as enum ('PENDING', 'ACCEPTED', 'REJECTED');

alter type quality_inspection_status owner to pgadmin;

create type work_order_status as enum ('DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

alter type work_order_status owner to pgadmin;

create type finance_transaction_type as enum ('inbound', 'outbound');

alter type finance_transaction_type owner to pgadmin;

create type finance_transaction_status as enum ('Completed', 'Pending', 'Processing');

alter type finance_transaction_status owner to pgadmin;

create type report_type as enum ('financial', 'inventory', 'hr', 'sales', 'custom');

alter type report_type owner to pgadmin;

create type report_frequency as enum ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');

alter type report_frequency owner to pgadmin;

create table roles
(
    id              serial
        primary key,
    name            text not null
        constraint roles_name_unique
            unique,
    code            text
        unique,
    permission_keys jsonb     default '[]'::jsonb,
    created_at      timestamp default now(),
    updated_at      timestamp default now(),
    description     text,
    is_active       boolean   default true
);

alter table roles
    owner to pgadmin;

create table user_accounts
(
    id            uuid      default gen_random_uuid() not null
        primary key,
    email         text                                not null
        constraint user_accounts_email_unique
            unique,
    password_hash text                                not null,
    full_name     text                                not null,
    created_at    timestamp default now()
);

alter table user_accounts
    owner to pgadmin;

create table user_roles
(
    user_id uuid not null
        constraint user_roles_user_id_user_accounts_id_fk
            references user_accounts,
    role_id serial
        constraint user_roles_role_id_roles_id_fk
            references roles
);

alter table user_roles
    owner to pgadmin;

create table quotation_items
(
    id           uuid default gen_random_uuid() not null
        primary key,
    quotation_id uuid                           not null,
    description  text                           not null,
    quantity     integer                        not null,
    unit_price   double precision               not null,
    total        double precision               not null
);

alter table quotation_items
    owner to pgadmin;

create table vendors
(
    id           uuid      default gen_random_uuid() not null
        primary key,
    name         text                                not null,
    company_name text,
    contact_name text,
    email        text,
    phone        text,
    address      text,
    npwp         text,
    pic          jsonb,
    bank_name    text,
    bank_account text,
    bank_branch  text,
    is_active    boolean   default true,
    created_at   timestamp default now(),
    updated_at   timestamp default now()
);

alter table vendors
    owner to pgadmin;

create table invoice_items
(
    id          uuid default gen_random_uuid() not null
        primary key,
    invoice_id  uuid                           not null,
    description text                           not null,
    quantity    integer                        not null,
    price       double precision               not null,
    total       double precision               not null
);

alter table invoice_items
    owner to pgadmin;

create table po_items
(
    id          uuid default gen_random_uuid() not null
        primary key,
    po_id       uuid                           not null,
    description text                           not null,
    quantity    integer                        not null,
    unit_price  double precision               not null
);

alter table po_items
    owner to pgadmin;

create table clients
(
    id             serial
        primary key,
    name           text not null,
    company_name   text,
    address        text,
    email          text,
    phone          text,
    npwp           text,
    pic            jsonb,
    type           text      default 'CUSTOMER'::text,
    payment_terms   integer   default 30,
    tax_id         text,
    is_active      boolean   default true,
    created_at     timestamp default now(),
    updated_at     timestamp default now()
);

alter table clients
    owner to pgadmin;

create table employees
(
    id                   serial
        primary key,
    nik                  text not null
        constraint employees_nik_unique
            unique,
    name                 text not null,
    ktp                  text not null,
    npwp                 text,
    ptkp                 text,
    department           text,
    position             text,
    join_date            timestamp,
    status               text        default 'ACTIVE'::text,
    bank_name            text,
    bank_account         text,
    created_at           timestamp   default now(),
    updated_at           timestamp   default now(),
    deleted_at           timestamp,
    no_kk                text,
    tmk                  date        default '2020-01-01'::date,
    termination_date     date,
    email                varchar(255),
    phone_number         varchar(20),
    place_of_birth       varchar(100),
    date_of_birth        date,
    gender               varchar(10),
    religion             text,
    marital_status       varchar(50),
    number_of_children   integer     default 0,
    tax_status           varchar(10) default 'TK/0'::character varying,
    education_level      varchar(100),
    ktp_address          text,
    ktp_city             varchar(100),
    ktp_province         varchar(100),
    bank_account_number  varchar(50),
    bpjs_kesehatan       text,
    bpjs_ketenagakerjaan text,
    jkn_number           varchar(50),
    jms_number           varchar(50)
);

alter table employees
    owner to pgadmin;

create table quotations
(
    id            serial
        primary key,
    number        text    not null
        constraint quotations_number_unique
            unique,
    client_id     integer
        constraint quotations_client_id_clients_id_fk
            references clients,
    date          timestamp default now(),
    items         jsonb   not null,
    subtotal      numeric not null,
    ppn           numeric not null,
    grand_total   numeric not null,
    scope_of_work text,
    status        text      default 'DRAFT'::text,
    created_at    timestamp default now(),
    updated_at    timestamp default now()
);

alter table quotations
    owner to pgadmin;

create table invoices
(
    id               serial
        primary key,
    number           text    not null
        constraint invoices_number_unique
            unique,
    quotation_id     integer
        constraint invoices_quotation_id_quotations_id_fk
            references quotations,
    client_id        integer
        constraint invoices_client_id_clients_id_fk
            references clients,
    date             timestamp      default now(),
    due_date         timestamp,
    items            jsonb   not null,
    subtotal         numeric not null,
    ppn              numeric not null,
    pph              numeric        default '0'::numeric,
    grand_total      numeric not null,
    status           invoice_status default 'DRAFT'::invoice_status,
    pdf_locked       boolean        default false,
    created_at       timestamp      default now(),
    updated_at       timestamp      default now(),
    paid_amount      numeric        default 0,
    journal_entry_id integer,
    revision_number  integer        default 0,
    locked_at        timestamp,
    locked_by        integer
);

alter table invoices
    owner to pgadmin;

create table users
(
    id         serial
        primary key,
    username   text not null
        constraint users_username_unique
            unique,
    password   text not null,
    role       role not null,
    email      text,
    full_name  text,
    phone      text,
    bio        text,
    role_id    integer,
    is_active  boolean   default true,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

alter table users
    owner to pgadmin;

create table audit_logs
(
    id           serial
        primary key,
    user_id      integer
        constraint audit_logs_user_id_users_id_fk
            references users,
    action_type  text    not null,
    target_table text    not null,
    target_id    integer not null,
    old_value    jsonb,
    new_value    jsonb,
    ip_address   text,
    user_agent   text,
    timestamp    timestamp default now()
);

alter table audit_logs
    owner to pgadmin;

create table permissions
(
    id          serial
        primary key,
    name        text not null
        constraint permissions_name_unique
            unique,
    description text
);

alter table permissions
    owner to pgadmin;

create table role_permissions
(
    id            serial
        primary key,
    role          role    not null,
    permission_id integer not null
        constraint role_permissions_permission_id_permissions_id_fk
            references permissions
);

alter table role_permissions
    owner to pgadmin;

create table workflow_definitions
(
    id            serial
        primary key,
    name          text not null,
    resource_type text not null,
    description   text
);

alter table workflow_definitions
    owner to pgadmin;

create table workflow_steps
(
    id            serial
        primary key,
    workflow_id   integer not null
        constraint workflow_steps_workflow_id_workflow_definitions_id_fk
            references workflow_definitions,
    step_order    integer not null,
    name          text    not null,
    approver_role role    not null
);

alter table workflow_steps
    owner to pgadmin;

create table workflow_instances
(
    id              serial
        primary key,
    workflow_id     integer not null
        constraint workflow_instances_workflow_id_workflow_definitions_id_fk
            references workflow_definitions,
    resource_id     integer not null,
    current_step_id integer
        constraint workflow_instances_current_step_id_workflow_steps_id_fk
            references workflow_steps,
    status          workflow_status default 'PENDING'::workflow_status,
    requester_id    integer
        constraint workflow_instances_requester_id_users_id_fk
            references users,
    created_at      timestamp       default now(),
    updated_at      timestamp       default now()
);

alter table workflow_instances
    owner to pgadmin;

create table workflow_logs
(
    id          serial
        primary key,
    instance_id integer not null
        constraint workflow_logs_instance_id_workflow_instances_id_fk
            references workflow_instances,
    step_id     integer
        constraint workflow_logs_step_id_workflow_steps_id_fk
            references workflow_steps,
    user_id     integer
        constraint workflow_logs_user_id_users_id_fk
            references users,
    action      text    not null,
    comment     text,
    timestamp   timestamp default now()
);

alter table workflow_logs
    owner to pgadmin;

create table products
(
    id             serial
        primary key,
    name           text                           not null,
    sku            text                           not null
        constraint products_sku_unique
            unique,
    description    text,
    price          numeric   default '0'::numeric not null,
    cost           numeric   default '0'::numeric not null,
    unit           text      default 'Unit'::text,
    category       text,
    stock_quantity numeric   default '0'::numeric,
    created_at     timestamp default now(),
    updated_at     timestamp default now(),
    is_active      boolean   default true,
    weight         numeric   default '0'::numeric,
    image_url      text
);

alter table products
    owner to pgadmin;

create table warehouses
(
    id                  serial
        primary key,
    name                text not null
        constraint warehouses_name_unique
            unique,
    location            text,
    parent_warehouse_id integer,
    created_at          timestamp default now()
);

alter table warehouses
    owner to pgadmin;

create table stock_ledger
(
    id             serial
        primary key,
    product_id     integer not null
        constraint stock_ledger_product_id_products_id_fk
            references products,
    warehouse_id   integer not null
        constraint stock_ledger_warehouse_id_warehouses_id_fk
            references warehouses,
    qty_change     numeric not null,
    voucher_type   text    not null,
    voucher_no     text    not null,
    valuation_rate numeric,
    created_at     timestamp default now()
);

alter table stock_ledger
    owner to pgadmin;

create table purchase_orders
(
    id            serial
        primary key,
    number        text    not null
        constraint purchase_orders_number_unique
            unique,
    supplier_id   integer,
    supplier_name text    not null,
    date          timestamp default now(),
    items         jsonb   not null,
    subtotal      numeric not null,
    tax           numeric not null,
    grand_total   numeric not null,
    status        po_status default 'DRAFT'::po_status,
    created_at    timestamp default now(),
    updated_at    timestamp default now()
);

alter table purchase_orders
    owner to pgadmin;

create table leads
(
    id         serial
        primary key,
    name       text not null,
    company    text,
    email      text,
    phone      text,
    status     lead_status default 'NEW'::lead_status,
    source     text,
    notes      text,
    created_at timestamp   default now(),
    updated_at timestamp   default now()
);

alter table leads
    owner to pgadmin;

create table opportunities
(
    id                  serial
        primary key,
    name                text                                   not null,
    lead_id             integer
        constraint opportunities_lead_id_leads_id_fk
            references leads,
    client_id           integer
        constraint opportunities_client_id_clients_id_fk
            references clients,
    amount              numeric           default '0'::numeric not null,
    probability         integer           default 0,
    stage               opportunity_stage default 'PROSPECTING'::opportunity_stage,
    expected_close_date timestamp,
    notes               text,
    created_at          timestamp         default now(),
    updated_at          timestamp         default now()
);

alter table opportunities
    owner to pgadmin;

create table accounts
(
    id                serial
        primary key,
    code              text         not null
        constraint accounts_code_unique
            unique,
    name              text         not null,
    type              account_type not null,
    description       text,
    balance           numeric   default '0'::numeric,
    is_group          boolean   default false,
    parent_account_id integer,
    created_at        timestamp default now(),
    updated_at        timestamp default now()
);

alter table accounts
    owner to pgadmin;

create table journal_entries
(
    id           serial
        primary key,
    date         timestamp            default now(),
    description  text,
    reference    text,
    status       journal_entry_status default 'DRAFT'::journal_entry_status,
    total_debit  numeric              default '0'::numeric,
    total_credit numeric              default '0'::numeric,
    created_at   timestamp            default now(),
    updated_at   timestamp            default now(),
    posted_at    timestamp
);

alter table journal_entries
    owner to pgadmin;

create table journal_entry_lines
(
    id               serial
        primary key,
    journal_entry_id integer not null
        constraint journal_entry_lines_journal_entry_id_journal_entries_id_fk
            references journal_entries,
    account_id       integer not null
        constraint journal_entry_lines_account_id_accounts_id_fk
            references accounts,
    debit            numeric default '0'::numeric,
    credit           numeric default '0'::numeric,
    description      text,
    reference        text
);

alter table journal_entry_lines
    owner to pgadmin;

create table expense_claims
(
    id                serial
        primary key,
    employee_id       integer                             not null
        constraint expense_claims_employee_id_employees_id_fk
            references employees,
    date              timestamp      default now(),
    category          text,
    description       text,
    amount            numeric        default '0'::numeric not null,
    status            expense_status default 'DRAFT'::expense_status,
    debit_account_id  integer                             not null
        constraint expense_claims_debit_account_id_accounts_id_fk
            references accounts,
    credit_account_id integer                             not null
        constraint expense_claims_credit_account_id_accounts_id_fk
            references accounts,
    journal_entry_id  integer
        constraint expense_claims_journal_entry_id_journal_entries_id_fk
            references journal_entries,
    created_at        timestamp      default now(),
    updated_at        timestamp      default now(),
    posted_at         timestamp
);

alter table expense_claims
    owner to pgadmin;

create table salary_slips
(
    id               serial
        primary key,
    employee_id      integer                                 not null
        constraint salary_slips_employee_id_employees_id_fk
            references employees,
    period_year      integer                                 not null,
    period_month     integer                                 not null,
    gross            numeric            default '0'::numeric not null,
    total_deductions numeric            default '0'::numeric not null,
    pph21            numeric            default '0'::numeric,
    loan_repayment   numeric            default '0'::numeric,
    net_pay          numeric            default '0'::numeric not null,
    status           salary_slip_status default 'DRAFT'::salary_slip_status,
    journal_entry_id integer
        constraint salary_slips_journal_entry_id_journal_entries_id_fk
            references journal_entries,
    created_at       timestamp          default now(),
    updated_at       timestamp          default now(),
    posted_at        timestamp
);

alter table salary_slips
    owner to pgadmin;

create table salary_structures
(
    id                         serial
        primary key,
    employee_id                integer                        not null
        constraint salary_structures_employee_id_unique
            unique
        constraint salary_structures_employee_id_employees_id_fk
            references employees,
    base_salary                numeric   default '0'::numeric not null,
    allowances                 numeric   default '0'::numeric not null,
    deductions                 numeric   default '0'::numeric not null,
    tax_rate                   numeric   default '0'::numeric,
    salary_expense_account_id  integer
        constraint salary_structures_salary_expense_account_id_accounts_id_fk
            references accounts,
    payroll_payable_account_id integer
        constraint salary_structures_payroll_payable_account_id_accounts_id_fk
            references accounts,
    created_at                 timestamp default now(),
    updated_at                 timestamp default now()
);

alter table salary_structures
    owner to pgadmin;

create table activity_timeline
(
    id            serial
        primary key,
    document_type text    not null,
    document_id   integer not null,
    user_id       integer
        constraint activity_timeline_user_id_users_id_fk
            references users,
    action_type   text    not null,
    description   text,
    metadata      jsonb,
    created_at    timestamp default now()
);

alter table activity_timeline
    owner to pgadmin;

create table assets
(
    id                       serial
        primary key,
    name                     text           not null,
    category                 asset_category not null,
    purchase_date            timestamp      not null,
    purchase_amount          numeric(15, 2) not null,
    owner_id                 integer
        constraint assets_owner_id_employees_id_fk
            references employees,
    location                 text,
    depreciation_method      depreciation_method default 'SLM'::depreciation_method,
    total_depreciation       numeric(15, 2)      default '0'::numeric,
    value_after_depreciation numeric(15, 2),
    status                   asset_status        default 'ACTIVE'::asset_status,
    created_at               timestamp           default now(),
    updated_at               timestamp           default now()
);

alter table assets
    owner to pgadmin;

create table asset_depreciations
(
    id               serial
        primary key,
    asset_id         integer        not null
        constraint asset_depreciations_asset_id_assets_id_fk
            references assets,
    date             timestamp      not null,
    amount           numeric(15, 2) not null,
    journal_entry_id integer
        constraint asset_depreciations_journal_entry_id_journal_entries_id_fk
            references journal_entries,
    created_at       timestamp default now()
);

alter table asset_depreciations
    owner to pgadmin;

create table asset_maintenances
(
    id              serial
        primary key,
    asset_id        integer          not null
        constraint asset_maintenances_asset_id_assets_id_fk
            references assets,
    type            maintenance_type not null,
    scheduled_date  timestamp        not null,
    completion_date timestamp,
    cost            numeric(15, 2) default '0'::numeric,
    performed_by    text,
    created_at      timestamp      default now()
);

alter table asset_maintenances
    owner to pgadmin;

create table attendance
(
    id            serial
        primary key,
    employee_id   integer           not null
        constraint attendance_employee_id_employees_id_fk
            references employees,
    date          timestamp         not null,
    status        attendance_status not null,
    check_in      text,
    check_out     text,
    working_hours numeric(5, 2),
    created_at    timestamp default now()
);

alter table attendance
    owner to pgadmin;

create table boms
(
    id         serial
        primary key,
    item_id    integer not null
        constraint boms_item_id_products_id_fk
            references products,
    name       text    not null,
    quantity   numeric   default '1'::numeric,
    is_default boolean   default false,
    is_active  boolean   default true,
    total_cost numeric   default '0'::numeric,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

alter table boms
    owner to pgadmin;

create table bom_items
(
    id         serial
        primary key,
    bom_id     integer not null
        constraint bom_items_bom_id_boms_id_fk
            references boms,
    item_id    integer not null
        constraint bom_items_item_id_products_id_fk
            references products,
    quantity   numeric not null,
    scrap_rate numeric default '0'::numeric,
    cost       numeric default '0'::numeric
);

alter table bom_items
    owner to pgadmin;

create table comments
(
    id                serial
        primary key,
    document_type     text    not null,
    document_id       integer not null,
    user_id           integer not null
        constraint comments_user_id_users_id_fk
            references users,
    content           text    not null,
    mentions          jsonb     default '[]'::jsonb,
    parent_comment_id integer
        constraint comments_parent_comment_id_comments_id_fk
            references comments,
    created_at        timestamp default now(),
    updated_at        timestamp default now()
);

alter table comments
    owner to pgadmin;

create table email_templates
(
    id            serial
        primary key,
    template_name text not null
        constraint email_templates_template_name_unique
            unique,
    subject       text,
    body_html     text,
    body_text     text,
    variables     jsonb
);

alter table email_templates
    owner to pgadmin;

create table email_queue
(
    id            serial
        primary key,
    to_email      text not null,
    cc_email      jsonb        default '[]'::jsonb,
    subject       text,
    body_html     text,
    template_id   integer
        constraint email_queue_template_id_email_templates_id_fk
            references email_templates,
    template_data jsonb,
    status        email_status default 'PENDING'::email_status,
    retry_count   integer      default 0,
    error_message text,
    created_at    timestamp    default now(),
    sent_at       timestamp
);

alter table email_queue
    owner to pgadmin;

create table employee_loans
(
    id                serial
        primary key,
    employee_id       integer        not null
        constraint employee_loans_employee_id_employees_id_fk
            references employees,
    loan_amount       numeric(15, 2) not null,
    repayment_amount  numeric(15, 2) not null,
    remaining_amount  numeric(15, 2) not null,
    repayment_periods integer        not null,
    status            loan_status default 'DRAFT'::loan_status,
    created_at        timestamp   default now(),
    updated_at        timestamp   default now()
);

alter table employee_loans
    owner to pgadmin;

create table leave_types
(
    id                serial
        primary key,
    name              text    not null
        constraint leave_types_name_unique
            unique,
    max_days_per_year integer not null,
    carry_forward     boolean   default false,
    is_paid           boolean   default true,
    created_at        timestamp default now()
);

alter table leave_types
    owner to pgadmin;

create table leave_allocations
(
    id            serial
        primary key,
    employee_id   integer       not null
        constraint leave_allocations_employee_id_employees_id_fk
            references employees,
    leave_type_id integer       not null
        constraint leave_allocations_leave_type_id_leave_types_id_fk
            references leave_types,
    fiscal_year   integer       not null,
    total_days    numeric(5, 2) not null,
    used_days     numeric(5, 2) default '0'::numeric,
    created_at    timestamp     default now()
);

alter table leave_allocations
    owner to pgadmin;

create table leave_applications
(
    id                   serial
        primary key,
    employee_id          integer       not null
        constraint leave_applications_employee_id_employees_id_fk
            references employees,
    leave_type_id        integer       not null
        constraint leave_applications_leave_type_id_leave_types_id_fk
            references leave_types,
    from_date            timestamp     not null,
    to_date              timestamp     not null,
    total_days           numeric(5, 2) not null,
    reason               text,
    status               leave_status default 'PENDING'::leave_status,
    approved_by          integer
        constraint leave_applications_approved_by_users_id_fk
            references users,
    workflow_instance_id integer,
    created_at           timestamp    default now(),
    updated_at           timestamp    default now()
);

alter table leave_applications
    owner to pgadmin;

create table notifications
(
    id         serial
        primary key,
    user_id    integer not null
        constraint notifications_user_id_users_id_fk
            references users,
    type       notification_type default 'INFO'::notification_type,
    title      text,
    message    text,
    link       text,
    icon       text,
    is_read    boolean           default false,
    created_at timestamp         default now()
);

alter table notifications
    owner to pgadmin;

create table payment_entries
(
    id               serial
        primary key,
    invoice_id       integer                        not null
        constraint payment_entries_invoice_id_invoices_id_fk
            references invoices,
    journal_entry_id integer
        constraint payment_entries_journal_entry_id_journal_entries_id_fk
            references journal_entries,
    date             timestamp default now(),
    amount           numeric   default '0'::numeric not null,
    payment_mode     text                           not null,
    reference_no     text,
    created_at       timestamp default now(),
    updated_at       timestamp default now()
);

alter table payment_entries
    owner to pgadmin;

create table quality_inspections
(
    id             serial
        primary key,
    reference_type text    not null,
    reference_id   integer not null,
    item_id        integer not null
        constraint quality_inspections_item_id_products_id_fk
            references products,
    inspected_by   integer
        constraint quality_inspections_inspected_by_employees_id_fk
            references employees,
    status         quality_inspection_status default 'PENDING'::quality_inspection_status,
    findings       jsonb,
    created_at     timestamp                 default now()
);

alter table quality_inspections
    owner to pgadmin;

create table shifts
(
    id         serial
        primary key,
    name       text not null,
    start_time text not null,
    end_time   text not null,
    is_default boolean   default false,
    created_at timestamp default now()
);

alter table shifts
    owner to pgadmin;

create table work_orders
(
    id                 serial
        primary key,
    wo_number          text    not null
        constraint work_orders_wo_number_unique
            unique,
    bom_id             integer not null
        constraint work_orders_bom_id_boms_id_fk
            references boms,
    item_id            integer not null
        constraint work_orders_item_id_products_id_fk
            references products,
    qty_to_produce     numeric not null,
    warehouse_id       integer
        constraint work_orders_warehouse_id_warehouses_id_fk
            references warehouses,
    status             work_order_status default 'DRAFT'::work_order_status,
    planned_start_date timestamp,
    actual_start_date  timestamp,
    actual_finish_date timestamp,
    created_at         timestamp         default now(),
    updated_at         timestamp         default now()
);

alter table work_orders
    owner to pgadmin;

create table workflow_states
(
    id          serial
        primary key,
    workflow_id integer not null
        constraint workflow_states_workflow_id_workflow_definitions_id_fk
            references workflow_definitions,
    state_name  text    not null,
    is_initial  boolean default false,
    is_final    boolean default false,
    color       text,
    icon        text
);

alter table workflow_states
    owner to pgadmin;

create table workflow_transitions
(
    id            serial
        primary key,
    workflow_id   integer not null
        constraint workflow_transitions_workflow_id_workflow_definitions_id_fk
            references workflow_definitions,
    from_state    text,
    to_state      text,
    action_name   text,
    allowed_roles jsonb default '[]'::jsonb,
    allowed_users jsonb default '[]'::jsonb,
    conditions    jsonb,
    auto_actions  jsonb
);

alter table workflow_transitions
    owner to pgadmin;

create table workstations
(
    id          serial
        primary key,
    name        text not null
        constraint workstations_name_unique
            unique,
    description text,
    hour_rate   numeric   default '0'::numeric,
    created_at  timestamp default now()
);

alter table workstations
    owner to pgadmin;

create table operations
(
    id               serial
        primary key,
    name             text not null,
    description      text,
    workstation_id   integer
        constraint operations_workstation_id_workstations_id_fk
            references workstations,
    default_duration numeric,
    created_at       timestamp default now()
);

alter table operations
    owner to pgadmin;

create table job_cards
(
    id                 serial
        primary key,
    wo_id              integer not null
        constraint job_cards_wo_id_work_orders_id_fk
            references work_orders,
    operation_id       integer
        constraint job_cards_operation_id_operations_id_fk
            references operations,
    workstation_id     integer
        constraint job_cards_workstation_id_workstations_id_fk
            references workstations,
    employee_id        integer
        constraint job_cards_employee_id_employees_id_fk
            references employees,
    status             job_card_status default 'OPEN'::job_card_status,
    planned_start_date timestamp,
    actual_start_date  timestamp,
    actual_finish_date timestamp,
    total_time_minutes integer         default 0,
    created_at         timestamp       default now(),
    updated_at         timestamp       default now()
);

alter table job_cards
    owner to pgadmin;

create table basts
(
    id               serial
        primary key,
    cover_info       jsonb not null,
    document_info    jsonb not null,
    delivering_party jsonb not null,
    receiving_party  jsonb not null,
    created_at       timestamp default now(),
    updated_at       timestamp default now()
);

alter table basts
    owner to pgadmin;

create table projects
(
    id                 serial
        primary key,
    identity           jsonb not null,
    document_relations jsonb     default '{}'::jsonb,
    finance            jsonb     default '{}'::jsonb,
    documents          jsonb     default '[]'::jsonb,
    created_at         timestamp default now(),
    updated_at         timestamp default now()
);

alter table projects
    owner to pgadmin;

create table tax_types
(
    id                   serial
        primary key,
    code                 text    not null
        unique,
    name                 text    not null,
    rate                 numeric not null,
    category             text    not null,
    description          text,
    regulation           text,
    applicable_documents jsonb     default '[]'::jsonb,
    document_url         text,
    is_active            boolean   default true,
    created_at           timestamp default now(),
    updated_at           timestamp default now()
);

alter table tax_types
    owner to pgadmin;

create table proposal_penawaran
(
    id                            serial
        primary key,
    cover_info                    jsonb   not null,
    proposal_number               text    not null,
    client_info                   jsonb   not null,
    client_background             text,
    offered_solution              text,
    working_method                text,
    timeline                      text,
    portfolio                     text,
    items                         jsonb   not null,
    total_estimated_cost          numeric not null,
    total_estimated_cost_in_words text    not null,
    currency                      text      default 'IDR'::text,
    scope_of_work                 jsonb     default '[]'::jsonb,
    terms_and_conditions          jsonb     default '[]'::jsonb,
    notes                         text,
    document_approval             jsonb   not null,
    status                        text      default 'draft'::text,
    created_at                    timestamp default now(),
    updated_at                    timestamp default now()
);

alter table proposal_penawaran
    owner to pgadmin;

create table positions
(
    id          serial
        primary key,
    name        text not null,
    code        text,
    description text,
    is_active   boolean   default true,
    created_at  timestamp default now(),
    updated_at  timestamp default now()
);

alter table positions
    owner to pgadmin;

create table organization_settings
(
    id                    serial
        primary key,
    company_name          text,
    company_email         text,
    company_phone         text,
    company_website       text,
    timezone              text      default 'Asia/Jakarta'::text,
    currency              text      default 'IDR'::text,
    date_format           text      default 'dd-mm-yyyy'::text,
    theme                 text      default 'system'::text,
    email_notifications   boolean   default true,
    push_notifications    boolean   default false,
    security_alerts       boolean   default true,
    two_factor_auth       boolean   default false,
    session_timeout       text      default '30m'::text,
    auto_assign_approver   boolean   default true,
    daily_backup          boolean   default true,
    soft_delete           boolean   default true,
    compact_mode          boolean   default false,
    default_approval_flow text      default 'sequential'::text,
    escalation_sla        text      default '24h'::text,
    retention_period      text      default '365d'::text,
    billing_email         text,
    current_plan          text      default 'enterprise'::text,
    config                jsonb     default '{}'::jsonb,
    created_at            timestamp default now(),
    updated_at            timestamp default now()
);

alter table organization_settings
    owner to pgadmin;

create table finance_transactions
(
    id              serial
        primary key,
    transaction_id  text                                not null
        constraint finance_transactions_transaction_id_unique
            unique,
    date            date                                not null,
    entity          text                                not null,
    category        text                                not null,
    amount          numeric                             not null,
    type            finance_transaction_type            not null,
    status          finance_transaction_status          not null,
    created_at      timestamp default now(),
    updated_at      timestamp default now()
);

alter table finance_transactions
    owner to pgadmin;

create table report_templates
(
    id          serial
        primary key,
    name        varchar(200)                            not null,
    description text,
    type        report_type                             not null,
    query       jsonb                                   not null,
    filters     jsonb,
    columns     jsonb                                   not null,
    created_by  integer
        constraint report_templates_created_by_users_id_fk
            references users,
    created_at  timestamp default now(),
    updated_at  timestamp default now()
);

alter table report_templates
    owner to pgadmin;

create table report_schedules
(
    id          serial
        primary key,
    template_id integer                                 not null
        constraint report_schedules_template_id_report_templates_id_fk
            references report_templates,
    frequency   report_frequency                         not null,
    recipients  jsonb                                    not null,
    last_run    timestamp,
    next_run    timestamp                                not null,
    is_active   boolean   default true,
    created_at  timestamp default now()
);

alter table report_schedules
    owner to pgadmin;

create table generated_reports
(
    id           serial
        primary key,
    template_id  integer
        constraint generated_reports_template_id_report_templates_id_fk
            references report_templates,
    data         jsonb                                   not null,
    filters      jsonb,
    generated_by integer
        constraint generated_reports_generated_by_users_id_fk
            references users,
    generated_at timestamp default now(),
    file_url     varchar(500)
);

alter table generated_reports
    owner to pgadmin;

create table dashboard_widgets
(
    id               serial
        primary key,
    user_id          integer                                 not null
        constraint dashboard_widgets_user_id_users_id_fk
            references users,
    type             varchar(50)                             not null,
    title            varchar(200)                            not null,
    config           jsonb                                   not null,
    data_source      varchar(100)                            not null,
    refresh_interval integer,
    created_at       timestamp default now(),
    updated_at       timestamp default now()
);

alter table dashboard_widgets
    owner to pgadmin;

create table dashboard_layouts
(
    id         serial
        primary key,
    user_id    integer                                 not null
        constraint dashboard_layouts_user_id_unique
            unique
        constraint dashboard_layouts_user_id_users_id_fk
            references users,
    layout     jsonb                                   not null,
    updated_at timestamp default now()
);

alter table dashboard_layouts
    owner to pgadmin;

create table custom_kpis
(
    id           serial
        primary key,
    name         varchar(200)                            not null,
    description  text,
    formula      text                                    not null,
    data_source  jsonb                                   not null,
    threshold    jsonb,
    created_by   integer
        constraint custom_kpis_created_by_users_id_fk
            references users,
    created_at   timestamp default now(),
    updated_at   timestamp default now()
);

alter table custom_kpis
    owner to pgadmin;

