#!/usr/bin/env node
/**
 * Seed login credentials for CoreApps ERP
 * Run: node scripts/seed-users.js
 * Or: npm run seed:users
 *
 * Seeds roles (idempotent upsert by code) then creates/updates users:
 *   admin         / Admin@123    (SUPER_ADMIN)
 *   hr_admin      / HrAdmin@123   (HR_ADMIN)
 *   finance_admin / Finance@123  (FINANCE_ADMIN)
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { PERMISSION_KEYS } from '../services/shared/constants/permissionKeys.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DB_URL });

const HR_ADMIN_PERMISSION_KEYS = [
  'dashboard',
  'hr',
  'hr.employees',
  'hr.positions',
  'access_control',
  'access_control.roles',
  'access_control.users',
];

const FINANCE_ADMIN_PERMISSION_KEYS = [
  'dashboard',
  'finance',
  'finance.accounting',
  'finance.invoice',
  'finance.payment',
  'finance.purchase-orders',
  'finance.clients',
  'finance.vendors',
  'finance.quotations',
  'finance.proposal-penawaran',
  'finance.perpajakan',
  'finance.bast',
  'access_control',
  'access_control.roles',
  'access_control.users',
  'reports',
];

const ROLES = [
  { code: 'SUPER_ADMIN', name: 'Super Administrator', permissionKeys: PERMISSION_KEYS },
  { code: 'HR_ADMIN', name: 'HR Administrator', permissionKeys: HR_ADMIN_PERMISSION_KEYS },
  { code: 'FINANCE_ADMIN', name: 'Finance Administrator', permissionKeys: FINANCE_ADMIN_PERMISSION_KEYS },
];

const USERS = [
  { username: 'admin', password: 'Admin@123', role: 'SUPER_ADMIN' },
  { username: 'hr_admin', password: 'HrAdmin@123', role: 'HR_ADMIN' },
  { username: 'finance_admin', password: 'Finance@123', role: 'FINANCE_ADMIN' },
];

async function ensureRolesTable() {
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'roles'
  `);
  const columns = rows.map((r) => r.column_name);
  if (rows.length === 0) {
    await pool.query(`
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        permission_keys JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    return;
  }
  const required = ['code', 'name', 'permission_keys', 'created_at', 'updated_at'];
  for (const col of required) {
    if (!columns.includes(col)) {
      const def = col === 'permission_keys' ? "JSONB DEFAULT '[]'" : col === 'created_at' || col === 'updated_at' ? 'TIMESTAMP DEFAULT NOW()' : 'TEXT';
      await pool.query(`ALTER TABLE roles ADD COLUMN IF NOT EXISTS ${col} ${def}`);
    }
  }
  if (!columns.includes('code')) {
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS roles_code_unique ON roles (code)`);
  }
}

async function seedRoles() {
  const roleIds = {};
  for (const r of ROLES) {
    const { rows } = await pool.query(
      `INSERT INTO roles (code, name, permission_keys, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW(), NOW())
       ON CONFLICT (code) DO UPDATE SET
         permission_keys = EXCLUDED.permission_keys,
         name = EXCLUDED.name,
         updated_at = NOW()
       RETURNING id`,
      [r.code, r.name, JSON.stringify(r.permissionKeys)]
    );
    roleIds[r.code] = rows[0].id;
  }
  return roleIds;
}

async function seedUsers(roleIds) {
  for (const u of USERS) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (username, password, role, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (username) DO UPDATE SET password = $2, role = $3
       RETURNING id`,
      [u.username, hashedPassword, u.role]
    );
    const roleId = roleIds[u.role];
    if (roleId) {
      await pool.query(
        `UPDATE users SET role_id = $1 WHERE username = $2`,
        [roleId, u.username]
      );
    }
    console.log(`   ✅ ${u.username} / ${u.password} [${u.role}]`);
  }
}

async function seedUsersAndRoles() {
  console.log('\n👤 Seeding roles and login credentials...\n');

  await ensureRolesTable();
  const roleIds = await seedRoles();
  console.log('   ✅ Roles seeded (SUPER_ADMIN, HR_ADMIN, FINANCE_ADMIN)\n');

  await seedUsers(roleIds);

  console.log('\n📋 Login credentials:\n');
  console.log('   | Username       | Password     | Role          |');
  console.log('   |----------------|--------------|---------------|');
  USERS.forEach((u) => {
    console.log(`   | ${u.username.padEnd(14)} | ${u.password.padEnd(12)} | ${u.role.padEnd(13)} |`);
  });
  console.log('\n   Use these to login at POST /api/auth/login\n');
}

seedUsersAndRoles()
  .then(() => pool.end())
  .catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  });
