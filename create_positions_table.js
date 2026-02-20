import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: 'postgres://pgadmin:pgalgr123%21%40%23@103.74.5.159:5432/coreapps'
});

async function run() {
    const client = await pool.connect();
    try {
        // Create table if not exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
        console.log('✅ positions table ready');

        const { rows: count } = await client.query('SELECT COUNT(*) AS n FROM positions');
        const n = parseInt(count[0].n, 10);
        console.log('Count:', n);

        if (n === 0) {
            const jobs = [
                ['DIREKTUR', 'DIR', 'Direktur Utama'],
                ['Manajemen Operation', 'MO', 'Manajemen Operasional'],
                ['Project Manager', 'PM', 'Manajer Proyek'],
                ['SA', 'SA', 'System Analyst'],
                ['Secretary Office', 'SEC', 'Sekretaris Kantor'],
                ['HR GA', 'HRG', 'Human Resources & General Affairs'],
                ['Finance Accounting', 'FA', 'Keuangan dan Akuntansi'],
                ['Technical Writer', 'TW', 'Penulis Teknis'],
                ['Tenaga Ahli', 'TA', 'Tenaga Ahli'],
                ['EOS Oracle', 'EO', 'EOS Oracle'],
                ['EOS Ticketing', 'ET', 'EOS Ticketing'],
                ['EOS Unsoed', 'EU', 'EOS Unsoed'],
            ];
            for (const [name, code, desc] of jobs) {
                await client.query(
                    'INSERT INTO positions (name, code, description, is_active) VALUES ($1, $2, $3, TRUE)',
                    [name, code, desc]
                );
            }
            console.log(`✅ Seeded ${jobs.length} positions`);
        }

        const { rows } = await client.query('SELECT id, name, code, is_active FROM positions ORDER BY id');
        console.log('Positions:');
        for (const r of rows) console.log(`  [${r.id}] ${r.name} (${r.code ?? '-'}) active=${r.is_active}`);
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
