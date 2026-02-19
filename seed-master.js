/**
 * CoreApps ERP — Master Seed Script (production-accurate schema)
 * Run inside notification-service container:
 *   docker compose exec notification-service sh -c
 *     "cp /app/seed-master.js /app/services/notification-service/seed-master.js &&
 *      cd /app/services/notification-service && node seed-master.js"
 *
 * Login Credentials after seeding:
 *   admin         / Admin@123    (SUPER_ADMIN)
 *   hr_admin      / HrAdmin@123  (HR_ADMIN)
 *   finance_admin / Finance@123  (FINANCE_ADMIN)
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DB_URL });

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString();

// ─── Users ────────────────────────────────────────────────────────────────────
// Real columns: id, username, password, role, created_at
async function seedUsers() {
    console.log('\n👤 Seeding users...');

    // Check if pgcrypto is available
    let usePgcrypto = false;
    try {
        await pool.query(`SELECT crypt('test', gen_salt('bf', 4))`);
        usePgcrypto = true;
        console.log('   Using pgcrypto bcrypt');
    } catch {
        console.log('   ⚠️  pgcrypto not available — passwords stored as plain text (change in production!)');
    }

    const users = [
        { username: 'admin', password: 'Admin@123', role: 'SUPER_ADMIN' },
        { username: 'hr_admin', password: 'HrAdmin@123', role: 'HR_ADMIN' },
        { username: 'finance_admin', password: 'Finance@123', role: 'FINANCE_ADMIN' },
    ];

    const ids = [];
    for (const u of users) {
        let res;
        if (usePgcrypto) {
            res = await pool.query(
                `INSERT INTO users (username, password, role, created_at)
         VALUES ($1, crypt($2, gen_salt('bf', 10)), $3, NOW())
         ON CONFLICT (username) DO UPDATE SET password = crypt($2, gen_salt('bf', 10))
         RETURNING id`,
                [u.username, u.password, u.role]
            );
        } else {
            res = await pool.query(
                `INSERT INTO users (username, password, role, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (username) DO UPDATE SET password = $2
         RETURNING id`,
                [u.username, u.password, u.role]
            );
        }
        ids.push(res.rows[0].id);
        console.log(`   ✅ ${u.username} / ${u.password} [${u.role}]`);
    }
    return ids;
}

// ─── Employees ────────────────────────────────────────────────────────────────
// Real columns: id, nik, name, ktp, npwp, ptkp, department, position,
//               join_date, status, bank_name, bank_account, created_at, updated_at, deleted_at
async function seedEmployees() {
    console.log('\n👥 Seeding employees...');
    const employees = [
        { nik: 'EMP001', name: 'Andi Wijaya', dept: 'Engineering', pos: 'Project Manager', ktp: '3171012345670001', npwp: '12.345.678.9-001.000', bank: 'Mandiri', account: '1234567890' },
        { nik: 'EMP002', name: 'Siti Rahayu', dept: 'HR', pos: 'HR GA', ktp: '3171012345670002', npwp: '12.345.678.9-002.000', bank: 'BCA', account: '2345678901' },
        { nik: 'EMP003', name: 'Budi Santoso', dept: 'Finance', pos: 'Finance Accounting', ktp: '3171012345670003', npwp: '12.345.678.9-003.000', bank: 'BNI', account: '3456789012' },
        { nik: 'EMP004', name: 'Dewi Kusuma', dept: 'IT', pos: 'SA', ktp: '3171012345670004', npwp: '12.345.678.9-004.000', bank: 'BRI', account: '4567890123' },
        { nik: 'EMP005', name: 'Reza Firmansyah', dept: 'Operations', pos: 'Tenaga Ahli', ktp: '3171012345670005', npwp: '12.345.678.9-005.000', bank: 'Mandiri', account: '5678901234' },
        { nik: 'EMP006', name: 'Nurul Hidayah', dept: 'Engineering', pos: 'Technical Writer', ktp: '3171012345670006', npwp: '12.345.678.9-006.000', bank: 'BCA', account: '6789012345' },
        { nik: 'EMP007', name: 'Hendra Gunawan', dept: 'IT', pos: 'EOS Oracle', ktp: '3171012345670007', npwp: '12.345.678.9-007.000', bank: 'BNI', account: '7890123456' },
        { nik: 'EMP008', name: 'Rina Marlina', dept: 'Operations', pos: 'Secretary Office', ktp: '3171012345670008', npwp: '12.345.678.9-008.000', bank: 'BRI', account: '8901234567' },
        { nik: 'EMP009', name: 'Agus Prasetyo', dept: 'Engineering', pos: 'EOS Ticketing', ktp: '3171012345670009', npwp: '12.345.678.9-009.000', bank: 'Mandiri', account: '9012345678' },
        { nik: 'EMP010', name: 'Maya Sari', dept: 'Finance', pos: 'Finance Accounting', ktp: '3171012345670010', npwp: '12.345.678.9-010.000', bank: 'BCA', account: '0123456789' },
    ];

    const ids = [];
    for (const e of employees) {
        const res = await pool.query(
            `INSERT INTO employees (nik, name, ktp, npwp, department, position, join_date, status, bank_name, bank_account, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),'ACTIVE',$7,$8,NOW(),NOW())
       ON CONFLICT (nik) DO UPDATE SET updated_at=NOW()
       RETURNING id`,
            [e.nik, e.name, e.ktp, e.npwp, e.dept, e.pos, e.bank, e.account]
        ).catch(err => { console.log(`   ⚠️  ${e.nik}: ${err.message.split('\n')[0]}`); return { rows: [] }; });
        if (res.rows.length) ids.push(res.rows[0].id);
    }
    const all = await pool.query(`SELECT id FROM employees`);
    console.log(`   ✅ ${all.rows.length} employees`);
    return all.rows.map(r => r.id);
}

// ─── Leave Types ──────────────────────────────────────────────────────────────
// Real columns: id, name, max_days_per_year, carry_forward, is_paid, created_at
async function seedLeaveTypes() {
    console.log('\n🏖️  Seeding leave types...');
    const types = [
        ['Cuti Tahunan', 12, true, true],
        ['Cuti Sakit', 12, false, true],
        ['Cuti Darurat', 3, false, true],
        ['Cuti Melahirkan', 90, false, true],
        ['Cuti Ayah', 2, false, true],
        ['Cuti Tidak Dibayar', 30, false, false],
    ];
    for (const [name, max, carry, paid] of types) {
        await pool.query(
            `INSERT INTO leave_types (name, max_days_per_year, carry_forward, is_paid, created_at)
       VALUES ($1,$2,$3,$4,NOW()) ON CONFLICT (name) DO NOTHING`,
            [name, max, carry, paid]
        ).catch(() => { });
    }
    const all = await pool.query(`SELECT id FROM leave_types`);
    console.log(`   ✅ ${all.rows.length} leave types`);
    return all.rows.map(r => r.id);
}

// ─── Clients ──────────────────────────────────────────────────────────────────
// Real columns: id, name, address, email, phone, created_at, updated_at
async function seedClients() {
    console.log('\n🏢 Seeding clients...');
    const clients = [
        ['PT Maju Bersama', 'Jl. Sudirman No. 1, Jakarta', 'info@majubersama.co.id', '021-5551001'],
        ['CV Karya Mandiri', 'Jl. Asia Afrika No. 5, Bandung', 'contact@karyamandiri.com', '022-5552002'],
        ['PT Teknologi Nusantara', 'Jl. Pemuda No. 10, Surabaya', 'admin@teknusa.co.id', '031-5553003'],
        ['PT Solusi Digital', 'Jl. HR Rasuna Said No. 20, Jakarta', 'hello@solusidigital.id', '021-5554004'],
        ['Pemda Kota Bekasi', 'Jl. Ahmad Yani No. 1, Bekasi', 'pengadaan@bekasikota.go.id', '021-5555005'],
    ];
    for (const [name, address, email, phone] of clients) {
        await pool.query(
            `INSERT INTO clients (name, address, email, phone, created_at, updated_at)
       VALUES ($1,$2,$3,$4,NOW(),NOW()) ON CONFLICT DO NOTHING`,
            [name, address, email, phone]
        ).catch(() => { });
    }
    const all = await pool.query(`SELECT id FROM clients`);
    console.log(`   ✅ ${all.rows.length} clients`);
    return all.rows.map(r => r.id);
}

// ─── Vendors ──────────────────────────────────────────────────────────────────
// Real columns: id, name, contact_name, email, phone, address, created_at, updated_at
async function seedVendors() {
    console.log('\n🏭 Seeding vendors...');
    const vendors = [
        ['PT Sumber Makmur', 'Pak Hendra', 'vendor@sumbermakmur.co.id', '021-6661001', 'Jl. Industri No. 5, Tangerang'],
        ['CV Bahan Baku Jaya', 'Bu Lestari', 'order@bahanbakujaya.com', '022-6662002', 'Jl. Raya Bandung No. 12'],
        ['PT Logistik Prima', 'Pak Santoso', 'ops@logistikprima.id', '031-6663003', 'Jl. Pelabuhan No. 3, Surabaya'],
    ];
    for (const [name, contact, email, phone, address] of vendors) {
        await pool.query(
            `INSERT INTO vendors (name, contact_name, email, phone, address, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) ON CONFLICT DO NOTHING`,
            [name, contact, email, phone, address]
        ).catch(() => { });
    }
    const all = await pool.query(`SELECT id FROM vendors`);
    console.log(`   ✅ ${all.rows.length} vendors`);
}

// ─── Accounts ─────────────────────────────────────────────────────────────────
// Real columns: id, code, name, type, description, balance, is_group, parent_account_id, created_at, updated_at
async function seedAccounts() {
    console.log('\n📚 Seeding chart of accounts...');
    const accounts = [
        ['1100', 'Kas', 'ASSET', '20000000', 'Kas tunai di tangan'],
        ['1200', 'Bank Mandiri', 'ASSET', '150000000', 'Rekening bank operasional'],
        ['1300', 'Piutang Usaha', 'ASSET', '75000000', 'Tagihan kepada pelanggan'],
        ['1400', 'Persediaan', 'ASSET', '30000000', 'Stok barang dan bahan'],
        ['1500', 'Aset Tetap', 'ASSET', '200000000', 'Aset tetap berwujud'],
        ['2000', 'Hutang Usaha', 'LIABILITY', '40000000', 'Kewajiban kepada pemasok'],
        ['2100', 'Hutang Pajak', 'LIABILITY', '5000000', 'Kewajiban pajak terutang'],
        ['2200', 'Hutang Gaji', 'LIABILITY', '15000000', 'Gaji yang belum dibayar'],
        ['3000', 'Modal Disetor', 'EQUITY', '300000000', 'Modal yang disetor pemegang saham'],
        ['3100', 'Laba Ditahan', 'EQUITY', '100000000', 'Akumulasi laba yang ditahan'],
        ['4000', 'Pendapatan Jasa', 'REVENUE', '250000000', 'Pendapatan dari jasa utama'],
        ['4100', 'Pendapatan Konsultasi', 'REVENUE', '80000000', 'Pendapatan jasa konsultasi'],
        ['5000', 'Beban Gaji', 'EXPENSE', '80000000', 'Biaya gaji karyawan'],
        ['5100', 'Beban Operasional', 'EXPENSE', '20000000', 'Biaya operasional umum'],
        ['5200', 'Beban Perjalanan Dinas', 'EXPENSE', '5000000', 'Biaya perjalanan dinas'],
        ['5300', 'Beban Penyusutan', 'EXPENSE', '10000000', 'Penyusutan aset tetap'],
    ];
    const ids = {};
    for (const [code, name, type, balance, desc] of accounts) {
        const res = await pool.query(
            `INSERT INTO accounts (code, name, type, description, balance, is_group, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,false,NOW(),NOW())
       ON CONFLICT (code) DO UPDATE SET updated_at=NOW()
       RETURNING id`,
            [code, name, type, desc, balance]
        ).catch(() => ({ rows: [] }));
        if (res.rows.length) ids[code] = res.rows[0].id;
    }
    // Refresh from DB
    const all = await pool.query(`SELECT id, code FROM accounts`);
    all.rows.forEach(r => { ids[r.code] = r.id; });
    console.log(`   ✅ ${all.rows.length} accounts`);
    return ids;
}

// ─── Products ─────────────────────────────────────────────────────────────────
// Real columns: id, name, sku, description, price, cost, unit, category, stock_quantity, created_at, updated_at, is_active, weight, image_url
async function seedProducts() {
    console.log('\n📦 Seeding products...');
    const products = [
        ['Laptop Dell Latitude 5540', 'IT-001', 'Laptop bisnis performa tinggi', '15000000', '12000000', 'Unit', 'Electronics', '50'],
        ['Monitor LG 24"', 'IT-002', 'Monitor IPS Full HD 24 inci', '3500000', '2800000', 'Unit', 'Electronics', '30'],
        ['Meja Kerja Standar', 'FRN-001', 'Meja kerja kayu standar kantor', '2000000', '1500000', 'Unit', 'Furniture', '20'],
        ['Kursi Ergonomis', 'FRN-002', 'Kursi kantor ergonomis dengan sandaran', '3000000', '2200000', 'Unit', 'Furniture', '25'],
        ['Kertas HVS A4 (Rim)', 'SUP-001', 'Kertas HVS A4 80gsm 500 lembar', '65000', '50000', 'Rim', 'Supplies', '200'],
        ['Tinta Printer Canon', 'SUP-002', 'Tinta printer Canon original', '120000', '90000', 'Pcs', 'Supplies', '100'],
        ['Server HP ProLiant DL380', 'SRV-001', 'Server rack 2U enterprise', '80000000', '65000000', 'Unit', 'Electronics', '5'],
        ['Switch Cisco 24 Port', 'NET-001', 'Managed switch 24 port gigabit', '12000000', '9000000', 'Unit', 'Networking', '10'],
        ['UPS APC 1500VA', 'PWR-001', 'UPS online 1500VA dengan AVR', '4500000', '3500000', 'Unit', 'Electronics', '15'],
        ['Lisensi Microsoft Office', 'SW-001', 'Lisensi Microsoft Office 365 1 tahun', '2500000', '2000000', 'Lisensi', 'Software', '50'],
    ];
    const ids = [];
    for (const [name, sku, desc, price, cost, unit, cat, stock] of products) {
        const res = await pool.query(
            `INSERT INTO products (name, sku, description, price, cost, unit, category, stock_quantity, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW(),NOW())
       ON CONFLICT (sku) DO UPDATE SET updated_at=NOW()
       RETURNING id`,
            [name, sku, desc, price, cost, unit, cat, stock]
        ).catch(() => ({ rows: [] }));
        if (res.rows.length) ids.push(res.rows[0].id);
    }
    const all = await pool.query(`SELECT id FROM products`);
    console.log(`   ✅ ${all.rows.length} products`);
    return all.rows.map(r => r.id);
}

// ─── Warehouses ───────────────────────────────────────────────────────────────
// Real columns: id, name, location, parent_warehouse_id, created_at
async function seedWarehouses() {
    console.log('\n🏭 Seeding warehouses...');
    const warehouses = [
        ['Gudang Utama Jakarta', 'Jakarta Utara'],
        ['Gudang Bandung', 'Bandung'],
        ['Pusat Distribusi Bekasi', 'Bekasi'],
    ];
    for (const [name, loc] of warehouses) {
        await pool.query(
            `INSERT INTO warehouses (name, location, created_at) VALUES ($1,$2,NOW()) ON CONFLICT (name) DO NOTHING`,
            [name, loc]
        ).catch(() => { });
    }
    const all = await pool.query(`SELECT id FROM warehouses`);
    console.log(`   ✅ ${all.rows.length} warehouses`);
    return all.rows.map(r => r.id);
}

// ─── Leads ────────────────────────────────────────────────────────────────────
// Real columns: id, name, company, email, phone, status, source, notes, created_at, updated_at
async function seedLeads() {
    console.log('\n📊 Seeding CRM leads...');
    const leads = [
        ['Ahmad Fauzi', 'PT Infrastruktur Nusantara', 'ahmad@infranus.co.id', '08111001001', 'NEW', 'Website', 'Tertarik dengan modul ERP'],
        ['Linda Susanti', 'CV Digital Kreatif', 'linda@digitalkreatif.com', '08122002002', 'CONTACTED', 'Referral', 'Direferensikan oleh klien lama'],
        ['Doni Prasetya', 'PT Energi Terbarukan', 'doni@energiterbarukan.id', '08133003003', 'QUALIFIED', 'Exhibition', 'Bertemu di pameran IT Expo 2025'],
        ['Yuni Astuti', 'Dinas Kominfo Kota Bogor', 'yuni@bogorkota.go.id', '08144004004', 'QUALIFIED', 'Government', 'Pengadaan sistem informasi daerah'],
        ['Rizal Hakim', 'PT Manufaktur Andalan', 'rizal@manufaktur.co.id', '08155005005', 'CONVERTED', 'Cold Call', 'Sudah deal, lanjut ke opportunity'],
    ];
    for (const [name, company, email, phone, status, source, notes] of leads) {
        await pool.query(
            `INSERT INTO leads (name, company, email, phone, status, source, notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) ON CONFLICT DO NOTHING`,
            [name, company, email, phone, status, source, notes]
        ).catch(() => { });
    }
    const all = await pool.query(`SELECT id FROM leads`);
    console.log(`   ✅ ${all.rows.length} leads`);
    return all.rows.map(r => r.id);
}

// ─── Opportunities ────────────────────────────────────────────────────────────
// Real columns: id, name, lead_id, client_id, amount, probability, stage, expected_close_date, notes, created_at, updated_at
async function seedOpportunities(leadIds, clientIds) {
    console.log('\n💡 Seeding opportunities...');
    const opps = [
        ['Implementasi ERP PT Maju Bersama', '150000000', 70, 'PROPOSAL', 30],
        ['Konsultasi IT CV Karya Mandiri', '50000000', 50, 'QUALIFICATION', 45],
        ['Pengembangan Sistem Pemda Bekasi', '500000000', 80, 'NEGOTIATION', 60],
        ['Lisensi Software PT Teknologi', '25000000', 90, 'CLOSED_WON', 0],
        ['Maintenance Support PT Solusi Digital', '75000000', 60, 'PROSPECTING', 90],
    ];
    for (let i = 0; i < opps.length; i++) {
        const [name, amount, prob, stage, days] = opps[i];
        await pool.query(
            `INSERT INTO opportunities (name, lead_id, client_id, amount, probability, stage, expected_close_date, notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) ON CONFLICT DO NOTHING`,
            [name, leadIds[i % leadIds.length], clientIds[i % clientIds.length], amount, prob, stage, daysFromNow(days), `Peluang bisnis: ${name}`]
        ).catch(() => { });
    }
    console.log(`   ✅ ${opps.length} opportunities`);
}

// ─── Quotations ───────────────────────────────────────────────────────────────
// Real columns: id, number, client_id, date, items, subtotal, ppn, grand_total, scope_of_work, status, created_at, updated_at
async function seedQuotations(clientIds) {
    console.log('\n📋 Seeding quotations...');
    const items = JSON.stringify([
        { description: 'Implementasi Sistem ERP', qty: 1, unit: 'Paket', unitPrice: 100000000, total: 100000000 },
        { description: 'Training & Onboarding', qty: 5, unit: 'Hari', unitPrice: 5000000, total: 25000000 },
        { description: 'Support 1 Tahun', qty: 1, unit: 'Tahun', unitPrice: 25000000, total: 25000000 },
    ]);
    const quotations = [
        ['QUO/2026/001', clientIds[0], '150000000', '16500000', '166500000', 'SENT'],
        ['QUO/2026/002', clientIds[1], '50000000', '5500000', '55500000', 'DRAFT'],
        ['QUO/2026/003', clientIds[2], '200000000', '22000000', '222000000', 'APPROVED'],
    ];
    for (const [number, clientId, sub, ppn, grand, status] of quotations) {
        await pool.query(
            `INSERT INTO quotations (number, client_id, date, items, subtotal, ppn, grand_total, scope_of_work, status, created_at, updated_at)
       VALUES ($1,$2,NOW(),$3,$4,$5,$6,$7,$8,NOW(),NOW()) ON CONFLICT (number) DO NOTHING`,
            [number, clientId, items, sub, ppn, grand, 'Implementasi sistem ERP lengkap termasuk training dan support', status]
        ).catch(() => { });
    }
    console.log(`   ✅ ${quotations.length} quotations`);
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
// Real columns: id, number, quotation_id, client_id, date, due_date, items, subtotal, ppn, pph, grand_total, status, pdf_locked, created_at, updated_at, paid_amount, journal_entry_id
async function seedInvoices(clientIds) {
    console.log('\n💰 Seeding invoices...');
    const items = JSON.stringify([
        { description: 'Jasa Implementasi ERP', qty: 1, unit: 'Paket', unitPrice: 100000000, total: 100000000 },
        { description: 'Biaya Perjalanan Dinas', qty: 3, unit: 'Trip', unitPrice: 5000000, total: 15000000 },
    ]);
    const invoices = [
        ['INV/2026/001', clientIds[0], '115000000', '12650000', '0', '127650000', '127650000', 'PAID', -30],
        ['INV/2026/002', clientIds[1], '50000000', '5500000', '0', '55500000', '0', 'ISSUED', 15],
        ['INV/2026/003', clientIds[2], '200000000', '22000000', '0', '222000000', '100000000', 'PARTIAL', 30],
        ['INV/2026/004', clientIds[3 % clientIds.length], '75000000', '8250000', '0', '83250000', '0', 'DRAFT', 45],
        ['INV/2026/005', clientIds[4 % clientIds.length], '500000000', '55000000', '0', '555000000', '0', 'ISSUED', 60],
    ];
    for (const [number, clientId, sub, ppn, pph, grand, paid, status, dueOffset] of invoices) {
        await pool.query(
            `INSERT INTO invoices (number, client_id, date, due_date, items, subtotal, ppn, pph, grand_total, paid_amount, status, pdf_locked, created_at, updated_at)
       VALUES ($1,$2,NOW(),$3,$4,$5,$6,$7,$8,$9,$10,false,NOW(),NOW()) ON CONFLICT (number) DO NOTHING`,
            [number, clientId, daysFromNow(dueOffset), items, sub, ppn, pph, grand, paid, status]
        ).catch(() => { });
    }
    console.log(`   ✅ ${invoices.length} invoices`);
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────
// Real columns: id, number, supplier_id, supplier_name, date, items, subtotal, tax, grand_total, status, created_at, updated_at
async function seedPurchaseOrders() {
    console.log('\n🛒 Seeding purchase orders...');
    const items = JSON.stringify([
        { description: 'Laptop Dell Latitude', qty: 5, unit: 'Unit', unitPrice: 12000000, total: 60000000 },
        { description: 'Monitor LG 24"', qty: 5, unit: 'Unit', unitPrice: 2800000, total: 14000000 },
    ]);
    const pos = [
        ['PO/2026/001', 'PT Sumber Makmur', '74000000', '8140000', '82140000', 'APPROVED'],
        ['PO/2026/002', 'CV Bahan Baku Jaya', '30000000', '3300000', '33300000', 'SENT'],
        ['PO/2026/003', 'PT Logistik Prima', '15000000', '1650000', '16650000', 'DRAFT'],
    ];
    for (const [number, supplier, sub, tax, grand, status] of pos) {
        await pool.query(
            `INSERT INTO purchase_orders (number, supplier_name, date, items, subtotal, tax, grand_total, status, created_at, updated_at)
       VALUES ($1,$2,NOW(),$3,$4,$5,$6,$7,NOW(),NOW()) ON CONFLICT (number) DO NOTHING`,
            [number, supplier, items, sub, tax, grand, status]
        ).catch(() => { });
    }
    console.log(`   ✅ ${pos.length} purchase orders`);
}

// ─── Journal Entries ──────────────────────────────────────────────────────────
// Real columns: id, date, description, reference, status, total_debit, total_credit, created_at, updated_at, posted_at
async function seedJournalEntries() {
    console.log('\n📝 Seeding journal entries...');
    const entries = [
        ['Penerimaan Pembayaran INV/2026/001', 'INV/2026/001', 'POSTED', '127650000', '127650000'],
        ['Pembayaran Gaji Januari 2026', 'PAYROLL/2026/01', 'POSTED', '80000000', '80000000'],
        ['Pembelian Laptop 5 Unit', 'PO/2026/001', 'POSTED', '60000000', '60000000'],
        ['Beban Perjalanan Dinas Q1', 'EXP/2026/001', 'DRAFT', '5000000', '5000000'],
    ];
    for (const [desc, ref, status, debit, credit] of entries) {
        await pool.query(
            `INSERT INTO journal_entries (date, description, reference, status, total_debit, total_credit, posted_at, created_at, updated_at)
       VALUES (NOW(),$1,$2,$3,$4,$5,$6,NOW(),NOW())`,
            [desc, ref, status, debit, credit, status === 'POSTED' ? new Date().toISOString() : null]
        ).catch(() => { });
    }
    console.log(`   ✅ ${entries.length} journal entries`);
}

// ─── Salary Structures ────────────────────────────────────────────────────────
// Real columns: id, employee_id, base_salary, allowances, deductions, salary_expense_account_id, payroll_payable_account_id, created_at, updated_at
async function seedSalaryStructures(employeeIds, accountIds) {
    console.log('\n💵 Seeding salary structures...');
    const salaries = [8000000, 6000000, 5000000, 4500000, 7000000, 4000000, 6500000, 3500000, 5500000, 4200000];
    const expenseAccId = accountIds['5000'] || null;
    const payableAccId = accountIds['2200'] || null;
    let count = 0;
    for (let i = 0; i < Math.min(employeeIds.length, salaries.length); i++) {
        const base = salaries[i];
        await pool.query(
            `INSERT INTO salary_structures (employee_id, base_salary, allowances, deductions, salary_expense_account_id, payroll_payable_account_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) ON CONFLICT (employee_id) DO NOTHING`,
            [employeeIds[i], base, Math.round(base * 0.1), Math.round(base * 0.05), expenseAccId, payableAccId]
        ).catch(() => { });
        count++;
    }
    console.log(`   ✅ ${count} salary structures`);
}

// ─── Attendance ───────────────────────────────────────────────────────────────
// Real columns: id, employee_id, date, status, check_in, check_out, working_hours, created_at
async function seedAttendance(employeeIds) {
    console.log('\n🕐 Seeding attendance...');
    const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'HALF_DAY', 'ON_LEAVE'];
    let count = 0;
    for (const empId of employeeIds.slice(0, 5)) {
        for (let day = 1; day <= 20; day++) {
            const date = new Date(2026, 0, day);
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            const status = rand(statuses);
            await pool.query(
                `INSERT INTO attendance (employee_id, date, status, check_in, check_out, working_hours, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW()) ON CONFLICT DO NOTHING`,
                [empId, date.toISOString(), status, status === 'PRESENT' ? '08:00' : null, status === 'PRESENT' ? '17:00' : null, status === 'PRESENT' ? 8 : 0]
            ).catch(() => { });
            count++;
        }
    }
    console.log(`   ✅ ${count} attendance records`);
}

// ─── Leave Allocations ────────────────────────────────────────────────────────
// Real columns: id, employee_id, leave_type_id, fiscal_year, total_days, used_days, created_at
async function seedLeaveAllocations(employeeIds, leaveTypeIds) {
    console.log('\n📆 Seeding leave allocations...');
    let count = 0;
    for (const empId of employeeIds) {
        for (const ltId of leaveTypeIds) {
            await pool.query(
                `INSERT INTO leave_allocations (employee_id, leave_type_id, fiscal_year, total_days, used_days, created_at)
         VALUES ($1,$2,2026,12,0,NOW()) ON CONFLICT DO NOTHING`,
                [empId, ltId]
            ).catch(() => { });
            count++;
        }
    }
    console.log(`   ✅ ${count} leave allocations`);
}

// ─── Leave Applications ───────────────────────────────────────────────────────
// Real columns: id, employee_id, leave_type_id, from_date, to_date, total_days, reason, status, approved_by, workflow_instance_id, created_at, updated_at
async function seedLeaveApplications(employeeIds, leaveTypeIds, userIds) {
    console.log('\n📅 Seeding leave applications...');
    const apps = [
        [0, 0, '2026-02-10', '2026-02-12', 3, 'Keperluan keluarga', 'APPROVED'],
        [1, 1, '2026-02-05', '2026-02-06', 2, 'Sakit demam', 'APPROVED'],
        [2, 0, '2026-03-01', '2026-03-03', 3, 'Liburan', 'PENDING'],
        [3, 2, '2026-02-20', '2026-02-20', 1, 'Urusan darurat', 'APPROVED'],
        [4, 0, '2026-04-07', '2026-04-11', 5, 'Cuti tahunan', 'PENDING'],
    ];
    for (const [ei, li, from, to, days, reason, status] of apps) {
        await pool.query(
            `INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, total_days, reason, status, approved_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) ON CONFLICT DO NOTHING`,
            [
                employeeIds[ei % employeeIds.length],
                leaveTypeIds[li % leaveTypeIds.length],
                from, to, days, reason, status,
                status === 'APPROVED' ? userIds[0] : null
            ]
        ).catch(() => { });
    }
    console.log(`   ✅ ${apps.length} leave applications`);
}

// ─── Assets ───────────────────────────────────────────────────────────────────
// Real columns: id, name, category, purchase_date, purchase_amount, owner_id, location, depreciation_method, total_depreciation, value_after_depreciation, status, created_at, updated_at
async function seedAssets(employeeIds) {
    console.log('\n🏗️  Seeding assets...');
    const assets = [
        ['Gedung Kantor Jakarta', 'BUILDING', '2020-01-01', '2000000000', 'SLM', 'Jakarta Selatan'],
        ['Mobil Operasional Toyota', 'VEHICLES', '2022-06-15', '350000000', 'WDV', 'Pool Kendaraan'],
        ['Server HP ProLiant', 'ELECTRONICS', '2023-03-01', '80000000', 'SLM', 'Server Room'],
        ['Meja Rapat Besar', 'FURNITURE', '2021-09-01', '15000000', 'SLM', 'Ruang Rapat'],
        ['Mesin Fotokopi Canon', 'MACHINERY', '2022-01-10', '25000000', 'SLM', 'Ruang Admin'],
    ];
    const ids = [];
    for (let i = 0; i < assets.length; i++) {
        const [name, cat, pdate, amount, method, loc] = assets[i];
        const res = await pool.query(
            `INSERT INTO assets (name, category, purchase_date, purchase_amount, owner_id, location, depreciation_method, total_depreciation, value_after_depreciation, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,$4,'ACTIVE',NOW(),NOW()) ON CONFLICT DO NOTHING RETURNING id`,
            [name, cat, pdate, amount, employeeIds[i % employeeIds.length], loc, method]
        ).catch(() => ({ rows: [] }));
        if (res.rows.length) ids.push(res.rows[0].id);
    }
    console.log(`   ✅ ${ids.length} assets`);
    return ids;
}

// ─── Asset Maintenances ───────────────────────────────────────────────────────
// Real columns: id, asset_id, type, scheduled_date, completion_date, cost, performed_by, created_at
async function seedAssetMaintenances(assetIds) {
    console.log('\n🔧 Seeding asset maintenances...');
    for (const assetId of assetIds.slice(0, 3)) {
        await pool.query(
            `INSERT INTO asset_maintenances (asset_id, type, scheduled_date, completion_date, cost, performed_by, created_at)
       VALUES ($1,'PREVENTIVE',$2,$3,500000,'Tim Teknis',NOW()) ON CONFLICT DO NOTHING`,
            [assetId, daysAgo(30), daysAgo(28)]
        ).catch(() => { });
    }
    console.log(`   ✅ ${Math.min(assetIds.length, 3)} maintenance records`);
}

// ─── Manufacturing ────────────────────────────────────────────────────────────
async function seedManufacturing(productIds, warehouseIds) {
    console.log('\n🏭 Seeding manufacturing...');
    // Workstations
    const ws = [
        ['Assembly Line A', 'Lini perakitan utama', '150000'],
        ['Quality Control', 'Stasiun QC', '100000'],
        ['Packaging', 'Stasiun pengemasan', '80000'],
    ];
    for (const [name, desc, rate] of ws) {
        await pool.query(
            `INSERT INTO workstations (name, description, hour_rate, created_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (name) DO NOTHING`,
            [name, desc, rate]
        ).catch(() => { });
    }

    // BOM
    if (productIds.length >= 2) {
        const bomRes = await pool.query(
            `INSERT INTO boms (item_id, name, quantity, is_default, is_active, total_cost, created_at, updated_at)
       VALUES ($1,'BOM-LAPTOP-BUNDLE',10,true,true,120000000,NOW(),NOW()) ON CONFLICT DO NOTHING RETURNING id`,
            [productIds[0]]
        ).catch(() => ({ rows: [] }));
        if (bomRes.rows.length) {
            await pool.query(
                `INSERT INTO bom_items (bom_id, item_id, quantity, scrap_rate, cost) VALUES ($1,$2,5,0.02,60000000) ON CONFLICT DO NOTHING`,
                [bomRes.rows[0].id, productIds[1]]
            ).catch(() => { });
        }
    }

    // Work Order
    const bomRow = await pool.query(`SELECT id FROM boms LIMIT 1`).catch(() => ({ rows: [] }));
    if (bomRow.rows.length && productIds.length) {
        await pool.query(
            `INSERT INTO work_orders (wo_number, bom_id, item_id, qty_to_produce, warehouse_id, status, planned_start_date, created_at, updated_at)
       VALUES ('WO/2026/001',$1,$2,10,$3,'IN_PROGRESS',$4,NOW(),NOW()) ON CONFLICT (wo_number) DO NOTHING`,
            [bomRow.rows[0].id, productIds[0], warehouseIds[0] || null, daysAgo(5)]
        ).catch(() => { });
    }
    console.log(`   ✅ workstations + BOM + work order`);
}

// ─── Notifications ────────────────────────────────────────────────────────────
// Real columns: id, user_id, type, title, message, link, icon, is_read, created_at
async function seedNotifications(userIds) {
    console.log('\n🔔 Seeding notifications...');
    const notifs = [
        ['INFO', 'Selamat Datang', 'Selamat datang di CoreApps ERP! Sistem siap digunakan.'],
        ['SUCCESS', 'Invoice Dibayar', 'Invoice INV/2026/001 telah dibayar lunas oleh PT Maju Bersama.'],
        ['WARNING', 'Stok Menipis', 'Stok Kertas HVS A4 hampir habis. Segera lakukan pemesanan.'],
        ['INFO', 'Cuti Disetujui', 'Pengajuan cuti Anda untuk 10-12 Feb 2026 telah disetujui.'],
        ['ERROR', 'Pembayaran Jatuh Tempo', 'Invoice INV/2026/002 akan jatuh tempo dalam 3 hari.'],
    ];
    let count = 0;
    for (const userId of userIds) {
        for (const [type, title, message] of notifs) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES ($1,$2,$3,$4,false,NOW())`,
                [userId, type, title, message]
            ).catch(() => { });
            count++;
        }
    }
    console.log(`   ✅ ${count} notifications`);
}

// ─── Expense Claims ───────────────────────────────────────────────────────────
// Real columns: id, employee_id, date, category, description, amount, status, debit_account_id, credit_account_id, journal_entry_id, created_at, updated_at, posted_at
async function seedExpenseClaims(employeeIds, accountIds) {
    console.log('\n🧾 Seeding expense claims...');
    const debitId = accountIds['5200'] || accountIds['5100'] || Object.values(accountIds)[0];
    const creditId = accountIds['1200'] || accountIds['1100'] || Object.values(accountIds)[1];
    if (!debitId || !creditId) { console.log('   ⚠️  Skipped — accounts not found'); return; }
    const claims = [
        [0, 'Transport', 'Taksi ke klien PT Maju Bersama', '250000', 'APPROVED'],
        [1, 'Meals', 'Makan siang rapat tim', '350000', 'APPROVED'],
        [2, 'Accommodation', 'Hotel Bandung 2 malam', '1200000', 'SUBMITTED'],
        [3, 'Transport', 'Tiket pesawat Jakarta-Surabaya', '1500000', 'DRAFT'],
        [4, 'Communication', 'Pulsa dan internet lapangan', '200000', 'APPROVED'],
    ];
    for (const [ei, cat, desc, amount, status] of claims) {
        await pool.query(
            `INSERT INTO expense_claims (employee_id, date, category, description, amount, status, debit_account_id, credit_account_id, created_at, updated_at)
       VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7,NOW(),NOW())`,
            [employeeIds[ei % employeeIds.length], cat, desc, amount, status, debitId, creditId]
        ).catch(() => { });
    }
    console.log(`   ✅ ${claims.length} expense claims`);
}

// ─── Salary Slips ─────────────────────────────────────────────────────────────
// Real columns: id, employee_id, period_year, period_month, gross, total_deductions, net_pay, status, journal_entry_id, created_at, updated_at, posted_at
async function seedSalarySlips(employeeIds) {
    console.log('\n💳 Seeding salary slips...');
    const salaries = [8000000, 6000000, 5000000, 4500000, 7000000];
    let count = 0;
    for (let i = 0; i < Math.min(employeeIds.length, salaries.length); i++) {
        const gross = salaries[i];
        const allowances = Math.round(gross * 0.1);
        const deductions = Math.round(gross * 0.05);
        const net = gross + allowances - deductions;
        for (const month of [1, 2]) {
            await pool.query(
                `INSERT INTO salary_slips (employee_id, period_year, period_month, gross, total_deductions, net_pay, status, created_at, updated_at)
         VALUES ($1,2026,$2,$3,$4,$5,'POSTED',NOW(),NOW()) ON CONFLICT DO NOTHING`,
                [employeeIds[i], month, gross + allowances, deductions, net]
            ).catch(() => { });
            count++;
        }
    }
    console.log(`   ✅ ${count} salary slips`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   CoreApps ERP — Master Database Seed Script    ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`   DB: ${process.env.DB_URL?.replace(/:([^:@]+)@/, ':***@')}`);

    try {
        const userIds = await seedUsers();
        const employeeIds = await seedEmployees();
        const leaveTypeIds = await seedLeaveTypes();
        const clientIds = await seedClients();
        await seedVendors();
        const accountIds = await seedAccounts();
        const productIds = await seedProducts();
        const warehouseIds = await seedWarehouses();
        const leadIds = await seedLeads();

        if (leadIds.length && clientIds.length) await seedOpportunities(leadIds, clientIds);
        if (clientIds.length) {
            await seedQuotations(clientIds);
            await seedInvoices(clientIds);
        }
        await seedPurchaseOrders();
        await seedJournalEntries();

        if (employeeIds.length) {
            await seedSalaryStructures(employeeIds, accountIds);
            await seedSalarySlips(employeeIds);
            await seedAttendance(employeeIds);
            if (leaveTypeIds.length) {
                await seedLeaveAllocations(employeeIds, leaveTypeIds);
                if (userIds.length) await seedLeaveApplications(employeeIds, leaveTypeIds, userIds);
            }
            const assetIds = await seedAssets(employeeIds);
            if (assetIds.length) await seedAssetMaintenances(assetIds);
            if (Object.keys(accountIds).length) await seedExpenseClaims(employeeIds, accountIds);
        }

        if (productIds.length && warehouseIds.length) await seedManufacturing(productIds, warehouseIds);
        if (userIds.length) await seedNotifications(userIds);

        console.log('\n');
        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║              ✅ Seeding Complete!               ║');
        console.log('╠══════════════════════════════════════════════════╣');
        console.log('║  Login Credentials:                             ║');
        console.log('║  admin         / Admin@123    (SUPER_ADMIN)     ║');
        console.log('║  hr_admin      / HrAdmin@123  (HR_ADMIN)        ║');
        console.log('║  finance_admin / Finance@123  (FINANCE_ADMIN)   ║');
        console.log('╚══════════════════════════════════════════════════╝');
    } catch (err) {
        console.error('\n❌ Fatal error:', err.message);
        console.error(err.stack);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
