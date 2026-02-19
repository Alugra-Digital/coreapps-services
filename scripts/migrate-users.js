#!/usr/bin/env node
/**
 * Add missing users table columns (email, full_name, role_id, is_active, updated_at)
 * Run: node scripts/migrate-users.js
 * Or: npm run migrate:users
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { readFileSync } from 'fs';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const sqlPath = path.join(__dirname, '../services/shared/drizzle/0003_users_columns.sql');
const sql = readFileSync(sqlPath, 'utf8');

const pool = new pg.Pool({ connectionString: process.env.DB_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✅ Users table migration completed');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
