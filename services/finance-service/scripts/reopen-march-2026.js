#!/usr/bin/env node
/**
 * Script to reopen March 2026 accounting period
 * Usage: node scripts/reopen-march-2026.js
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables - check multiple possible locations
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

async function reopenMarch2026Period() {
  try {
    console.log('Connecting to database...');
    await pool.connect();

    // Find the March 2026 period
    const selectResult = await pool.query(
      'SELECT id, status FROM accounting_periods WHERE year = 2026 AND month = 3'
    );

    if (selectResult.rows.length === 0) {
      console.log('No March 2026 period found. Creating one...');
      const insertResult = await pool.query(
        `INSERT INTO accounting_periods (year, month, status, created_at)
         VALUES (2026, 3, 'OPEN', NOW())
         RETURNING id, year, month, status`
      );
      console.log('March 2026 period created with status:', insertResult.rows[0].status);
    } else {
      const period = selectResult.rows[0];
      console.log(`Found March 2026 period (ID: ${period.id}) with status: ${period.status}`);

      if (period.status === 'OPEN') {
        console.log('Period is already OPEN. No action needed.');
      } else if (period.status === 'LOCKED') {
        console.log('ERROR: Period is LOCKED. Locked periods cannot be reopened via this script.');
        console.log('You may need to use the API with proper permissions to unlock it first.');
        process.exit(1);
      } else {
        // Reopen the period
        const updateResult = await pool.query(
          `UPDATE accounting_periods
           SET status = 'OPEN', reopened_at = NOW(), reopened_reason = 'Reopened via script - March 2026 should be open'
           WHERE id = $1
           RETURNING id, year, month, status, reopened_at`,
          [period.id]
        );
        console.log('Period reopened successfully!');
        console.log('Updated period:', updateResult.rows[0]);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

reopenMarch2026Period();
