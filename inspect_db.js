
import { db } from './services/shared/db/index.js';
import { sql } from 'drizzle-orm';

const inspect = async () => {
    try {
        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'invoices';
        `);
        console.log('Invoices Table Columns:', result.rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

inspect();
