import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.DB_URL;
const pool = new pg.Pool({ connectionString: dbUrl });

async function run() {
  await pool.query(`
    INSERT INTO asset_types (code, name, useful_life_months, depreciation_method)
    VALUES 
      ('AB', 'Bangunan', 240, 'SLM'),
      ('AK', 'Kendaraan', 96, 'SLM'),
      ('AP', 'Perabotan / Peralatan', 48, 'SLM')
    ON CONFLICT (code) DO NOTHING;
  `);
  console.log("Seeded asset_types");
  await pool.end();
}
run();
