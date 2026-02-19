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
  'services/shared/drizzle/0003_users_columns.sql',
  'services/shared/drizzle/0002_new_modules_basts_projects_tax_proposal.sql',
  'services/shared/drizzle/0004_add_missing_columns.sql',
  'services/shared/drizzle/0005_employees_columns.sql',
];

async function run() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('❌ DB_URL not set in .env');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: dbUrl });
  const client = await pool.connect();

  try {
    for (const relPath of MIGRATIONS) {
      const fullPath = path.resolve(__dirname, '..', relPath);
      if (!existsSync(fullPath)) {
        console.warn(`⚠️  Skip (not found): ${relPath}`);
        continue;
      }

      const sql = readFileSync(fullPath, 'utf8');
      try {
        await client.query(sql);
      } catch (err) {
        if (err.code === '42710' || err.code === '42P07' || err.message?.includes('already exists')) {
          console.log(`   (skip: object already exists)`);
        } else {
          console.error(`   Error: ${err.message}`);
          throw err;
        }
      }
      console.log(`✅ ${path.basename(relPath)}`);
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
