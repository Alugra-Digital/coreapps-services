
import { db } from './services/shared/db/index.js';
import { clients, invoices, expenseClaims, accounts, users } from './services/shared/db/schema.js';
import { pgTable, serial, text, timestamp, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { eq, sql } from 'drizzle-orm';

import bcrypt from 'bcryptjs';


// Local definitions to match current DB state
const employees = pgTable('employees', {
    id: serial('id').primaryKey(),
    nik: text('nik').notNull().unique(),
    name: text('name').notNull(),
    department: text('department'),
    position: text('position'),
    status: text('status').default('ACTIVE'),
    joinDate: timestamp('join_date'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
const MOCK_CLIENTS = [
    { name: 'Acme Corp', address: '123 Acme St, NY', email: 'contact@acme.com', phone: '123-456-7890' },
    { name: 'Globex Inc', address: '456 Globex Ave, CA', email: 'info@globex.com', phone: '987-654-3210' },
    { name: 'Soylent Corp', address: '789 Soylent Blvd, TX', email: 'sales@soylent.com', phone: '555-123-4567' }
];

const MOCK_EMPLOYEES = [
    { nik: 'EMP001', name: 'John Doe', department: 'Engineering', position: 'Software Engineer', status: 'ACTIVE', joinDate: new Date('2023-01-15') },
    { nik: 'EMP002', name: 'Jane Smith', department: 'HR', position: 'HR Manager', status: 'ACTIVE', joinDate: new Date('2022-05-10') },
    { nik: 'EMP003', name: 'Bob Johnson', department: 'Finance', position: 'Accountant', status: 'ACTIVE', joinDate: new Date('2021-11-20') }
];

const seed = async () => {
    console.log('🌱 Starting database seed...');

    try {
        // 1. Seed Accounts (Minimal for transactions)
        const accountData = [
            { code: '1000', name: 'Cash', type: 'ASSET' },
            { code: '4000', name: 'Sales', type: 'REVENUE' },
            { code: '5000', name: 'Expense', type: 'EXPENSE' },
        ];

        const accountMap = {};
        for (const acc of accountData) {
            const [existing] = await db.select().from(accounts).where(eq(accounts.code, acc.code));
            if (!existing) {
                const [newAcc] = await db.insert(accounts).values(acc).returning();
                accountMap[acc.code] = newAcc.id;
                console.log(`Created Account: ${acc.name}`);
            } else {
                accountMap[acc.code] = existing.id;
            }
        }

        /*
        // 2. Seed Clients
        const clientIds = [];
        for (const client of MOCK_CLIENTS) {
            const [newClient] = await db.insert(clients).values(client).returning();
            clientIds.push(newClient.id);
            console.log(`Created Client: ${client.name}`);
        }

        // 3. Seed Employees
        const employeeIds = [];
        for (const emp of MOCK_EMPLOYEES) {
            // Check generic fields to satisfy schema constraints like unique NIK
            const [existing] = await db.select().from(employees).where(eq(employees.nik, emp.nik));
            if (!existing) {
                const [newEmp] = await db.insert(employees).values({
                    ...emp,
                    // ktp: '1234567890', // Removing to avoid column error
                }).returning();
                employeeIds.push(newEmp.id);
                console.log(`Created Employee: ${emp.name}`);
            } else {
                employeeIds.push(existing.id);
            }
        }
        */
        // Fetch existing IDs for relations
        const clientIds = (await db.select().from(clients)).map(c => c.id);
        const employeeIds = (await db.select().from(employees)).map(e => e.id);

        // 4. Seed Invoices
        for (let i = 0; i < 5; i++) {
            const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
            const subtotal = Math.floor(Math.random() * 1000) + 500;
            const ppn = subtotal * 0.11;
            const grandTotal = subtotal + ppn;

            // Use raw SQL to bypass Drizzle schema checks for this specific insert
            await db.execute(sql`INSERT INTO invoices (number, client_id, date, due_date, items, subtotal, ppn, grand_total, status) VALUES 
            (${`INV/SEED/${1000 + i}`}, ${clientId}, ${new Date().toISOString()}, ${new Date().toISOString()}, ${JSON.stringify([{ description: 'Consulting Services', qty: 1, price: subtotal }])}, ${subtotal}, ${ppn}, ${grandTotal}, 'ISSUED')`);
            console.log(`Created Invoice: INV/SEED/${1000 + i}`);
        }

        // 5. Seed Expenses
        for (let i = 0; i < 5; i++) {
            const employeeId = employeeIds[Math.floor(Math.random() * employeeIds.length)];
            const amount = Math.floor(Math.random() * 200) + 50;

            await db.insert(expenseClaims).values({
                employeeId,
                date: new Date(),
                category: 'Travel',
                description: 'Taxi to client meeting',
                amount: amount.toString(),
                status: 'APPROVED',
                debitAccountId: accountMap['5000'],
                creditAccountId: accountMap['1000']
            });
            console.log(`Created Expense Claim by Emp ID: ${employeeId}`);
        }

        console.log('✅ Seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
