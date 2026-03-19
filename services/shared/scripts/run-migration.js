import pg from 'pg';
const { Client } = pg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationPath = join(__dirname, '../drizzle/0018_asset_columns_fix.sql');
const sql = readFileSync(migrationPath, 'utf-8');

const client = new Client({
  connectionString: 'postgres://pgadmin:pgalgr123%21%40%23@103.74.5.159:5432/coreapps',
});

try {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Executing migration...');
  await client.query(sql);
  console.log('Migration completed successfully!');
  console.log('Added columns: asset_code, asset_type_code, specification, description, useful_life_months, salvage_value, department, vendor, attachment_url, coa_asset_account, coa_depreciation_expense_account, coa_accumulated_depreciation_account, deleted_at');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
