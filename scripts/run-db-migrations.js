#!/usr/bin/env node
/**
 * Run DB migrations against VPS PostgreSQL.
 * Uses DB_URL from .env - no psql required.
 *
 * Run: npm run migrate
 * Or:  node scripts/run-db-migrations.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MIGRATIONS = [
  'services/shared/drizzle/0001_api_structure_migration.sql',
  'services/shared/drizzle/0002_new_modules_basts_projects_tax_proposal.sql',
  'services/shared/drizzle/0003_users_columns.sql',
  'services/shared/drizzle/0004_add_missing_columns.sql',
  'services/shared/drizzle/0005_employees_columns.sql',
  'services/shared/drizzle/0007_clients_missing_columns.sql',
  'services/shared/drizzle/0008_clients_extend_for_supplier.sql',
  'services/shared/drizzle/0009_vendor_to_client_migration.sql',
  'services/shared/drizzle/0010_coreapps_2_project_tables.sql',
  'services/shared/drizzle/0011_alter_invoices_basts_proposal.sql',
  'services/shared/drizzle/0012_expense_phase.sql',
  'services/shared/drizzle/0013_asset_enhancements.sql',
  'services/shared/drizzle/0017_voucher_code_columns.sql',
  'services/shared/drizzle/0019_kas_kecil_coa_account.sql',
  'services/shared/drizzle/0020_nullable_asset_id.sql',
  'services/shared/drizzle/0021_finance_settings.sql',
];

async function run() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('❌ DB_URL not set in .env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new pg.Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 5000,
  });
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
    console.error('   Check DB_URL in .env and ensure PostgreSQL is running.');
    await pool.end();
    process.exit(1);
  }

  try {
    console.log('Connected. Running migrations...\n');
    for (const relPath of MIGRATIONS) {
      const fullPath = path.resolve(__dirname, '..', relPath);
      if (!existsSync(fullPath)) {
        console.warn(`⚠️  Skip (not found): ${relPath}`);
        continue;
      }

      process.stdout.write(`Running ${path.basename(relPath)}... `);
      const sql = readFileSync(fullPath, 'utf8');
      try {
        await client.query(sql);
      } catch (err) {
        if (err.code === '42710' || err.code === '42P07' || err.message?.includes('already exists')) {
          console.log('(skip: already exists)');
        } else {
          console.log('');
          console.error(`   Error: ${err.message}`);
          throw err;
        }
      }
      console.log('OK');
    }
    console.log('\n✅ All migrations completed');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
