#!/usr/bin/env node
/**
 * Quick fix: Add missing clients columns only.
 * Use when create client returns 500 and full migrate hangs.
 *
 * Run: node scripts/migrate-clients-only.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('❌ DB_URL not set in .env');
    process.exit(1);
  }

  const migrationPath = path.resolve(__dirname, '../services/shared/drizzle/0007_clients_missing_columns.sql');
  if (!existsSync(migrationPath)) {
    console.error('❌ Migration file not found');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new pg.Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    const sql = readFileSync(migrationPath, 'utf8');
    await client.query(sql);
    client.release();
    console.log('✅ Clients columns migration completed');
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
